import Link from "next/link";
import { query } from "@/lib/db";
import { SectionHeader } from "@/components/ui/SectionHeader";

type CollectionWithProducts = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  products: { slug: string; title: string; image_url: string | null }[];
};

async function getActiveCollections(): Promise<CollectionWithProducts[]> {
  try {
    const colResult = await query<{ id: string; name: string; slug: string; description: string | null; image_url: string | null }>(
      "select id, name, slug, description, image_url from collections where is_active = true order by sort_order, created_at desc limit 6",
    );

    const collections: CollectionWithProducts[] = [];
    for (const col of colResult.rows) {
      const prodResult = await query<{ product_slug: string }>(
        "select product_slug from collection_products where collection_id = $1 order by sort_order limit 8",
        [col.id],
      );

      // Get product details from store_products
      const productSlugs = prodResult.rows.map((r) => r.product_slug);
      let products: { slug: string; title: string; image_url: string | null }[] = [];

      if (productSlugs.length > 0) {
        const placeholders = productSlugs.map((_, i) => `$${i + 1}`).join(",");
        const detailResult = await query<{ slug: string; title: string; image_url: string | null }>(
          `select slug, title, image_url from store_products where slug in (${placeholders}) and is_active = true`,
          productSlugs,
        );
        products = detailResult.rows;
      }

      collections.push({ ...col, products });
    }

    return collections;
  } catch {
    return [];
  }
}

export async function CollectionsSection() {
  const collections = await getActiveCollections();

  if (collections.length === 0) return null;

  return (
    <section className="qh-container qh-section-pad">
      <SectionHeader
        eyebrow="Collections"
        title="Shop by collection"
        description="Curated product sets to help you discover your style."
      />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((col) => (
          <Link
            key={col.id}
            href={`/search?collection=${encodeURIComponent(col.slug)}`}
            className="group qh-card overflow-hidden transition-all duration-base hover:-translate-y-1 hover:shadow-dropdown"
          >
            {/* Image Grid */}
            <div className="grid h-48 grid-cols-3 gap-px bg-background-muted">
              {col.products.slice(0, 3).map((p, i) => (
                <div key={p.slug} className="relative overflow-hidden bg-background-soft">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-slow group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-text-soft">No image</div>
                  )}
                </div>
              ))}
              {col.products.length < 3 &&
                Array.from({ length: 3 - col.products.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-background-soft" />
                ))}
            </div>
            {/* Info */}
            <div className="p-4">
              <h3 className="text-lg font-black text-text-main group-hover:text-brand-primary transition-colors duration-fast">
                {col.name}
              </h3>
              {col.description && (
                <p className="mt-1 text-sm text-text-muted line-clamp-2">{col.description}</p>
              )}
              <p className="mt-2 text-sm font-semibold text-brand-primary">
                {col.products.length} product{col.products.length !== 1 ? "s" : ""} →
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
