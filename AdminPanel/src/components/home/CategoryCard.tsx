import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/data/categories";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/category/${category.slug}`} className="group block text-center transition-all duration-base hover:-translate-y-1">
      <div className="qh-image-shell relative mx-auto h-28 w-28 rounded-full border border-border bg-background-elevated shadow-soft md:h-36 md:w-36">
        <Image src={category.image} alt={category.name} fill sizes="(min-width: 1024px) 20vw, 50vw" className="object-cover transition-transform duration-slow group-hover:scale-105" />
      </div>
      <div className="pt-3">
        <h3 className="text-base font-bold text-text-main group-hover:text-brand-primary">{category.name}</h3>
      </div>
    </Link>
  );
}

