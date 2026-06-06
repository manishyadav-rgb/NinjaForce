import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { query } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function makeSku(seed: string) {
  const base = seed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "variant";
  return `${base}-${Date.now().toString(36).slice(-6)}-${Math.random().toString(36).slice(2, 5)}`;
}

async function ensureVariantLinksTable() {
  await query(`
    create table if not exists product_variant_links (
      product_id uuid not null references products(id) on delete cascade,
      variant_product_id uuid not null references products(id) on delete cascade,
      created_at timestamptz not null default now(),
      primary key (product_id, variant_product_id),
      check (product_id <> variant_product_id)
    )
  `);
}

export async function GET(request: NextRequest, context: RouteContext) {
  const guard = await requirePermission(request, "products.view");
  if (guard.response) return guard.response;

  try {
    await ensureVariantLinksTable();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    if (searchParams.get("linked") === "1") {
      const linked = await query<{
        id: string;
        title: string;
        slug: string;
        image_url: string | null;
        sale_price: string | null;
        mrp: string | null;
      }>(
        `with linked_ids as (
           select variant_product_id::text as id
           from product_variant_links
           where product_id = $1
           union
           select attributes->>'linked_product_id' as id
           from product_variants
           where product_id = $1
             and attributes->>'linked_product_id' is not null
         )
         select distinct on (p.id)
           p.id,
           p.title,
           p.slug,
           pi.image_url,
           pv.sale_price::text,
           pv.mrp::text
         from linked_ids li
         join products p on p.id::text = li.id
         left join product_images pi on pi.product_id = p.id and pi.sort_order = 0
         left join lateral (
           select sale_price, mrp
           from product_variants
           where product_id = p.id
           order by created_at asc
           limit 1
         ) pv on true
         order by p.id, p.title asc`,
        [id],
      );

      return NextResponse.json({ items: linked.rows });
    }

    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = 10;
    const offset = (page - 1) * limit;

    const countResult = await query<{ count: string }>(
      "select count(*)::text as count from products where id <> $1",
      [id],
    );
    const total = Number(countResult.rows[0]?.count || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const products = await query<{
      id: string;
      title: string;
      slug: string;
      image_url: string | null;
      sale_price: string | null;
      mrp: string | null;
    }>(
      `select
         p.id,
         p.title,
         p.slug,
         pi.image_url,
         pv.sale_price::text,
         pv.mrp::text
       from products p
       left join product_images pi on pi.product_id = p.id and pi.sort_order = 0
       left join lateral (
         select sale_price, mrp
         from product_variants
         where product_id = p.id
         order by created_at asc
         limit 1
       ) pv on true
       where p.id <> $1
       order by p.created_at desc
       limit $2 offset $3`,
      [id, limit, offset],
    );

    return NextResponse.json({
      items: products.rows,
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("GET /api/admin/products/[id]/variants error:", error);
    return NextResponse.json({ error: "Failed to fetch variant candidates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const guard = await requirePermission(request, "variants.create");
  if (guard.response) return guard.response;

  try {
    await ensureVariantLinksTable();
    const { id } = await context.params;
    const body = await request.json();
    const sourceProductIds: string[] = Array.isArray(body?.sourceProductIds)
      ? body.sourceProductIds.filter((v: unknown) => typeof v === "string" && v.trim())
      : [];
    if (sourceProductIds.length === 0) {
      return NextResponse.json({ error: "sourceProductIds is required" }, { status: 400 });
    }

    const uniqueIds = Array.from(new Set(sourceProductIds.filter((x) => x !== id)));
    const groupIds = [id, ...uniqueIds];

    const productMap = new Map<string, {
      id: string;
      title: string;
      slug: string;
      sale_price: number;
      mrp: number;
      image_url: string | null;
    }>();

    for (const pid of groupIds) {
      const source = await query<{
        id: string;
        title: string;
        slug: string;
        sale_price: string | null;
        mrp: string | null;
        image_url: string | null;
      }>(
        `select
           p.id,
           p.title,
           p.slug,
           pv.sale_price::text,
           pv.mrp::text,
           pi.image_url
         from products p
         left join lateral (
           select id, sale_price, mrp
           from product_variants
           where product_id = p.id
           order by created_at asc
           limit 1
         ) pv on true
         left join product_images pi on pi.product_id = p.id and pi.sort_order = 0
         where p.id = $1
         limit 1`,
        [pid],
      );
      if (source.rows.length === 0) continue;

      const row = source.rows[0];
      const salePrice = Math.max(0, Number(row.sale_price || 0));
      const mrp = Math.max(salePrice, Number(row.mrp || salePrice));
      if (mrp <= 0 || salePrice <= 0) continue;
      productMap.set(pid, {
        id: row.id,
        title: row.title,
        slug: row.slug,
        sale_price: salePrice,
        mrp,
        image_url: row.image_url,
      });
    }

    let created = 0;
    for (const targetId of groupIds) {
      const target = productMap.get(targetId);
      if (!target) continue;
      for (const sourceId of groupIds) {
        if (sourceId === targetId) continue;
        const source = productMap.get(sourceId);
        if (!source) continue;

        await query(
          `insert into product_variant_links (product_id, variant_product_id)
           values ($1, $2)
           on conflict do nothing`,
          [targetId, sourceId],
        );

        const exists = await query<{ id: string }>(
          `select id
           from product_variants
           where product_id = $1
             and attributes->>'linked_product_id' = $2
           limit 1`,
          [targetId, sourceId],
        );
        if (exists.rows.length > 0) continue;

        const variantInsert = await query<{ id: string }>(
          `insert into product_variants (product_id, sku, title, attributes, mrp, sale_price, is_active)
         values ($1, $2, $3, $4::jsonb, $5, $6, true)
         returning id`,
          [
            targetId,
            makeSku(source.title),
            source.title,
            JSON.stringify({ linked_product_id: sourceId, linked_product_slug: source.slug }),
            source.mrp,
            source.sale_price,
          ],
        );
        const variantId = variantInsert.rows[0]?.id;
        if (!variantId) continue;

        await query(
          `insert into inventory_items (variant_id, quantity_available)
         values ($1, 0)
         on conflict (variant_id) do nothing`,
          [variantId],
        );

        if (source.image_url) {
          await query(
            `insert into product_images (product_id, variant_id, image_url, alt_text, sort_order)
           values ($1, $2, $3, $4, 0)`,
            [targetId, variantId, source.image_url, source.title],
          );
        }

        created += 1;
      }
    }

    await logAdminActivity(request, {
      id: guard.user!.id,
      email: guard.user!.email,
      fullName: guard.user!.full_name,
      role: guard.user!.role,
    }, {
      module: "variants",
      action: "link.create",
      entityType: "variant_group",
      entityId: id,
      entityLabel: id,
      message: `Linked ${uniqueIds.length} products into a variant group.`,
      metadata: { created, sourceProductIds: uniqueIds },
    });

    return NextResponse.json({ ok: true, created });
  } catch (error) {
    console.error("POST /api/admin/products/[id]/variants error:", error);
    return NextResponse.json({ error: "Failed to create variants from products" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const guard = await requirePermission(request, "variants.edit");
  if (guard.response) return guard.response;

  try {
    await ensureVariantLinksTable();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const variantProductId = searchParams.get("variantProductId");

    if (!variantProductId || variantProductId === id) {
      return NextResponse.json({ error: "variantProductId is required" }, { status: 400 });
    }

    await query(
      `delete from product_variant_links
       where (product_id = $1 and variant_product_id = $2)
          or (product_id = $2 and variant_product_id = $1)`,
      [id, variantProductId],
    );
    await query(
      `delete from product_images
       where variant_id in (
         select id
         from product_variants
         where (product_id = $1 and attributes->>'linked_product_id' = $2)
            or (product_id = $2 and attributes->>'linked_product_id' = $1)
       )`,
      [id, variantProductId],
    );
    await query(
      `delete from product_variants
       where (product_id = $1 and attributes->>'linked_product_id' = $2)
          or (product_id = $2 and attributes->>'linked_product_id' = $1)`,
      [id, variantProductId],
    );

    await logAdminActivity(request, {
      id: guard.user!.id,
      email: guard.user!.email,
      fullName: guard.user!.full_name,
      role: guard.user!.role,
    }, {
      module: "variants",
      action: "link.remove",
      entityType: "variant_group",
      entityId: id,
      entityLabel: `${id} -> ${variantProductId}`,
      message: "Removed linked product from variant group.",
      metadata: { productId: id, variantProductId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/products/[id]/variants error:", error);
    return NextResponse.json({ error: "Failed to remove linked variant" }, { status: 500 });
  }
}
