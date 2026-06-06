import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { query } from "@/lib/db";

export const runtime = "nodejs";

async function ensureOrderDiscountColumns() {
  await query("alter table customer_orders add column if not exists coupon_code varchar(80)");
  await query("alter table customer_orders add column if not exists discount_total numeric(12,2) not null default 0");
  await query("alter table customer_orders add column if not exists discount_percent numeric(7,2)");
}

export async function GET(request: NextRequest) {
  const guard = await requirePermission(request, "orders.view");
  if (guard.response) return guard.response;

  try {
    await ensureOrderDiscountColumns();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    // ─── 1. Calculating IST-Bound Metrics ───
    const now = new Date();
    // Indian Standard Time (UTC +5.5 hours)
    const tempIST = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const yyyy = tempIST.getUTCFullYear();
    const mm = tempIST.getUTCMonth();
    const dd = tempIST.getUTCDate();

    const todayStart = new Date(Date.UTC(yyyy, mm, dd, 0, 0, 0) - 5.5 * 60 * 60 * 1000);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayEnd = todayStart;

    const todayResult = await query<{ count: string; revenue: string }>(
      `select count(*) as count, coalesce(sum(grand_total), 0) as revenue
       from customer_orders
       where created_at >= $1 and created_at < $2`,
      [todayStart.toISOString(), todayEnd.toISOString()]
    );

    const yesterdayResult = await query<{ count: string; revenue: string }>(
      `select count(*) as count, coalesce(sum(grand_total), 0) as revenue
       from customer_orders
       where created_at >= $1 and created_at < $2`,
      [yesterdayStart.toISOString(), yesterdayEnd.toISOString()]
    );

    const metrics = {
      today: {
        count: parseInt(todayResult.rows[0]?.count || "0", 10),
        revenue: parseFloat(todayResult.rows[0]?.revenue || "0"),
      },
      yesterday: {
        count: parseInt(yesterdayResult.rows[0]?.count || "0", 10),
        revenue: parseFloat(yesterdayResult.rows[0]?.revenue || "0"),
      },
    };

    // ─── 2. Parsing Date Bounds ───
    let startBound = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    let endBound = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow limit

    if (startDate) {
      startBound = new Date(`${startDate}T00:00:00+05:30`);
    }
    if (endDate) {
      endBound = new Date(`${endDate}T23:59:59+05:30`);
    }

    // ─── 3. Paginated Order Fetch ───
    const countResult = await query<{ count: string }>(
      `select count(*) as count
       from customer_orders
       where created_at >= $1 and created_at <= $2`,
      [startBound.toISOString(), endBound.toISOString()]
    );
    const totalCount = parseInt(countResult.rows[0]?.count || "0", 10);

    const ordersResult = await query(
      `select
        co.id,
        co.order_number,
        co.status,
        co.payment_status,
        co.subtotal::text as subtotal,
        co.discount_total::text as discount_total,
        co.discount_percent::text as discount_percent,
        co.coupon_code,
        co.shipping_total::text as shipping_total,
        co.grand_total::text as grand_total,
        co.shipping_name,
        co.shipping_phone,
        co.shipping_address,
        co.shipping_city,
        co.shipping_state,
        co.shipping_pincode,
        co.notes,
        co.placed_at,
        co.created_at,
        u.full_name as customer_name,
        u.phone_e164 as customer_phone,
        u.email as customer_email,
        (
          select json_agg(json_build_object(
            'product_slug', coi.product_slug,
            'product_title', coi.product_title,
            'product_image', coi.product_image,
            'unit_price', coi.unit_price::text,
            'quantity', coi.quantity,
            'line_total', coi.line_total::text
          ))
          from customer_order_items coi
          where coi.order_id = co.id
        ) as items
      from customer_orders co
      left join users u on co.user_id = u.id
      where co.created_at >= $1 and co.created_at <= $2
      order by co.created_at desc
      limit $3 offset $4`,
      [startBound.toISOString(), endBound.toISOString(), limit, offset]
    );

    return NextResponse.json({
      metrics,
      orders: ordersResult.rows,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders data" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const guard = await requirePermission(request, "orders.status.update");
  if (guard.response) return guard.response;

  try {
    const body = await request.json();
    const orderId = String(body?.orderId || "").trim();
    const status = String(body?.status || "").trim().toLowerCase();

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const allowed = new Set(["accepted", "processing", "completed", "cancelled"]);
    if (!allowed.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const result = await query<{ id: string; status: string }>(
      `update customer_orders
       set status = $2, updated_at = now()
       where id = $1
       returning id, status`,
      [orderId, status],
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await logAdminActivity(request, {
      id: guard.user!.id,
      email: guard.user!.email,
      fullName: guard.user!.full_name,
      role: guard.user!.role,
    }, {
      module: "orders",
      action: "status.update",
      entityType: "order",
      entityId: orderId,
      entityLabel: result.rows[0].id,
      message: `Updated order status to ${status}.`,
      metadata: { status },
    });

    return NextResponse.json({ ok: true, order: result.rows[0] });
  } catch (error) {
    console.error("PATCH /api/admin/orders error:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
