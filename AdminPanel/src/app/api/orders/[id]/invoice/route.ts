import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Order id is required" }, { status: 400 });

  const orderResult = await query<{
    id: string;
    order_number: string;
    status: string;
    created_at: string;
    subtotal: string;
    discount_total: string;
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
  }>(
    `select id, order_number, status, created_at, subtotal::text, discount_total::text, discount_percent::text, coupon_code,
            shipping_total::text, grand_total::text,
            shipping_name, shipping_phone, shipping_address, shipping_city, shipping_state, shipping_pincode
     from customer_orders
     where id = $1 and user_id = $2
     limit 1`,
    [id, auth.sub],
  );

  const order = orderResult.rows[0];
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const status = String(order.status || "").toLowerCase();
  if (status !== "accepted" && status !== "completed") {
    return NextResponse.json({ error: "Invoice available after order acceptance" }, { status: 400 });
  }

  const itemsResult = await query<{
    product_title: string;
    quantity: number;
    unit_price: string;
    line_total: string;
  }>(
    `select product_title, quantity, unit_price::text, line_total::text
     from customer_order_items
     where order_id = $1`,
    [id],
  );

  const lines = [
    `Invoice: ${order.order_number}`,
    `Date: ${new Date(order.created_at).toLocaleString("en-IN")}`,
    `Status: ${order.status}`,
    "",
    `Customer: ${order.shipping_name || "-"}`,
    `Phone: ${order.shipping_phone || "-"}`,
    `Address: ${order.shipping_address || "-"}, ${order.shipping_city || ""}, ${order.shipping_state || ""} ${order.shipping_pincode || ""}`.trim(),
    "",
    "Items:",
    ...itemsResult.rows.map(
      (i, idx) => `${idx + 1}. ${i.product_title} | Qty: ${i.quantity} | Unit: Rs. ${i.unit_price} | Total: Rs. ${i.line_total}`,
    ),
    "",
    `Subtotal: Rs. ${order.subtotal}`,
    ...(Number(order.discount_total || "0") > 0
      ? [
          `Coupon: ${order.coupon_code || "-"}` + (order.discount_percent ? ` (${order.discount_percent}% OFF)` : ""),
          `Discount: -Rs. ${order.discount_total}`,
        ]
      : []),
    `Shipping: Rs. ${order.shipping_total}`,
    `Grand Total: Rs. ${order.grand_total}`,
  ];

  const body = lines.join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="invoice-${order.order_number}.txt"`,
      "Cache-Control": "no-store",
    },
  });
}
