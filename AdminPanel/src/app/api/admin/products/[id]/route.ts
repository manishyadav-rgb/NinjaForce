import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { query } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ── GET: fetch full product details for editing ──
export async function GET(_request: NextRequest, context: RouteContext) {
  const guard = await requirePermission(_request, "products.view");
  if (guard.response) return guard.response;

  try {
    const { id } = await context.params;

    // Product base
    const productResult = await query<{
      id: string;
      title: string;
      slug: string;
      short_description: string | null;
      long_description: string | null;
      is_active: boolean;
    }>(
      `select id, title, slug, short_description, long_description, is_active
       from products where id = $1 limit 1`,
      [id],
    );
    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const product = productResult.rows[0];

    // Gallery images
    const galleryResult = await query<{ id: string; image_url: string; sort_order: number }>(
      `select id, image_url, sort_order
       from product_images where product_id = $1
       order by sort_order asc nulls last, created_at asc`,
      [id],
    );

    // Price / variant info
    const variantResult = await query<{
      sku: string | null;
      sale_price: string | null;
      mrp: string | null;
      collection: string | null;
      size: string | null;
    }>(
      `select sku, sale_price::text, mrp::text,
              attributes->>'collection' as collection,
              attributes->>'size' as size
       from product_variants
       where product_id = $1
       order by
         case when sale_price is not null or mrp is not null then 0 else 1 end,
         case when sku is not null and trim(sku) <> '' then 0 else 1 end,
         created_at asc
       limit 1`,
      [id],
    );

    // Collection assignments
    const collectionResult = await query<{ collection_id: string; name: string; slug: string }>(
      `select cp.collection_id, c.name, c.slug
       from collection_products cp
       join collections c on c.id = cp.collection_id
       where cp.product_slug = $1`,
      [product.slug],
    );

    const categoryResult = await query<{ id: string; name: string; slug: string }>(
      `select c.id, c.name, c.slug
       from product_category_map pcm
       join categories c on c.id = pcm.category_id
       where pcm.product_id = $1
       limit 1`,
      [id],
    );

    // Parse description sections from long_description JSON
    let descriptionSections = {
      highlights: "",
      details: "",
      care: "",
    };
    if (product.long_description) {
      try {
        const parsed = JSON.parse(product.long_description);
        if (parsed && typeof parsed === "object") {
          descriptionSections = {
            highlights: parsed.highlights || "",
            details: parsed.details || "",
            care: parsed.care || "",
          };
        }
      } catch {
        // If not valid JSON, treat entire text as highlights
        descriptionSections.highlights = product.long_description;
      }
    }

    return NextResponse.json({
      ...product,
      descriptionSections,
      gallery_images: galleryResult.rows,
      variant: variantResult.rows[0] || null,
      collections: collectionResult.rows,
      category: categoryResult.rows[0] || null,
    });
  } catch (error) {
    console.error("GET /api/admin/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

// ── PUT: update product enrichment (images, descriptions, collection assignments) ──
export async function PUT(request: NextRequest, context: RouteContext) {
  const guard = await requirePermission(request, "products.edit");
  if (guard.response) return guard.response;

  try {
    const { id } = await context.params;
    const body = await request.json();

    // Verify product exists
    const check = await query<{ id: string; slug: string }>(
      "select id, slug from products where id = $1 limit 1",
      [id],
    );
    if (check.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const productSlug = check.rows[0].slug;
    const normalizedTitle = typeof body.title === "string" ? body.title.trim() : "";
    const normalizedIsActive = typeof body.is_active === "boolean" ? body.is_active : undefined;
    const normalizedSalePrice =
      body.sale_price === null || body.sale_price === undefined || body.sale_price === ""
        ? null
        : Number(body.sale_price);
    const normalizedMrp =
      body.mrp === null || body.mrp === undefined || body.mrp === ""
        ? null
        : Number(body.mrp);

    // ── Update description sections ──
    if (body.descriptionSections) {
      const sections = body.descriptionSections;
      const longDescription = JSON.stringify({
        highlights: sections.highlights || "",
        details: sections.details || "",
        care: sections.care || "",
      });
      await query(
        `update products
         set long_description = $1,
             title = case when $3 <> '' then $3 else title end,
             is_active = coalesce($4, is_active),
             updated_at = now()
         where id = $2`,
        [longDescription, id, normalizedTitle, normalizedIsActive ?? null],
      );
    } else if (normalizedTitle || normalizedIsActive !== undefined) {
      await query(
        `update products
         set title = case when $1 <> '' then $1 else title end,
             is_active = coalesce($2, is_active),
             updated_at = now()
         where id = $3`,
        [normalizedTitle, normalizedIsActive ?? null, id],
      );
    }

    // ── Update images ──
    if (Array.isArray(body.images)) {
      const cleaned = Array.from(
        new Set(
          body.images
            .map((v: unknown) => (typeof v === "string" ? v.trim() : ""))
            .filter(Boolean),
        ),
      ).slice(0, 10) as string[];

      // Get variant id for FK
      const variantResult = await query<{ id: string }>(
        `select id
         from product_variants
         where product_id = $1
         order by
           case when sale_price is not null or mrp is not null then 0 else 1 end,
           case when sku is not null and trim(sku) <> '' then 0 else 1 end,
           created_at asc
         limit 1`,
        [id],
      );
      const variantId = variantResult.rows[0]?.id || null;

      await query("delete from product_images where product_id = $1", [id]);
      for (let i = 0; i < cleaned.length; i++) {
        await query(
          `insert into product_images (product_id, variant_id, image_url, alt_text, sort_order)
           values ($1, $2, $3, $4, $5)`,
          [id, variantId, cleaned[i], `Product image ${i + 1}`, i],
        );
      }
    }

    // ── Update collection assignments ──
    if (Array.isArray(body.collectionIds)) {
      // Remove all existing assignments for this product
      await query("delete from collection_products where product_slug = $1", [productSlug]);

      for (const colId of body.collectionIds) {
        // Get max sort_order in that collection
        const maxSort = await query<{ max_sort: number }>(
          `select coalesce(max(sort_order), -1) as max_sort from collection_products where collection_id = $1`,
          [colId],
        );
        await query(
          `insert into collection_products (collection_id, product_slug, sort_order)
           values ($1, $2, $3) on conflict do nothing`,
          [colId, productSlug, (maxSort.rows[0]?.max_sort ?? -1) + 1],
        );
      }
    }

    // ── Update category assignment ──
    if (Object.prototype.hasOwnProperty.call(body, "categoryId")) {
      await query("delete from product_category_map where product_id = $1", [id]);
      if (body.categoryId) {
        await query(
          `insert into product_category_map (product_id, category_id)
           values ($1, $2)
           on conflict do nothing`,
          [id, body.categoryId],
        );
      }
    }

    // ── Update size ──
    if (
      body.size !== undefined ||
      normalizedSalePrice !== null ||
      normalizedMrp !== null
    ) {
      const variantResult = await query<{ id: string; attributes: Record<string, unknown> | null }>(
        `select id, attributes
         from product_variants
         where product_id = $1
         order by
           case when sale_price is not null or mrp is not null then 0 else 1 end,
           case when sku is not null and trim(sku) <> '' then 0 else 1 end,
           created_at asc
         limit 1`,
        [id],
      );

      const existingVariant = variantResult.rows[0];
      const nextAttributes = {
        ...(existingVariant?.attributes || {}),
      } as Record<string, unknown>;
      if (body.size !== undefined) nextAttributes.size = body.size || "";
      if (Array.isArray(body.collectionIds) && body.collectionIds.length > 0) {
        nextAttributes.collection = body.collectionIds[0];
      }

      if (existingVariant) {
        await query(
          `update product_variants
           set sale_price = coalesce($1, sale_price),
               mrp = coalesce($2, mrp),
               attributes = $3::jsonb,
               updated_at = now()
           where id = $4`,
          [normalizedSalePrice, normalizedMrp, JSON.stringify(nextAttributes), existingVariant.id],
        );
      } else {
        await query(
          `insert into product_variants (product_id, sku, sale_price, mrp, attributes)
           values ($1, $2, coalesce($3, 0), coalesce($4, 0), $5::jsonb)`,
          [id, null, normalizedSalePrice, normalizedMrp, JSON.stringify(nextAttributes)],
        );
      }
    }

    await logAdminActivity(request, {
      id: guard.user!.id,
      email: guard.user!.email,
      fullName: guard.user!.full_name,
      role: guard.user!.role,
    }, {
      module: "products",
      action: "update",
      entityType: "product",
      entityId: id,
      entityLabel: normalizedTitle || productSlug,
      message: "Updated product details, media, pricing, or assignments.",
      metadata: {
        titleChanged: Boolean(normalizedTitle),
        imagesUpdated: Array.isArray(body.images),
        collectionsUpdated: Array.isArray(body.collectionIds),
        categoryUpdated: Object.prototype.hasOwnProperty.call(body, "categoryId"),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/admin/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}
