import { products } from "@/data/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function NewArrivals() {
  return (
    <section className="qh-container qh-section-pad">
      <SectionHeader eyebrow="Fresh drop" title="New arrivals with main-character energy" />
      <ProductGrid products={products.slice(1, 5)} />
    </section>
  );
}

