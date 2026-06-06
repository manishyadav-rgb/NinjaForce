import Link from "next/link";
import { categories } from "@/data/categories";

export function CategoryNav() {
  return (
    <nav className="hide-scrollbar hidden overflow-x-auto border-t border-border bg-background-elevated lg:block" aria-label="Product categories">
      <div className="qh-container flex items-center justify-center gap-6 py-3 text-md font-semibold text-text-muted">
        {categories.slice(0, 8).map((category) => (
          <Link key={category.slug} href={`/category/${category.slug}`} className="whitespace-nowrap transition-colors duration-fast hover:text-brand-primary">
            {category.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}

