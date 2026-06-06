import { products } from "@/data/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function BestSellers() {
  return (
    <section className="qh-container qh-section-pad">
      <SectionHeader eyebrow="Customer favourites" title="Best sellers for instant home glow-ups" />
      <ProductGrid products={products.slice(0, 4)} />
    </section>
  );
}

