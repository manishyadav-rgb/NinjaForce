import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

async function ensureCustomerWishlistTables() {
  await query(`
    create table if not exists customer_wishlists (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null unique references users(id) on delete cascade,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists customer_wishlist_items (
      id uuid primary key default gen_random_uuid(),
      wishlist_id uuid not null references customer_wishlists(id) on delete cascade,
      product_slug varchar(260) not null,
      product_title varchar(220) not null,
      product_image text,
      unit_price numeric(12,2),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (wishlist_id, product_slug)
    )
  `);
}

export async function GET(request: NextRequest) {
  const guard = await requirePermission(request, "customers.view");
  if (guard.response) return guard.response;

  try {
    await ensureCustomerWishlistTables();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    let sql = `
      select
        u.id,
        u.phone_e164,
        u.full_name,
        u.email,
        u.created_at,
        coalesce(o.total_orders, 0) as total_orders,
        coalesce(o.paid_orders_count, 0) as paid_orders_count,
        coalesce(o.pending_orders_count, 0) as pending_orders_count,
        o.latest_payment_status,
        coalesce(cart.cart_items, '[]'::json) as cart_items,
        coalesce(wish.wishlist_items, '[]'::json) as wishlist_items
      from users u
      left join (
        select
          user_id,
          count(*) as total_orders,
          count(*) filter (where payment_status = 'paid') as paid_orders_count,
          count(*) filter (where payment_status = 'pending') as pending_orders_count,
          (array_agg(payment_status order by created_at desc))[1] as latest_payment_status
        from customer_orders
        group by user_id
      ) o on o.user_id = u.id
      left join lateral (
        select json_agg(json_build_object(
          'product_slug', cci.product_slug,
          'product_title', cci.product_title,
          'product_image', cci.product_image,
          'unit_price', cci.unit_price::text,
          'quantity', cci.quantity
        )) as cart_items
        from customer_carts cc
        join customer_cart_items cci on cci.cart_id = cc.id
        where cc.user_id = u.id
      ) cart on true
      left join lateral (
        select json_agg(json_build_object(
          'product_slug', cwi.product_slug,
          'product_title', cwi.product_title,
          'product_image', cwi.product_image,
          'unit_price', cwi.unit_price::text
        )) as wishlist_items
        from customer_wishlists cw
        join customer_wishlist_items cwi on cwi.wishlist_id = cw.id
        where cw.user_id = u.id
      ) wish on true
    `;

    const params: unknown[] = [];
    if (search.trim()) {
      sql += ` where u.full_name ilike $1 or u.phone_e164 ilike $1 or u.email ilike $1`;
      params.push(`%${search.trim()}%`);
    }

    sql += ` order by u.created_at desc`;

    const customersResult = await query(sql, params);

    return NextResponse.json({ customers: customersResult.rows });
  } catch (error) {
    console.error("GET /api/admin/customers error:", error);
    return NextResponse.json({ error: "Failed to fetch customer data" }, { status: 500 });
  }
}
