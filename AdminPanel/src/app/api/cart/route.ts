import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

export const runtime = "nodejs";

type CartRow = { id: string };
type CartItemRow = {
  id: string;
  product_slug: string;
  product_title: string;
  product_image: string | null;
  unit_price: string;
  mrp: string | null;
  quantity: number;
};

async function getOrCreateCart(userId: string): Promise<string> {
  const existing = await query<CartRow>(
    "select id from customer_carts where user_id = $1 limit 1",
    [userId],
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const created = await query<CartRow>(
    "insert into customer_carts (user_id) values ($1) returning id",
    [userId],
  );
  return created.rows[0].id;
}

// GET - Get cart items
export async function GET() {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const cartId = await getOrCreateCart(auth.sub);
  const items = await query<CartItemRow>(
    `select id, product_slug, product_title, product_image, 
            unit_price::text, mrp::text, quantity 
     from customer_cart_items 
     where cart_id = $1 
     order by created_at`,
    [cartId],
  );

  return NextResponse.json({ items: items.rows });
}

// POST - Add/update item in cart
export async function POST(request: Request) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { slug, title, image, price, mrp, quantity = 1 } = body;

  if (!slug || !title || !price) {
    return NextResponse.json({ error: "slug, title, and price are required" }, { status: 400 });
  }

  const cartId = await getOrCreateCart(auth.sub);

  await query(
    `insert into customer_cart_items (cart_id, product_slug, product_title, product_image, unit_price, mrp, quantity)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (cart_id, product_slug) do update
     set quantity = customer_cart_items.quantity + $7,
         unit_price = $5,
         product_title = $3,
         product_image = $4,
         updated_at = now()`,
    [cartId, slug, title, image, price, mrp, quantity],
  );

  await query("update customer_carts set updated_at = now() where id = $1", [cartId]);

  return NextResponse.json({ ok: true });
}

// PATCH - Update quantity
export async function PATCH(request: Request) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { slug, quantity } = body;

  if (!slug || typeof quantity !== "number") {
    return NextResponse.json({ error: "slug and quantity required" }, { status: 400 });
  }

  const cartId = await getOrCreateCart(auth.sub);

  if (quantity <= 0) {
    await query(
      "delete from customer_cart_items where cart_id = $1 and product_slug = $2",
      [cartId, slug],
    );
  } else {
    await query(
      "update customer_cart_items set quantity = $3, updated_at = now() where cart_id = $1 and product_slug = $2",
      [cartId, slug, Math.min(quantity, 20)],
    );
  }

  return NextResponse.json({ ok: true });
}

// DELETE - Remove item or clear cart
export async function DELETE(request: Request) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  const cartId = await getOrCreateCart(auth.sub);

  if (slug) {
    await query(
      "delete from customer_cart_items where cart_id = $1 and product_slug = $2",
      [cartId, slug],
    );
  } else {
    // Clear entire cart
    await query("delete from customer_cart_items where cart_id = $1", [cartId]);
  }

  return NextResponse.json({ ok: true });
}
