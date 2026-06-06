import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { query } from "@/lib/db";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function makeSku(seed: string) {
  const base = slugify(seed).slice(0, 44) || "variant";
  return `${base}-${Date.now().toString(36).slice(-6)}`;
}

async function uniqueSlug(seed: string) {
  const base = slugify(seed) || `variant-${Date.now().toString(36)}`;
  let candidate = base;
  for (let index = 1; index < 50; index++) {
    const exists = await query<{ id: string }>("select id from products where slug = $1 limit 1", [candidate]);
    if (exists.rows.length === 0) return candidate;
    candidate = `${base}-${index + 1}`;
  }
  return `${base}-${Date.now().toString(36).slice(-5)}`;
}

async function ensureTables() {
  await query("alter table products add column if not exists site_id varchar(50) default 'quirkyhome'");
  await query(`
    create table if not exists product_variant_links (
      product_id uuid not null references products(id) on delete cascade,
      variant_product_id uuid not null references products(id) on delete cascade,
      created_at timestamptz not null default now(),
      primary key (product_id, variant_product_id),
      check (product_id <> variant_product_id)
    )
  `);
  await query(`
    create table if not exists collection_products (
      collection_id uuid not null references collections(id) on delete cascade,
      product_slug varchar(260) not null references products(slug) on delete cascade,
      sort_order int not null default 0,
      primary key (collection_id, product_slug)
    )
  `);
}

async function linkedGroupIds(baseProductId: string) {
  await ensureTables();
  const links = await query<{ id: string }>(
    `select variant_product_id::text as id from product_variant_links where product_id = $1
     union
     select product_id::text as id from product_variant_links where variant_product_id = $1
     union
     select attributes->>'linked_product_id' as id
     from product_variants
     where product_id = $1 and nullif(attributes->>'linked_product_id', '') is not null`,
    [baseProductId],
  );
  return Array.from(new Set([baseProductId, ...links.rows.map((row) => row.id).filter(Boolean)]));
}

async function linkProducts(productIds: string[]) {
  const uniqueIds = Array.from(new Set(productIds.filter(Boolean)));
  for (const productId of uniqueIds) {
    for (const variantProductId of uniqueIds) {
      if (productId === variantProductId) continue;
      await query(
        `insert into product_variant_links (product_id, variant_product_id)
         values ($1, $2)
         on conflict do nothing`,
        [productId, variantProductId],
      );
    }
  }
}

export async function POST(request: NextRequest) {
  const guard = await requirePermission(request, "variants.create");
  if (guard.response) return guard.response;

  try {
    await ensureTables();
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("site_id") || "quirkyhome";
    const body = await request.json();

    const parentProductId = String(body?.parent_product_id || "").trim();
    const title = String(body?.title || "").trim();
    const variantShortName = String(body?.variant_short_name || "").trim();
    const shortDescription = String(body?.short_description || "").trim();
    const mrp = Number(body?.mrp || 0);
    const salePrice = Number(body?.sale_price || 0);
    const stock = Math.max(0, Number(body?.quantity_available || 0));
    const categoryId = String(body?.category_id || "").trim();
    const collectionIds = Array.isArray(body?.collection_ids)
      ? body.collection_ids.filter((value: unknown) => typeof value === "string" && value.trim())
      : [];
    const images = Array.isArray(body?.images)
      ? Array.from(new Set(body.images.map((value: unknown) => (typeof value === "string" ? value.trim() : "")).filter(Boolean))).slice(0, 10)
      : [];
    const descriptionSections = body?.description_sections && typeof body.description_sections === "object"
      ? body.description_sections
      : {};

    if (!parentProductId || !title || mrp <= 0 || salePrice <= 0) {
      return NextResponse.json({ error: "Parent product, title, MRP and sale price are required" }, { status: 400 });
    }
    if (salePrice > mrp) {
      return NextResponse.json({ error: "Sale price cannot be greater than MRP" }, { status: 400 });
    }

    const parent = await query<{ id: string; slug: string }>("select id, slug from products where id = $1 limit 1", [parentProductId]);
    if (parent.rows.length === 0) return NextResponse.json({ error: "Parent product not found" }, { status: 404 });

    const slug = await uniqueSlug(body?.slug || title);
    const longDescription = JSON.stringify(descriptionSections);

    const productResult = await query<{ id: string; slug: string }>(
      `insert into products (title, slug, short_description, long_description, is_active, is_searchable, site_id)
       values ($1, $2, $3, $4, true, true, $5)
       returning id, slug`,
      [title, slug, shortDescription || null, longDescription, siteId],
    );
    const productId = productResult.rows[0].id;

    const variantResult = await query<{ id: string }>(
      `insert into product_variants (product_id, sku, title, attributes, mrp, sale_price, is_active)
       values ($1, $2, $3, $4::jsonb, $5, $6, true)
       returning id`,
      [
        productId,
        String(body?.sku || "").trim() || makeSku(title),
        title,
        JSON.stringify({
          full_product_variant: true,
          parent_product_id: parentProductId,
          parent_product_slug: parent.rows[0].slug,
          variant_short_name: variantShortName || title,
        }),
        mrp,
        salePrice,
      ],
    );
    const variantId = variantResult.rows[0].id;

    await query(
      `insert into inventory_items (variant_id, quantity_available)
       values ($1, $2)
       on conflict (variant_id) do update set quantity_available = excluded.quantity_available, updated_at = now()`,
      [variantId, stock],
    );

    for (let index = 0; index < images.length; index++) {
      await query(
        `insert into product_images (product_id, variant_id, image_url, alt_text, sort_order)
         values ($1, $2, $3, $4, $5)`,
        [productId, variantId, images[index], title, index],
      );
    }

    if (categoryId) {
      await query(
        `insert into product_category_map (product_id, category_id)
         values ($1, $2)
         on conflict do nothing`,
        [productId, categoryId],
      );
    }

    for (const collectionId of collectionIds) {
      const maxSort = await query<{ max_sort: number }>(
        "select coalesce(max(sort_order), -1) as max_sort from collection_products where collection_id = $1",
        [collectionId],
      );
      await query(
        `insert into collection_products (collection_id, product_slug, sort_order)
         values ($1, $2, $3)
         on conflict do nothing`,
        [collectionId, slug, (maxSort.rows[0]?.max_sort ?? -1) + 1],
      );
    }

    const groupIds = await linkedGroupIds(parentProductId);
    await linkProducts([...groupIds, productId]);

    await logAdminActivity(request, {
      id: guard.user!.id,
      email: guard.user!.email,
      fullName: guard.user!.full_name,
      role: guard.user!.role,
    }, {
      module: "variants",
      action: "create.full_product",
      entityType: "product_variant",
      entityId: productId,
      entityLabel: title,
      message: `Created full product variant ${title}.`,
      metadata: {
        parentProductId,
        slug,
        stock,
        imageCount: images.length,
        collectionCount: collectionIds.length,
      },
    });

    return NextResponse.json({ ok: true, productId, slug, linkedCount: groupIds.length + 1 });
  } catch (error: any) {
    console.error("POST /api/admin/variants/full-product error:", error);
    if (String(error?.message || "").toLowerCase().includes("duplicate key")) {
      return NextResponse.json({ error: "Duplicate SKU or slug" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create full product variant" }, { status: 500 });
  }
}
