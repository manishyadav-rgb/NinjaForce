import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";

type CountRow = { count: string };
type SummaryRow = {
  orders: string;
  revenue: string;
  subtotal: string;
  discounts: string;
  shipping: string;
  customers: string;
};

async function tableExists(tableName: string) {
  const result = await query<{ exists: boolean }>("select to_regclass($1) is not null as exists", [tableName]);
  return Boolean(result.rows[0]?.exists);
}

async function ensureOrderColumns() {
  if (!(await tableExists("customer_orders"))) return false;
  await query("alter table customer_orders add column if not exists discount_total numeric(12,2) not null default 0");
  await query("alter table customer_orders add column if not exists shipping_total numeric(12,2) not null default 0");
  await query("alter table customer_orders add column if not exists payment_status varchar(30) not null default 'pending'");
  return true;
}

function rangeStart(days: number) {
  const now = new Date();
  return new Date(now.getTime() - Math.max(1, days - 1) * 24 * 60 * 60 * 1000);
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export async function GET(request: NextRequest) {
  try {
    const hasOrders = await ensureOrderColumns();
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let start: Date;
    let now: Date;
    let days: number;

    if (startDateParam && endDateParam) {
      start = new Date(startDateParam);
      now = new Date(endDateParam);
      start.setHours(0, 0, 0, 0);
      now.setHours(23, 59, 59, 999);
      const diffTime = Math.abs(now.getTime() - start.getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else {
      const daysParam = Math.min(Math.max(Number(searchParams.get("days") || 30), 7), 180);
      days = daysParam;
      start = rangeStart(days);
      now = new Date();
    }

    const previousStart = new Date(start.getTime() - (now.getTime() - start.getTime()));

    const empty = {
      summary: {
        revenue: 0,
        orders: 0,
        avgOrderValue: 0,
        customers: 0,
        discounts: 0,
        shipping: 0,
        revenueChange: 0,
        ordersChange: 0,
      },
      timeline: [],
      statusBreakdown: [],
      paymentBreakdown: [],
      topProducts: [],
      categorySales: [],
      citySales: [],
      recentOrders: [],
      inventory: { products: 0, categories: 0, collections: 0 },
    };

    if (!hasOrders) return NextResponse.json(empty);

    const [summaryResult, previousResult] = await Promise.all([
      query<SummaryRow>(
        `select
           count(*)::text as orders,
           coalesce(sum(grand_total), 0)::text as revenue,
           coalesce(sum(subtotal), 0)::text as subtotal,
           coalesce(sum(discount_total), 0)::text as discounts,
           coalesce(sum(shipping_total), 0)::text as shipping,
           count(distinct user_id)::text as customers
         from customer_orders
         where created_at >= $1 and created_at <= $2`,
        [start.toISOString(), now.toISOString()],
      ),
      query<SummaryRow>(
        `select
           count(*)::text as orders,
           coalesce(sum(grand_total), 0)::text as revenue,
           coalesce(sum(subtotal), 0)::text as subtotal,
           coalesce(sum(discount_total), 0)::text as discounts,
           coalesce(sum(shipping_total), 0)::text as shipping,
           count(distinct user_id)::text as customers
         from customer_orders
         where created_at >= $1 and created_at < $2`,
        [previousStart.toISOString(), start.toISOString()],
      ),
    ]);

    const summaryRow = summaryResult.rows[0] || {};
    const previousRow = previousResult.rows[0] || {};
    const orders = Number(summaryRow.orders || 0);
    const revenue = Number(summaryRow.revenue || 0);
    const previousOrders = Number(previousRow.orders || 0);
    const previousRevenue = Number(previousRow.revenue || 0);

    const timeline = await query<{
      date: string;
      day: string;
      revenue: string;
      orders: string;
      avg_order: string;
    }>(
      `select
         day::date::text as date,
         to_char(day::date, 'DD Mon') as day,
         coalesce(sum(co.grand_total), 0)::text as revenue,
         count(co.id)::text as orders,
         coalesce(avg(co.grand_total), 0)::text as avg_order
       from generate_series($1::date, $2::date, interval '1 day') day
       left join customer_orders co on co.created_at::date = day::date
       group by day
       order by day::date asc`,
      [start.toISOString().slice(0, 10), now.toISOString().slice(0, 10)],
    );

    const [hasOrderItems, hasProducts, hasCategories, hasProductCategoryMap, hasCollections] = await Promise.all([
      tableExists("customer_order_items"),
      tableExists("products"),
      tableExists("categories"),
      tableExists("product_category_map"),
      tableExists("collections"),
    ]);
    const canReadCategorySales = hasOrderItems && hasProducts && hasCategories && hasProductCategoryMap;

    const [statusBreakdown, paymentBreakdown, topProducts, categorySales, citySales, recentOrders] = await Promise.all([
      query<{ label: string; value: string; revenue: string }>(
        `select coalesce(nullif(status, ''), 'pending') as label,
                count(*)::text as value,
                coalesce(sum(grand_total), 0)::text as revenue
         from customer_orders
         where created_at >= $1 and created_at <= $2
         group by label
         order by count(*) desc`,
        [start.toISOString(), now.toISOString()],
      ),
      query<{ label: string; value: string; revenue: string }>(
        `select coalesce(nullif(payment_status, ''), 'pending') as label,
                count(*)::text as value,
                coalesce(sum(grand_total), 0)::text as revenue
         from customer_orders
         where created_at >= $1 and created_at <= $2
         group by label
         order by count(*) desc`,
        [start.toISOString(), now.toISOString()],
      ),
      hasOrderItems
        ? query<{ title: string; quantity: string; revenue: string }>(
            `select
               coalesce(nullif(coi.product_title, ''), coi.product_slug, 'Unknown product') as title,
               coalesce(sum(coi.quantity), 0)::text as quantity,
               coalesce(sum(coi.line_total), 0)::text as revenue
             from customer_order_items coi
             join customer_orders co on co.id = coi.order_id
             where co.created_at >= $1 and co.created_at <= $2
             group by title
             order by sum(coi.line_total) desc nulls last, sum(coi.quantity) desc
             limit 8`,
            [start.toISOString(), now.toISOString()],
          )
        : Promise.resolve({ rows: [] }),
      canReadCategorySales
        ? query<{ label: string; revenue: string; quantity: string }>(
            `select
               coalesce(c.name, p.slug, 'Uncategorised') as label,
               coalesce(sum(coi.line_total), 0)::text as revenue,
               coalesce(sum(coi.quantity), 0)::text as quantity
             from customer_order_items coi
             join customer_orders co on co.id = coi.order_id
             left join products p on p.slug = coi.product_slug
             left join product_category_map pcm on pcm.product_id = p.id
             left join categories c on c.id = pcm.category_id
             where co.created_at >= $1 and co.created_at <= $2
             group by label
             order by sum(coi.line_total) desc nulls last
             limit 6`,
            [start.toISOString(), now.toISOString()],
          )
        : Promise.resolve({ rows: [] }),
      query<{ city: string; orders: string; revenue: string; customers: string }>(
        `select
           coalesce(nullif(trim(shipping_city), ''), 'Unknown') as city,
           count(*)::text as orders,
           coalesce(sum(grand_total), 0)::text as revenue,
           count(distinct user_id)::text as customers
         from customer_orders
         where created_at >= $1 and created_at <= $2
         group by city
         order by sum(grand_total) desc nulls last, count(*) desc
         limit 10`,
        [start.toISOString(), now.toISOString()],
      ),
      query<{
        order_number: string;
        status: string;
        payment_status: string;
        grand_total: string;
        created_at: string;
        shipping_name: string | null;
      }>(
        `select order_number, status, payment_status, grand_total::text, created_at::text, shipping_name
         from customer_orders
         order by created_at desc
         limit 8`,
      ),
    ]);

    const [productCount, categoryCount, collectionCount] = await Promise.all([
      hasProducts ? query<CountRow>("select count(*)::text as count from products") : Promise.resolve({ rows: [{ count: "0" }] }),
      hasCategories ? query<CountRow>("select count(*)::text as count from categories") : Promise.resolve({ rows: [{ count: "0" }] }),
      hasCollections ? query<CountRow>("select count(*)::text as count from collections") : Promise.resolve({ rows: [{ count: "0" }] }),
    ]);

    return NextResponse.json({
      summary: {
        revenue,
        orders,
        avgOrderValue: orders > 0 ? revenue / orders : 0,
        customers: Number(summaryRow.customers || 0),
        discounts: Number(summaryRow.discounts || 0),
        shipping: Number(summaryRow.shipping || 0),
        revenueChange: pctChange(revenue, previousRevenue),
        ordersChange: pctChange(orders, previousOrders),
      },
      timeline: timeline.rows.map((row) => ({
        date: row.date,
        day: row.day,
        revenue: Number(row.revenue || 0),
        orders: Number(row.orders || 0),
        avgOrder: Number(row.avg_order || 0),
      })),
      statusBreakdown: statusBreakdown.rows.map((row) => ({ label: row.label, value: Number(row.value || 0), revenue: Number(row.revenue || 0) })),
      paymentBreakdown: paymentBreakdown.rows.map((row) => ({ label: row.label, value: Number(row.value || 0), revenue: Number(row.revenue || 0) })),
      topProducts: topProducts.rows.map((row) => ({ title: row.title, quantity: Number(row.quantity || 0), revenue: Number(row.revenue || 0) })),
      categorySales: categorySales.rows.map((row) => ({ label: row.label, quantity: Number(row.quantity || 0), revenue: Number(row.revenue || 0) })),
      citySales: citySales.rows.map((row) => ({
        city: row.city,
        orders: Number(row.orders || 0),
        revenue: Number(row.revenue || 0),
        customers: Number(row.customers || 0),
      })),
      recentOrders: recentOrders.rows.map((row) => ({
        orderNumber: row.order_number,
        customer: row.shipping_name || "Customer",
        status: row.status || "pending",
        paymentStatus: row.payment_status || "pending",
        revenue: Number(row.grand_total || 0),
        createdAt: row.created_at,
      })),
      inventory: {
        products: Number(productCount.rows[0]?.count || 0),
        categories: Number(categoryCount.rows[0]?.count || 0),
        collections: Number(collectionCount.rows[0]?.count || 0),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/analytics error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
