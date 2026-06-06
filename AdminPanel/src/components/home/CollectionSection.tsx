import Image from "next/image";
import Link from "next/link";
import { collections } from "@/data/collections";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function CollectionSection() {
  return (
    <section className="qh-container qh-section-pad">
      <SectionHeader eyebrow="Mood-led shopping" title="Collections for every little corner" description="Shop by story when you know the feeling before you know the product." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {collections.map((collection) => (
          <Link key={collection.slug} href={`/search?q=${encodeURIComponent(collection.title)}`} className="group qh-card relative qh-collection-card overflow-hidden p-5 text-text-inverse">
            <Image src={collection.image} alt={collection.title} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition-transform duration-slow group-hover:scale-105" />
            <div className="absolute inset-0 qh-collection-scrim" />
            <div className="relative z-base flex h-full flex-col justify-end">
              <h3 className="font-display text-2xl font-semibold">{collection.title}</h3>
              <p className="mt-2 text-sm text-text-inverse">{collection.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

