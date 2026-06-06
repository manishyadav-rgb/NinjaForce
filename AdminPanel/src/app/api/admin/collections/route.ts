import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getCurrentTeamUser, can } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { collections as fallbackCollections } from "@/data/collections";

async function ensureCollectionsColumns() {
  await query(`
    create table if not exists collections (
      id uuid primary key default gen_random_uuid(),
      name varchar(180) not null,
      slug varchar(200) not null unique,
      description text,
      image_url text,
      is_active boolean not null default true,
      sort_order int not null default 0,
      site_id varchar(50) not null default 'quirkyhome',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await query("alter table collections add column if not exists description text");
  await query("alter table collections add column if not exists image_url text");
  await query("alter table collections add column if not exists is_active boolean not null default true");
  await query("alter table collections add column if not exists sort_order int not null default 0");
  await query("alter table collections add column if not exists site_id varchar(50) not null default 'quirkyhome'");
  await query("alter table collections add column if not exists created_at timestamptz not null default now()");
  await query("alter table collections add column if not exists updated_at timestamptz not null default now()");
}

async function seedFallbackCollections(siteId: string) {
  const existing = await query<{ count: string }>(
    "select count(*)::text as count from collections where site_id = $1",
    [siteId],
  );
  if (Number(existing.rows[0]?.count || 0) > 0) return;

  for (const [index, collection] of fallbackCollections.entries()) {
    await query(
      `insert into collections (name, slug, description, image_url, site_id, is_active, sort_order)
       values ($1, $2, $3, $4, $5, true, $6)
       on conflict (slug) do nothing`,
      [collection.title, collection.slug, collection.description, collection.image, siteId, index],
    );
  }
}

// ── GET: list all collections (optionally with product slugs) ──
export async function GET(request: NextRequest) {
  const user = await getCurrentTeamUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!can(user, "collections.view") && !can(user, "products.view") && !can(user, "products.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await ensureCollectionsColumns();
    const { searchParams } = new URL(request.url);
    const withProducts = searchParams.get("products") === "1";
    const siteId = searchParams.get("site_id") || "quirkyhome";
    await seedFallbackCollections(siteId);
    const id = searchParams.get("id");

    // Single collection by id
    if (id) {
      const colResult = await query<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        image_url: string | null;
        is_active: boolean;
        sort_order: number;
      }>(
        `select id, name, slug, description, image_url, is_active, sort_order
         from collections where id = $1 limit 1`,
        [id],
      );
      if (colResult.rows.length === 0) {
        return NextResponse.json({ error: "Collection not found" }, { status: 404 });
      }
      const col = colResult.rows[0];
      const prodResult = await query<{ product_slug: string; sort_order: number }>(
        `select product_slug, sort_order from collection_products
         where collection_id = $1 order by sort_order`,
        [id],
      );
      return NextResponse.json({
        ...col,
        products: prodResult.rows.map((r) => r.product_slug),
      });
    }

    // List all
    const colResult = await query<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      image_url: string | null;
      is_active: boolean;
      sort_order: number;
    }>(
      `select id, name, slug, description, image_url, is_active, sort_order
       from collections order by sort_order, created_at desc`,
    );

    if (!withProducts) {
      return NextResponse.json({ collections: colResult.rows.map((c) => ({ ...c, products: [] })) });
    }

    // Attach product slugs
    const collections = [];
    for (const col of colResult.rows) {
      const prodResult = await query<{ product_slug: string }>(
        `select product_slug from collection_products
         where collection_id = $1 order by sort_order`,
        [col.id],
      );
      collections.push({
        ...col,
        products: prodResult.rows.map((r) => r.product_slug),
      });
    }

    return NextResponse.json({ collections });
  } catch (error) {
    console.error("GET /api/admin/collections error:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}

// ── POST: create a new collection ──
export async function POST(request: NextRequest) {
  const guard = await requirePermission(request, "collections.create");
  if (guard.response) return guard.response;

  try {
    const body = await request.json();
    const name = (body.name || "").trim();
    const description = (body.description || "").trim() || null;
    const image_url = (body.image_url || "").trim() || null;
    const productSlugs: string[] = Array.isArray(body.products) ? body.products : [];

    if (!name) {
      return NextResponse.json({ error: "Collection name is required" }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const colResult = await query<{ id: string }>(
      `insert into collections (name, slug, description, image_url)
       values ($1, $2, $3, $4)
       on conflict (slug) do update set name = excluded.name, description = excluded.description, image_url = excluded.image_url, updated_at = now()
       returning id`,
      [name, slug, description, image_url],
    );
    const collectionId = colResult.rows[0].id;

    // Add products
    if (productSlugs.length > 0) {
      for (let i = 0; i < productSlugs.length; i++) {
        await query(
          `insert into collection_products (collection_id, product_slug, sort_order)
           values ($1, $2, $3) on conflict do nothing`,
          [collectionId, productSlugs[i], i],
        );
      }
    }

    return NextResponse.json({ ok: true, id: collectionId, slug });
  } catch (error) {
    console.error("POST /api/admin/collections error:", error);
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}

// ── PUT: update an existing collection ──
export async function PUT(request: NextRequest) {
  const guard = await requirePermission(request, "collections.edit");
  if (guard.response) return guard.response;

  try {
    const body = await request.json();
    const id = body.id;
    if (!id) {
      return NextResponse.json({ error: "Collection id is required" }, { status: 400 });
    }

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(body.name.trim());
      paramIndex++;
      // Also update slug
      const slug = body.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      updates.push(`slug = $${paramIndex}`);
      params.push(slug);
      paramIndex++;
    }
    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(body.description || null);
      paramIndex++;
    }
    if (body.image_url !== undefined) {
      updates.push(`image_url = $${paramIndex}`);
      params.push(body.image_url || null);
      paramIndex++;
    }
    if (body.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(Boolean(body.is_active));
      paramIndex++;
    }
    if (body.sort_order !== undefined) {
      updates.push(`sort_order = $${paramIndex}`);
      params.push(Number(body.sort_order));
      paramIndex++;
    }

    if (updates.length > 0) {
      updates.push("updated_at = now()");
      params.push(id);
      await query(
        `update collections set ${updates.join(", ")} where id = $${paramIndex}`,
        params,
      );
    }

    // Update product assignments if provided
    if (Array.isArray(body.products)) {
      await query("delete from collection_products where collection_id = $1", [id]);
      for (let i = 0; i < body.products.length; i++) {
        await query(
          `insert into collection_products (collection_id, product_slug, sort_order)
           values ($1, $2, $3) on conflict do nothing`,
          [id, body.products[i], i],
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/admin/collections error:", error);
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
  }
}

// ── DELETE: remove a collection ──
export async function DELETE(request: NextRequest) {
  const guard = await requirePermission(request, "collections.delete");
  if (guard.response) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Collection id is required" }, { status: 400 });
    }
    await query("delete from collections where id = $1", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/collections error:", error);
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
  }
}
