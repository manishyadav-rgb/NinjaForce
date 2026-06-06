import { categories } from "@/data/categories";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CategoryCard } from "./CategoryCard";

export function CategoryGrid() {
  return (
    <section className="qh-container py-8 md:py-12">
      <SectionHeader eyebrow="Shop by category" title="Home decor, furnishing and essentials" description="Find bedding, wall decor, lighting, kitchen, dining, bath, garden, gifts, storage and showpieces in one place." />
      <div className="grid grid-cols-3 gap-x-3 gap-y-7 md:grid-cols-5 lg:gap-8">
        {categories.map((category) => (
          <CategoryCard key={category.slug} category={category} />
        ))}
      </div>
    </section>
  );
}

