import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

export const runtime = "nodejs";

type CartItemRow = {
  product_slug: string;
  product_title: string;
  product_image: string | null;
  unit_price: string;
  quantity: number;
};

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: string;
  discount_total: string | null;
  discount_percent: string | null;
  coupon_code: string | null;
  shipping_total: string;
  grand_total: string;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_pincode: string | null;
  placed_at: string;
  created_at: string;
};

function generateOrderNumber() {
  const date = new Date();
  const prefix = `QH${date.getFullYear().toString().slice(2)}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const random = randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${random}`;
}

async function ensureOrderDiscountColumns() {
  await query("alter table customer_orders add column if not exists coupon_code varchar(80)");
  await query("alter table customer_orders add column if not exists discount_total numeric(12,2) not null default 0");
  await query("alter table customer_orders add column if not exists discount_percent numeric(7,2)");
}

// GET - List user's orders
export async function GET() {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  await ensureOrderDiscountColumns();

  const orders = await query<OrderRow>(
    `select id, order_number, status, payment_status, subtotal::text, discount_total::text, discount_percent::text, coupon_code,
            shipping_total::text, grand_total::text, shipping_name, shipping_phone, shipping_address, shipping_city, shipping_state, shipping_pincode,
            placed_at, created_at
     from customer_orders
     where user_id = $1
     order by created_at desc
     limit 50`,
    [auth.sub],
  );

  const result = [];
  for (const order of orders.rows) {
    const items = await query(
      `select product_slug, product_title, product_image, unit_price::text, quantity, line_total::text
       from customer_order_items where order_id = $1`,
      [order.id],
    );
    result.push({ ...order, items: items.rows });
  }

  return NextResponse.json({ orders: result });
}

// POST - Place a new order from cart
export async function POST(request: Request) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { name, phone, address, city, state, pincode, notes, couponCode } = body;

  if (!name || !phone || !address || !city || !state || !pincode) {
    return NextResponse.json({ error: "Complete shipping address is required." }, { status: 400 });
  }
  await ensureOrderDiscountColumns();

  const cartResult = await query<{ id: string }>(
    "select id from customer_carts where user_id = $1 limit 1",
    [auth.sub],
  );
  if (!cartResult.rows[0]) return NextResponse.json({ error: "Cart is empty." }, { status: 400 });

  const cartItems = await query<CartItemRow>(
    `select product_slug, product_title, product_image, unit_price::text, quantity
     from customer_cart_items where cart_id = $1`,
    [cartResult.rows[0].id],
  );
  if (cartItems.rows.length === 0) return NextResponse.json({ error: "Cart is empty." }, { status: 400 });

  const subtotal = cartItems.rows.reduce((sum, item) => sum + (parseFloat(item.unit_price) * item.quantity), 0);
  let discountTotal = 0;
  let discountPercent: number | null = null;
  let appliedCoupon: string | null = null;

  if (couponCode && String(couponCode).trim()) {
    const code = String(couponCode).trim().toUpperCase();
    const couponResult = await query<{
      code: string;
      discount_type: "percent" | "flat";
      discount_value: string;
      min_order_amount: string | null;
      max_discount_amount: string | null;
    }>(
      `select code, discount_type, discount_value::text, min_order_amount::text, max_discount_amount::text
       from discount_coupons
       where upper(code) = $1
         and is_active = true
         and (starts_at is null or starts_at <= now())
         and (ends_at is null or ends_at >= now())
       limit 1`,
      [code],
    );

    const c = couponResult.rows[0];
    if (c) {
      const minOrder = Number(c.min_order_amount || 0);
      if (subtotal >= minOrder) {
        if (c.discount_type === "percent") {
          discountTotal = (subtotal * Number(c.discount_value || 0)) / 100;
          const maxCap = Number(c.max_discount_amount || 0);
          if (maxCap > 0) discountTotal = Math.min(discountTotal, maxCap);
          discountPercent = Number(c.discount_value || 0);
        } else {
          discountTotal = Number(c.discount_value || 0);
          discountPercent = subtotal > 0 ? Number(((discountTotal / subtotal) * 100).toFixed(2)) : null;
        }
        discountTotal = Math.max(0, Math.min(discountTotal, subtotal));
        appliedCoupon = c.code;
      }
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discountTotal);
  const shippingTotal = subtotal >= 499 ? 0 : 49;
  const grandTotal = discountedSubtotal + shippingTotal;
  const orderNumber = generateOrderNumber();

  const orderResult = await query<{ id: string }>(
    `insert into customer_orders (order_number, user_id, subtotal, discount_total, discount_percent, coupon_code, shipping_total, grand_total, 
     shipping_name, shipping_phone, shipping_address, shipping_city, shipping_state, shipping_pincode, notes)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     returning id`,
    [orderNumber, auth.sub, subtotal, discountTotal, discountPercent, appliedCoupon, shippingTotal, grandTotal, name, phone, address, city, state, pincode, notes || null],
  );
  const orderId = orderResult.rows[0].id;

  for (const item of cartItems.rows) {
    const lineTotal = parseFloat(item.unit_price) * item.quantity;
    await query(
      `insert into customer_order_items (order_id, product_slug, product_title, product_image, unit_price, quantity, line_total)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [orderId, item.product_slug, item.product_title, item.product_image, item.unit_price, item.quantity, lineTotal],
    );
  }

  await query("delete from customer_cart_items where cart_id = $1", [cartResult.rows[0].id]);

  return NextResponse.json({
    ok: true,
    order: {
      id: orderId,
      orderNumber,
      grandTotal,
      status: "pending",
      couponCode: appliedCoupon,
      discountTotal,
      discountPercent,
    },
  });
}
