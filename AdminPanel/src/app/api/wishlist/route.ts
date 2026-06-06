import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

type WishlistRow = { id: string };

async function ensureWishlistTables() {
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

  await query("create index if not exists idx_customer_wishlist_items_wishlist on customer_wishlist_items(wishlist_id)");
}

async function getOrCreateWishlist(userId: string): Promise<string> {
  const existing = await query<WishlistRow>("select id from customer_wishlists where user_id = $1 limit 1", [userId]);
  if (existing.rows[0]) return existing.rows[0].id;

  const created = await query<WishlistRow>("insert into customer_wishlists (user_id) values ($1) returning id", [userId]);
  return created.rows[0].id;
}

export async function GET() {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await ensureWishlistTables();

  const wishlistId = await getOrCreateWishlist(auth.sub);
  const items = await query(
    `select id, product_slug, product_title, product_image, unit_price::text
     from customer_wishlist_items
     where wishlist_id = $1
     order by created_at desc`,
    [wishlistId]
  );

  return NextResponse.json({ items: items.rows });
}

export async function POST(request: Request) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await ensureWishlistTables();

  const body = await request.json();
  const { slug, title, image, price } = body || {};

  if (!slug || !title) {
    return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
  }

  const wishlistId = await getOrCreateWishlist(auth.sub);

  const existing = await query<{ id: string }>(
    "select id from customer_wishlist_items where wishlist_id = $1 and product_slug = $2 limit 1",
    [wishlistId, slug]
  );

  if (existing.rows[0]) {
    await query("delete from customer_wishlist_items where wishlist_id = $1 and product_slug = $2", [wishlistId, slug]);
    return NextResponse.json({ ok: true, wishlisted: false });
  }

  await query(
    `insert into customer_wishlist_items (wishlist_id, product_slug, product_title, product_image, unit_price)
     values ($1, $2, $3, $4, $5)`,
    [wishlistId, slug, title, image || null, Number.isFinite(Number(price)) ? Number(price) : null]
  );

  await query("update customer_wishlists set updated_at = now() where id = $1", [wishlistId]);

  return NextResponse.json({ ok: true, wishlisted: true });
}

export async function DELETE(request: Request) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await ensureWishlistTables();

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });

  const wishlistId = await getOrCreateWishlist(auth.sub);
  await query("delete from customer_wishlist_items where wishlist_id = $1 and product_slug = $2", [wishlistId, slug]);

  return NextResponse.json({ ok: true });
}
