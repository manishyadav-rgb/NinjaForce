import { NextRequest, NextResponse } from "next/server";
import { listAdminProducts } from "@/lib/admin-products";
import { requirePermission } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { query } from "@/lib/db";

async function ensureVariantLinksTable() {
  await query(
    `create table if not exists product_variant_links (
       product_id uuid not null references products(id) on delete cascade,
       variant_product_id uuid not null references products(id) on delete cascade,
       created_at timestamptz not null default now(),
       primary key (product_id, variant_product_id),
       check (product_id <> variant_product_id)
     )`,
  );
}

async function removeProductFromVariantGroups(id: string) {
  await ensureVariantLinksTable();
  await query("delete from product_variant_links where product_id = $1 or variant_product_id = $1", [id]);
  await query(
    `delete from product_images
     where variant_id in (
       select id
       from product_variants
       where product_id <> $1
         and attributes->>'linked_product_id' = $1
     )`,
    [id],
  );
  await query(
    `delete from product_variants
     where product_id <> $1
       and attributes->>'linked_product_id' = $1`,
    [id],
  );
}

export async function GET(request: NextRequest) {
  const guard = await requirePermission(request, "products.view");
  if (guard.response) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const site_id = searchParams.get("site_id") || "quirkyhome";
    if (id) {
      const product = await query<{ id: string; title: string; slug: string; image_url: string | null }>(
        `select p.id, p.title, p.slug, pi.image_url
         from products p
         left join product_images pi on pi.product_id = p.id and pi.sort_order = 0
         where p.id = $1
         limit 1`,
        [id],
      );
      if (product.rows.length === 0) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      const galleryRows = await query<{ image_url: string }>(
        `select image_url
         from product_images
         where product_id = $1
         order by sort_order asc nulls last, created_at asc`,
        [id],
      );
      return NextResponse.json({
        ...product.rows[0],
        gallery_images: galleryRows.rows.map((r) => r.image_url).filter(Boolean),
      });
    }

    const products = await listAdminProducts();
    
    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch products for builder:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const guard = await requirePermission(request, "products.images.upload");
  if (guard.response) return guard.response;

  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id : "";
    const images = Array.isArray(body?.images) ? body.images : [];
    const cleaned = Array.from(
      new Set(images.map((value: unknown) => (typeof value === "string" ? value.trim() : "")).filter(Boolean)),
    ).slice(0, 10);

    if (!id) {
      return NextResponse.json({ error: "Product id is required" }, { status: 400 });
    }
    if (cleaned.length === 0) {
      return NextResponse.json({ error: "At least one image URL is required" }, { status: 400 });
    }

    const productResult = await query<{ id: string }>("select id from products where id = $1 limit 1", [id]);
    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const variantResult = await query<{ id: string }>(
      `select id from product_variants
       where product_id = $1
       order by created_at asc
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

    await logAdminActivity(request, {
      id: guard.user!.id,
      email: guard.user!.email,
      fullName: guard.user!.full_name,
      role: guard.user!.role,
    }, {
      module: "products",
      action: "images.update",
      entityType: "product",
      entityId: id,
      entityLabel: id,
      message: `Updated product gallery with ${cleaned.length} images.`,
      metadata: { imageCount: cleaned.length },
    });

    return NextResponse.json({ ok: true, count: cleaned.length });
  } catch (error) {
    console.error("Failed to update product images:", error);
    return NextResponse.json({ error: "Failed to update product images" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const guard = await requirePermission(request, "products.delete");
  if (guard.response) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("clearAll") === "1";

    if (clearAll) {
      await ensureVariantLinksTable();
      await query("delete from product_variant_links");
      await query("delete from products");
      await logAdminActivity(request, {
        id: guard.user!.id,
        email: guard.user!.email,
        fullName: guard.user!.full_name,
        role: guard.user!.role,
      }, {
        module: "products",
        action: "delete.bulk",
        entityType: "product",
        entityLabel: "All products",
        message: "Deleted all products from AdminPanel.",
      });
      return NextResponse.json({ ok: true, cleared: true });
    }
    if (!id) {
      return NextResponse.json({ error: "Product id is required" }, { status: 400 });
    }
    const productResult = await query<{ title: string }>("select title from products where id = $1 limit 1", [id]);
    await removeProductFromVariantGroups(id);
    await query("delete from products where id = $1", [id]);
    await logAdminActivity(request, {
      id: guard.user!.id,
      email: guard.user!.email,
      fullName: guard.user!.full_name,
      role: guard.user!.role,
    }, {
      module: "products",
      action: "delete",
      entityType: "product",
      entityId: id,
      entityLabel: productResult.rows[0]?.title || id,
      message: "Deleted product and cleared variant links.",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
