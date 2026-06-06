import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getCurrentTeamUser, can } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { categories as fallbackCategories } from "@/data/categories";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  site_id: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureCategoriesColumns() {
  await query(`
    create table if not exists categories (
      id uuid primary key default gen_random_uuid(),
      name varchar(150) not null,
      slug varchar(160) not null unique,
      description text,
      image_url text,
      is_active boolean not null default true,
      sort_order int not null default 0,
      site_id varchar(50) not null default 'quirkyhome',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await query("alter table categories add column if not exists description text");
  await query("alter table categories add column if not exists image_url text");
  await query("alter table categories add column if not exists is_active boolean not null default true");
  await query("alter table categories add column if not exists sort_order int not null default 0");
  await query("alter table categories add column if not exists site_id varchar(50) not null default 'quirkyhome'");
  await query("alter table categories add column if not exists created_at timestamptz not null default now()");
  await query("alter table categories add column if not exists updated_at timestamptz not null default now()");
}

async function seedFallbackCategories(siteId: string) {
  const existing = await query<{ count: string }>(
    "select count(*)::text as count from categories where site_id = $1",
    [siteId],
  );
  if (Number(existing.rows[0]?.count || 0) > 0) return;

  for (const [index, category] of fallbackCategories.entries()) {
    await query(
      `insert into categories (name, slug, description, image_url, site_id, is_active, sort_order)
       values ($1, $2, $3, $4, $5, true, $6)
       on conflict (slug) do nothing`,
      [category.name, category.slug, category.description, category.image, siteId, index],
    );
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentTeamUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!can(user, "categories.view") && !can(user, "products.view") && !can(user, "products.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await ensureCategoriesColumns();
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("site_id") || "quirkyhome";
    await seedFallbackCategories(siteId);
    const activeOnly = searchParams.get("active") === "1";
    const id = searchParams.get("id");

    if (id) {
      const one = await query<CategoryRow>(
        `select id, name, slug, description, image_url, is_active, sort_order, site_id
         from categories
         where id = $1
         limit 1`,
        [id],
      );
      if (one.rows.length === 0) return NextResponse.json({ error: "Category not found" }, { status: 404 });
      return NextResponse.json(one.rows[0]);
    }

    let sql = `select id, name, slug, description, image_url, is_active, sort_order, site_id
               from categories
               where site_id = $1`;
    const params: unknown[] = [siteId];
    if (activeOnly) sql += " and is_active = true";
    sql += " order by sort_order asc, created_at desc";
    const rows = await query<CategoryRow>(sql, params);
    return NextResponse.json({ categories: rows.rows });
  } catch (error) {
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requirePermission(request, "categories.create");
  if (guard.response) return guard.response;

  try {
    await ensureCategoriesColumns();
    const { searchParams } = new URL(request.url);
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const slug = slugify(String(body?.slug || name));
    const description = String(body?.description || "").trim() || null;
    const imageUrl = String(body?.image_url || "").trim() || null;
    const siteId = String(body?.site_id || searchParams.get("site_id") || "quirkyhome");
    const isActive = body?.is_active !== false;

    if (!name) return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    if (!slug) return NextResponse.json({ error: "Valid category slug is required" }, { status: 400 });

    const result = await query<{ id: string; slug: string }>(
      `insert into categories (name, slug, description, image_url, site_id, is_active)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (slug) do update
       set name = excluded.name,
           description = excluded.description,
           image_url = excluded.image_url,
           site_id = excluded.site_id,
           is_active = excluded.is_active,
           updated_at = now()
       returning id, slug`,
      [name, slug, description, imageUrl, siteId, isActive],
    );
    return NextResponse.json({ ok: true, category: result.rows[0] });
  } catch (error) {
    console.error("POST /api/admin/categories error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const guard = await requirePermission(request, "categories.edit");
  if (guard.response) return guard.response;

  try {
    await ensureCategoriesColumns();
    const body = await request.json();
    const id = String(body?.id || "");
    const name = String(body?.name || "").trim();
    const slug = slugify(String(body?.slug || name));
    const description = String(body?.description || "").trim() || null;
    const imageUrl = String(body?.image_url || "").trim() || null;
    const isActive = body?.is_active !== false;

    if (!id) return NextResponse.json({ error: "Category id is required" }, { status: 400 });
    if (!name) return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    if (!slug) return NextResponse.json({ error: "Valid category slug is required" }, { status: 400 });

    await query(
      `update categories
       set name = $2,
           slug = $3,
           description = $4,
           image_url = $5,
           is_active = $6,
           updated_at = now()
       where id = $1`,
      [id, name, slug, description, imageUrl, isActive],
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/admin/categories error:", error);
    if (typeof error === "object" && error && "code" in error && (error as any).code === "23505") {
      return NextResponse.json({ error: "Category slug already exists. Please choose a different slug." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const guard = await requirePermission(request, "categories.delete");
  if (guard.response) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Category id is required" }, { status: 400 });
    await query("delete from categories where id = $1", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/categories error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
