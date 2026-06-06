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

type EarnableOrderRow = {
  id: string;
  order_number: string;
  grand_total: string;
};

async function ensureRewardsTables() {
  await query(`
    create table if not exists customer_reward_transactions (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references users(id) on delete cascade,
      order_id uuid references customer_orders(id) on delete set null,
      type varchar(20) not null check (type in ('earn', 'redeem', 'adjust')),
      coins integer not null,
      note text,
      coupon_code varchar(60),
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      unique (user_id, order_id, type)
    )
  `);
  await query("alter table customer_reward_transactions add column if not exists coupon_code varchar(60)");
  await query("alter table customer_reward_transactions add column if not exists metadata jsonb not null default '{}'::jsonb");
  await query(`
    create table if not exists discount_coupons (
      id uuid primary key default gen_random_uuid(),
      site_id varchar(80) not null default 'quirkyhome',
      code varchar(60) not null,
      discount_type varchar(20) not null check (discount_type in ('percent', 'flat')),
      discount_value numeric(12,2) not null,
      min_order_amount numeric(12,2),
      max_discount_amount numeric(12,2),
      starts_at timestamptz,
      ends_at timestamptz,
      is_active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (site_id, code)
    )
  `);
  await query("alter table discount_coupons add column if not exists user_id uuid references users(id) on delete cascade");
  await query("alter table discount_coupons add column if not exists source varchar(40) not null default 'manual'");
  await query("alter table discount_coupons add column if not exists is_single_use boolean not null default false");
  await query("alter table discount_coupons add column if not exists used_at timestamptz");
  await query("alter table discount_coupons add column if not exists used_order_id uuid references customer_orders(id) on delete set null");
}

async function syncCustomerRewards(userId: string) {
  const orders = await query<EarnableOrderRow>(
    `select id, order_number, grand_total::text
     from customer_orders
     where user_id = $1
       and lower(coalesce(status, '')) not in ('cancelled', 'canceled', 'refunded')
       and coalesce(grand_total, 0) > 0
     order by created_at desc
     limit 100`,
    [userId],
  );

  for (const order of orders.rows) {
    const coins = Math.floor(Number(order.grand_total || 0) * 0.02);
    if (coins <= 0) continue;
    await query(
      `insert into customer_reward_transactions (user_id, order_id, type, coins, note)
       values ($1, $2, 'earn', $3, $4)
       on conflict (user_id, order_id, type) do nothing`,
      [userId, order.id, coins, `Reward coins earned on order ${order.order_number}`],
    );
  }
}

interface CustomerRow {
  id: string;
  phone_e164: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  total_orders: number;
  paid_orders_count: number;
  pending_orders_count: number;
  latest_payment_status: string | null;
  cart_items: unknown[];
  wishlist_items: unknown[];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission(request, "customers.view");
  if (guard.response) return guard.response;

  try {
    await ensureCustomerWishlistTables();
    await ensureRewardsTables();
    const resolvedParams = await context.params;
    const rawId = resolvedParams?.id;
    const customerId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!customerId) {
      return NextResponse.json({ error: "Customer id is required" }, { status: 400 });
    }

    const customerResult = await query<CustomerRow>(
      `
      select
        u.id,
        u.phone_e164,
        u.full_name,
        u.email,
        u.created_at,
        coalesce(o.total_orders, 0)::int as total_orders,
        coalesce(o.paid_orders_count, 0)::int as paid_orders_count,
        coalesce(o.pending_orders_count, 0)::int as pending_orders_count,
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
      where u.id = $1
      limit 1
      `,
      [customerId]
    );

    if (!customerResult.rows[0]) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    await syncCustomerRewards(customerId);

    const ordersResult = await query(
      `
      select
        co.id,
        co.order_number,
        co.status,
        co.payment_status,
        co.subtotal::text as subtotal,
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
        (
          select coalesce(json_agg(json_build_object(
            'product_slug', coi.product_slug,
            'product_title', coi.product_title,
            'product_image', coi.product_image,
            'unit_price', coi.unit_price::text,
            'quantity', coi.quantity,
            'line_total', coi.line_total::text
          )), '[]'::json)
          from customer_order_items coi
          where coi.order_id = co.id
        ) as items
      from customer_orders co
      where co.user_id = $1
      order by co.created_at desc
      `,
      [customerId]
    );

    const rewardsResult = await query<{
      balance: string;
      earned: string;
      redeemed: string;
      reward_coupon_count: string;
      unused_reward_coupon_count: string;
    }>(
      `select
         coalesce((select sum(coins) from customer_reward_transactions where user_id = $1), 0)::text as balance,
         coalesce((select sum(coins) from customer_reward_transactions where user_id = $1 and type = 'earn' and coins > 0), 0)::text as earned,
         abs(coalesce((select sum(coins) from customer_reward_transactions where user_id = $1 and type = 'redeem' and coins < 0), 0))::text as redeemed,
         coalesce((select count(*) from discount_coupons where user_id = $1 and source = 'rewards'), 0)::text as reward_coupon_count,
         coalesce((select count(*) from discount_coupons where user_id = $1 and source = 'rewards' and is_active = true and used_at is null), 0)::text as unused_reward_coupon_count`,
      [customerId],
    );
    const rewards = rewardsResult.rows[0] || {
      balance: "0",
      earned: "0",
      redeemed: "0",
      reward_coupon_count: "0",
      unused_reward_coupon_count: "0",
    };

    return NextResponse.json({
      customer: customerResult.rows[0],
      orders: ordersResult.rows,
      rewards: {
        balance: Number(rewards.balance || 0),
        earned: Number(rewards.earned || 0),
        redeemed: Number(rewards.redeemed || 0),
        rewardCouponCount: Number(rewards.reward_coupon_count || 0),
        unusedRewardCouponCount: Number(rewards.unused_reward_coupon_count || 0),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/customers/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch customer details" }, { status: 500 });
  }
}
