import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { query } from "@/lib/db";

type VariantRow = {
  id: string;
  product_id: string;
  product_title: string;
  sku: string;
  title: string | null;
  attributes: Record<string, unknown> | null;
  mrp: string;
  sale_price: string;
  is_active: boolean;
  quantity_available: number | null;
  image_url: string | null;
  created_at: string;
};

async function generateVariantSku(productId: string, fallbackTitle?: string | null) {
  const baseResult = await query<{ slug: string; title: string }>(
    "select slug, title from products where id = $1 limit 1",
    [productId],
  );
  const base = (
    baseResult.rows[0]?.slug ||
    fallbackTitle ||
    baseResult.rows[0]?.title ||
    "variant"
  )
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "variant";

  const suffix = Date.now().toString(36).slice(-6);
  return `${base}-${suffix}`;
}

export async function GET(request: NextRequest) {
  const guard = await requirePermission(request, "variants.view");
  if (guard.response) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const params: string[] = [];
    let where = "";
    if (productId) {
      params.push(productId);
      where = "where pv.product_id = $1";
    }

    const result = await query<VariantRow>(
      `select
         pv.id,
         pv.product_id,
         p.title as product_title,
         pv.sku,
         pv.title,
         pv.attributes,
         pv.mrp::text,
         pv.sale_price::text,
         pv.is_active,
         ii.quantity_available,
         pi.image_url,
         pv.created_at::text
       from product_variants pv
       join products p on p.id = pv.product_id
       left join inventory_items ii on ii.variant_id = pv.id
       left join product_images pi on pi.variant_id = pv.id and pi.sort_order = 0
       ${where}
       order by pv.created_at desc
       limit 300`,
      params,
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("GET /api/admin/variants error:", error);
    return NextResponse.json({ error: "Failed to fetch variants" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requirePermission(request, "variants.create");
  if (guard.response) return guard.response;

  try {
    const body = await request.json();
    const productId = String(body?.product_id || "").trim();
    const skuInput = String(body?.sku || "").trim();
    const title = typeof body?.title === "string" ? body.title.trim() : null;
    const mrp = Number(body?.mrp || 0);
    const salePrice = Number(body?.sale_price || 0);
    const quantity = Number(body?.quantity_available || 0);
    const imageUrl = typeof body?.image_url === "string" ? body.image_url.trim() : "";
    const isActive = body?.is_active !== false;
    const attributes = body?.attributes && typeof body.attributes === "object" ? body.attributes : {};

    if (!productId || mrp <= 0 || salePrice <= 0) {
      return NextResponse.json({ error: "product_id, mrp, sale_price are required" }, { status: 400 });
    }
    if (salePrice > mrp) {
      return NextResponse.json({ error: "sale_price cannot be greater than mrp" }, { status: 400 });
    }

    const sku = skuInput || (await generateVariantSku(productId, title));

    const variantResult = await query<{ id: string }>(
      `insert into product_variants (product_id, sku, title, attributes, mrp, sale_price, is_active)
       values ($1, $2, $3, $4::jsonb, $5, $6, $7)
       returning id`,
      [productId, sku, title, JSON.stringify(attributes), mrp, salePrice, isActive],
    );
    const variantId = variantResult.rows[0]?.id;

    await query(
      `insert into inventory_items (variant_id, quantity_available)
       values ($1, $2)
       on conflict (variant_id) do update
       set quantity_available = excluded.quantity_available,
           updated_at = now()`,
      [variantId, Math.max(0, quantity)],
    );

    if (imageUrl) {
      await query(
        `insert into product_images (product_id, variant_id, image_url, alt_text, sort_order)
         values ($1, $2, $3, $4, 0)`,
        [productId, variantId, imageUrl, title || sku],
      );
    }

    await logAdminActivity(request, {
      id: guard.user!.id,
      email: guard.user!.email,
      fullName: guard.user!.full_name,
      role: guard.user!.role,
    }, {
      module: "variants",
      action: "create",
      entityType: "variant",
      entityId: variantId,
      entityLabel: title || sku,
      message: `Created variant ${title || sku}.`,
      metadata: { productId, sku, salePrice, mrp, quantity },
    });

    return NextResponse.json({ ok: true, id: variantId, sku });
  } catch (error: any) {
    console.error("POST /api/admin/variants error:", error);
    if (String(error?.message || "").toLowerCase().includes("duplicate key")) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create variant" }, { status: 500 });
  }
}
