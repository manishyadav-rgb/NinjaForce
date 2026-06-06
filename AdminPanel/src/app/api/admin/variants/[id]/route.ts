import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { query } from "@/lib/db";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission(request, "variants.edit");
  if (guard.response) return guard.response;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const skuInput = String(body?.sku || "").trim();
    const title = typeof body?.title === "string" ? body.title.trim() : null;
    const mrp = Number(body?.mrp || 0);
    const salePrice = Number(body?.sale_price || 0);
    const quantity = Number(body?.quantity_available || 0);
    const imageUrl = typeof body?.image_url === "string" ? body.image_url.trim() : "";
    const isActive = body?.is_active !== false;
    const attributes = body?.attributes && typeof body.attributes === "object" ? body.attributes : {};

    if (!id || mrp <= 0 || salePrice <= 0) {
      return NextResponse.json({ error: "id, mrp, sale_price are required" }, { status: 400 });
    }
    if (salePrice > mrp) {
      return NextResponse.json({ error: "sale_price cannot be greater than mrp" }, { status: 400 });
    }

    const currentVariant = await query<{ sku: string }>("select sku from product_variants where id = $1 limit 1", [id]);
    const sku = skuInput || currentVariant.rows[0]?.sku || `variant-${Date.now().toString(36).slice(-6)}`;

    const variantResult = await query<{ product_id: string }>(
      `update product_variants
       set sku = $2,
           title = $3,
           attributes = $4::jsonb,
           mrp = $5,
           sale_price = $6,
           is_active = $7,
           updated_at = now()
       where id = $1
       returning product_id`,
      [id, sku, title, JSON.stringify(attributes), mrp, salePrice, isActive],
    );

    const productId = variantResult.rows[0]?.product_id;
    if (!productId) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    await query(
      `insert into inventory_items (variant_id, quantity_available)
       values ($1, $2)
       on conflict (variant_id) do update
       set quantity_available = excluded.quantity_available,
           updated_at = now()`,
      [id, Math.max(0, quantity)],
    );

    if (imageUrl) {
      await query(
        `insert into product_images (product_id, variant_id, image_url, alt_text, sort_order)
         values ($1, $2, $3, $4, 0)
         on conflict do nothing`,
        [productId, id, imageUrl, title || sku],
      );
      await query(
        `update product_images
         set image_url = $3,
             alt_text = $4
         where product_id = $1
           and variant_id = $2
           and sort_order = 0`,
        [productId, id, imageUrl, title || sku],
      );
    }

    await logAdminActivity(request, {
      id: guard.user!.id,
      email: guard.user!.email,
      fullName: guard.user!.full_name,
      role: guard.user!.role,
    }, {
      module: "variants",
      action: "update",
      entityType: "variant",
      entityId: id,
      entityLabel: title || sku,
      message: `Updated variant ${title || sku}.`,
      metadata: { productId, sku, salePrice, mrp, quantity, isActive },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("PUT /api/admin/variants/[id] error:", error);
    if (String(error?.message || "").toLowerCase().includes("duplicate key")) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update variant" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission(request, "variants.delete");
  if (guard.response) return guard.response;

  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const variantResult = await query<{ sku: string; title: string | null }>(
      "select sku, title from product_variants where id = $1 limit 1",
      [id],
    );
    await query("delete from product_variants where id = $1", [id]);
    await logAdminActivity(request, {
      id: guard.user!.id,
      email: guard.user!.email,
      fullName: guard.user!.full_name,
      role: guard.user!.role,
    }, {
      module: "variants",
      action: "delete",
      entityType: "variant",
      entityId: id,
      entityLabel: variantResult.rows[0]?.title || variantResult.rows[0]?.sku || id,
      message: "Deleted variant.",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/variants/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete variant" }, { status: 500 });
  }
}
