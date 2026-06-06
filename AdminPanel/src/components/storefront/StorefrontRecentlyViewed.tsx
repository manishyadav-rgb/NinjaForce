"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { formatPrice } from "@/data/products";

type RecentItem = {
  slug: string;
  title: string;
  image: string;
  price: number;
  mrp: number;
};

const RECENT_KEY = "qh_recently_viewed_products_v1";

export function StorefrontRecentlyViewed({ settings }: { settings: Record<string, any> }) {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {
      setItems([]);
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="qh-container qh-section-pad">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-black text-text-main">
          {settings.heading || "Recently Viewed Products"}
        </h2>
        {settings.subheading ? <p className="mt-2 text-text-muted">{settings.subheading}</p> : null}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {items.slice(0, 8).map((item) => (
          <Link key={item.slug} href={`/${item.slug}`} className="overflow-hidden rounded-xl border border-border bg-background-elevated">
            <div className="relative aspect-square bg-background-soft">
              <Image src={item.image} alt={item.title} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-semibold text-text-main">{item.title}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-bold text-text-main">{formatPrice(item.price)}</span>
                {item.mrp > item.price ? <span className="text-xs text-text-soft line-through">{formatPrice(item.mrp)}</span> : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

