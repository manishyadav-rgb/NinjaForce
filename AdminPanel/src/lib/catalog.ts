import type { Product } from "@/data/products";
import { query } from "@/lib/db";

type CatalogRow = {
  title: string;
  slug: string;
  category: string | null;
  sku: string | null;
  collection: string | null;
  stock: number | null;
  image: string | null;
  rating: string;
  reviews: number;
  price: string | null;
  mrp: string | null;
  badge: string | null;
  description: string | null;
};

function toProduct(row: CatalogRow): Product {
  const image = row.image || "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=80";
  const price = Number(row.price ?? 0);
  const mrp = Number(row.mrp ?? row.price ?? 0);

  return {
    title: row.title,
    slug: row.slug,
    category: row.category ?? "decor",
    sku: row.sku ?? undefined,
    collection: row.collection ?? undefined,
    stock: row.stock ?? undefined,
    image,
    gallery: [image],
    rating: Number(row.rating ?? 0),
    reviews: row.reviews ?? 0,
    price,
    mrp,
    badge: row.badge ?? "New",
    description: row.description ?? `${row.title} from QuirkyHome.`,
  };
}

export async function getCatalogProducts() {
  try {
    const result = await query<CatalogRow>(
      `select
         p.title,
         p.slug,
         c.slug as category,
         pv.sku,
         coalesce(pv.attributes->>'collection', c.slug) as collection,
         ii.quantity_available as stock,
         pi.image_url as image,
         p.rating_avg::text as rating,
         p.rating_count as reviews,
         pv.sale_price::text as price,
         pv.mrp::text as mrp,
         case when ism.source_system = 'dynamodb' then 'Imported' else 'New' end as badge,
         coalesce(p.short_description, p.long_description) as description
       from products p
       left join product_variants pv on pv.product_id = p.id and pv.is_active = true
       left join inventory_items ii on ii.variant_id = pv.id
       left join product_images pi on pi.product_id = p.id and pi.sort_order = 0
       left join product_category_map pcm on pcm.product_id = p.id
       left join categories c on c.id = pcm.category_id
       left join inventory_source_mapping ism on ism.variant_id = pv.id
       where p.is_active = true and p.is_searchable = true
      order by p.created_at desc
      limit 100`,
    );

    return result.rows.map(toProduct);
  } catch {
    return [];
  }
}

export async function getCatalogProductsByCategory(categorySlug: string) {
  try {
    const result = await query<CatalogRow>(
      `select
         p.title,
         p.slug,
         c.slug as category,
         pv.sku,
         coalesce(pv.attributes->>'collection', c.slug) as collection,
         ii.quantity_available as stock,
         pi.image_url as image,
         p.rating_avg::text as rating,
         p.rating_count as reviews,
         pv.sale_price::text as price,
         pv.mrp::text as mrp,
         case when ism.source_system = 'dynamodb' then 'Imported' else 'New' end as badge,
         coalesce(p.short_description, p.long_description) as description
       from products p
       left join product_variants pv on pv.product_id = p.id and pv.is_active = true
       left join inventory_items ii on ii.variant_id = pv.id
       left join product_images pi on pi.product_id = p.id and pi.sort_order = 0
       left join product_category_map pcm on pcm.product_id = p.id
       left join categories c on c.id = pcm.category_id
       left join inventory_source_mapping ism on ism.variant_id = pv.id
       where p.is_active = true
         and p.is_searchable = true
         and c.slug = $1
      order by p.created_at desc
      limit 200`,
      [categorySlug],
    );

    return result.rows.map(toProduct);
  } catch {
    return [];
  }
}

export async function getCatalogProduct(slug: string) {
  try {
    const productResult = await query<CatalogRow>(
      `select
         p.title,
         p.slug,
         c.slug as category,
         null::varchar as sku,
         null::varchar as collection,
         null::int as stock,
         pi.image_url as image,
         p.rating_avg::text as rating,
         p.rating_count as reviews,
         null::text as price,
         null::text as mrp,
         'New'::text as badge,
         coalesce(p.short_description, p.long_description) as description
       from products p
       left join product_images pi on pi.product_id = p.id and pi.sort_order = 0
       left join product_category_map pcm on pcm.product_id = p.id
       left join categories c on c.id = pcm.category_id
       where p.slug = $1
       limit 1`,
      [slug],
    );
    const row = productResult.rows[0];
    if (!row) return undefined;

    const variantsResult = await query<{
      id: string;
      sku: string | null;
      title: string | null;
      attributes: Record<string, unknown> | null;
      mrp: string | null;
      sale_price: string | null;
      is_active: boolean;
      quantity_available: number | null;
      image_url: string | null;
      linked_product_slug: string | null;
      linked_product_image: string | null;
    }>(
      `select
         pv.id,
         pv.sku,
         pv.title,
         pv.attributes,
         pv.mrp::text,
         pv.sale_price::text,
         pv.is_active,
         ii.quantity_available,
         pi.image_url,
         lp.slug as linked_product_slug,
         lpi.image_url as linked_product_image
       from product_variants pv
       left join inventory_items ii on ii.variant_id = pv.id
       left join product_images pi on pi.variant_id = pv.id and pi.sort_order = 0
       left join products lp on lp.id::text = pv.attributes->>'linked_product_id'
       left join product_images lpi on lpi.product_id = lp.id and lpi.sort_order = 0
       where pv.product_id = (select id from products where slug = $1 limit 1)
         and pv.is_active = true
       order by pv.created_at asc`,
      [slug],
    );

    const activeVariants = variantsResult.rows;
    const firstVariant = activeVariants[0];
    const product = toProduct({
      ...row,
      sku: firstVariant?.sku ?? null,
      stock: firstVariant?.quantity_available ?? row.stock ?? null,
      image: firstVariant?.image_url || row.image,
      price: firstVariant?.sale_price ?? row.price ?? "0",
      mrp: firstVariant?.mrp ?? row.mrp ?? "0",
    });

    product.variants = activeVariants.map((variant) => ({
      id: variant.id,
      sku: variant.sku ?? undefined,
      title: variant.title ?? undefined,
      attributes: variant.attributes ?? {},
      mrp: Number(variant.mrp ?? 0),
      salePrice: Number(variant.sale_price ?? 0),
      image: variant.image_url ?? variant.linked_product_image ?? undefined,
      stock: variant.quantity_available ?? undefined,
      linkedProductSlug: variant.linked_product_slug ?? undefined,
    }));

    return product;
  } catch {
    return undefined;
  }
}
