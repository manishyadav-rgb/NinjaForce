/**
 * Builder Canvas Section Previews
 * 
 * Each component renders a WYSIWYG preview of a storefront section.
 * These use the EXACT same HTML structure and Tailwind classes as
 * the QuirkyHome storefront components, minus framer-motion animations.
 * 
 * Since the AdminPanel and QuirkyHome share identical tailwind.config.ts
 * (same CSS custom properties / design tokens), these previews are
 * pixel-perfect matches of the live storefront.
 */

import React, { useState, useEffect } from "react";
import type { Section } from "@/lib/builder/types";
import { withSiteId } from "@/lib/site-context";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* â”€â”€â”€ BannerStrip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function BannerStripPreview({ settings }: { settings: Section["settings"] }) {
  return (
    <div
      className="px-4 py-2.5 text-center text-sm font-semibold"
      style={{
        backgroundColor: settings.bgColor || "#008060",
        color: settings.textColor || "#ffffff",
      }}
    >
      {settings.text}
    </div>
  );
}

/* â”€â”€â”€ HeroBanner (matches HeroSection.tsx 1:1) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function HeroBannerPreview({ settings }: { settings: Section["settings"] }) {
  const heading = settings.heading || "Buy Home Decor Items Online for Every Indian Home";
  const subheading = settings.subheading || "Shop bedsheets, wall decor, table lamps, kitchen essentials, dining pieces, planters, gifts, and curated home accessories at friendly prices.";
  const badgeText = settings.badgeText || "Festive Home Refresh Sale";
  const button1Text = settings.button1Text || "Shop the Sale";
  const button2Text = settings.button2Text || "Explore Collections";
  const imageUrl = settings.imageUrl || "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=80";
  const feature1 = settings.feature1 || "Fast delivery";
  const feature2 = settings.feature2 || "Secure checkout";
  const feature3 = settings.feature3 || "Curated picks";

  return (
    <section className="bg-background-elevated">
      <div className="qh-container py-4 md:py-8">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-background-soft shadow-soft">
          <img src={imageUrl} alt="" className="h-[360px] w-full object-cover md:h-[460px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-black/10 md:from-black/55 md:via-black/25 md:to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="w-full max-w-xl p-5 md:p-10">
          {badgeText && (
                <div className="mb-4 w-fit rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#202223] inline-flex items-center">
              âœ¨ {badgeText}
            </div>
          )}
              <h1 className="font-display text-[1.75rem] font-black leading-tight text-white md:text-[2.6rem]">
                {heading}
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/90 md:text-base">{subheading}</p>
              <div className="mt-6 bp-btn-group">
            {button1Text && (
                  <span className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#202223] shadow-glow md:h-12 md:px-8 md:text-base">
                {button1Text}
              </span>
            )}
            {button2Text && (
                  <span className="inline-flex h-11 items-center justify-center rounded-full border border-white/70 bg-transparent px-6 text-sm font-semibold text-white md:h-12 md:px-8 md:text-base">
                {button2Text}
              </span>
            )}
              </div>
              <div className="mt-6 bp-features font-bold text-white/95">
            {feature1 && <div className="flex items-center gap-2">ðŸšš {feature1}</div>}
            {feature2 && <div className="flex items-center gap-2">ðŸ›¡ï¸ {feature2}</div>}
            {feature3 && <div className="flex items-center gap-2">âœ¨ {feature3}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* â”€â”€â”€ SearchBand (matches page.tsx search chips) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function SearchBandPreview({ settings }: { settings: Section["settings"] }) {
  const chips = (settings.chips || "").split(",").map((c: string) => c.trim()).filter(Boolean);
  return (
    <section className="qh-market-band">
      <div className="qh-container flex flex-wrap items-center gap-3 py-4">
        <span className="text-sm font-black text-text-main">{settings.label || "Search for"}</span>
        {chips.map((chip: string) => (
          <span key={chip} className="bp-chip rounded-full border border-text-main/10 bg-background-elevated px-4 py-2 text-sm font-bold text-text-main shadow-soft">
            {chip}
          </span>
        ))}
      </div>
    </section>
  );
}

/* â”€â”€â”€ CategoryGrid (matches CategoryGrid.tsx) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function CategoryGridPreview({ settings }: { settings: Section["settings"] }) {
  const eyebrow = settings.eyebrow || "Shop by category";
  const heading = settings.heading || "Home decor, furnishing and essentials";
  const subheading = settings.subheading || "Find bedding, wall decor, lighting, kitchen, dining, bath, garden, gifts, storage and showpieces in one place.";

  const demoCategories = [
    { name: "Bedding", image: "https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=300&q=60" },
    { name: "Furnishing", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=60" },
    { name: "Organiser", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=300&q=60" },
    { name: "Bath Gifts", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=60" },
    { name: "New Arrival", image: "https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=300&q=60" },
  ];

  return (
    <section className="qh-container qh-section-pad">
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase text-brand-primary">{eyebrow}</p>
        <h2 className="font-display text-3xl font-black text-text-main">{heading}</h2>
        <p className="mt-3 text-base leading-relaxed text-text-muted">{subheading}</p>
      </div>
      <div className="grid bp-cat-grid gap-y-7">
        {demoCategories.map((cat) => (
          <div key={cat.name} className="block text-center">
            <div className="relative mx-auto bp-cat-img overflow-hidden rounded-full border border-border bg-background-elevated shadow-soft">
              <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
            </div>
            <div className="pt-3">
              <h3 className="text-base font-bold text-text-main">{cat.name}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* â”€â”€â”€ CollectionsSection (matches CollectionsSection.tsx) â”€â”€â”€â”€ */

export function CollectionsSectionPreview({ settings }: { settings: Section["settings"] }) {
  const eyebrow = settings.eyebrow || "Collections";
  const heading = settings.heading || "Shop by collection";
  const subheading = settings.subheading || "Curated product sets to help you discover your style.";
  const collectionSlug = settings.collectionSlug || "";

  const [selectedCol, setSelectedCol] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!collectionSlug) {
      setSelectedCol(null);
      return;
    }
    setLoading(true);
    fetch(withSiteId(`/api/admin/collections?products=1`))
      .then((r) => r.json())
      .then((data) => {
        const found = data.collections?.find((c: any) => c.slug === collectionSlug);
        setSelectedCol(found || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [collectionSlug]);

  return (
    <section className="qh-container qh-section-pad">
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase text-brand-primary">{eyebrow}</p>
        <h2 className="font-display text-3xl font-black text-text-main">{heading}</h2>
        <p className="mt-3 text-base leading-relaxed text-text-muted">{subheading}</p>
      </div>

      {!collectionSlug ? (
        <div className="rounded-xl border-2 border-dashed border-border p-8 text-center text-text-muted bg-background-elevated">
          ðŸ“‚ Please select a collection in the sidebar settings.
        </div>
      ) : loading ? (
        <div className="text-center text-text-muted py-8 bg-background-elevated rounded-xl border border-border">Loading collection preview...</div>
      ) : selectedCol ? (
        /* Single premium collection row layout â€” exactly 1 collection per row */
        <div className="group rounded-2xl border border-border bg-background-elevated overflow-hidden shadow-soft transition-all duration-base hover:shadow-dropdown">
          <div className="grid md:grid-cols-12 items-stretch divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Info and Banner block (left 5 columns) */}
            <div className="md:col-span-5 p-6 flex flex-col justify-between bg-gradient-to-br from-brand-primary/5 via-transparent to-transparent">
              <div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary">Collection Spotlight</span>
                  {selectedCol.is_active === false && (
                    <span className="rounded-full bg-[#ffe0b2] border border-[#ffb74d] px-2.5 py-0.5 text-[10px] font-bold text-[#e65100] inline-flex items-center gap-1 shadow-sm animate-pulse">
                      âš ï¸ Hidden from Storefront
                    </span>
                  )}
                </div>
                <h3 className="mt-4 font-display text-2xl font-black text-text-main group-hover:text-brand-primary transition-colors">{selectedCol.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-muted line-clamp-4">
                  {selectedCol.description || "Explore our carefully handpicked items curated for high quality and beautiful aesthetics."}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-text-soft">{selectedCol.products?.length || 0} product(s) inside</span>
                <span className="text-sm font-bold text-brand-primary group-hover:translate-x-1 transition-transform">View Collection â†’</span>
              </div>
            </div>
            {/* Products grid preview (right 7 columns) */}
            <div className="md:col-span-7 bg-background-soft p-6 flex items-center justify-center">
              {selectedCol.products && selectedCol.products.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 w-full">
                  {selectedCol.products.slice(0, 3).map((slug: string, i: number) => (
                    <div key={slug} className="aspect-square bg-background-elevated rounded-xl border border-border/40 overflow-hidden relative shadow-soft">
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-text-soft bg-background-muted">
                        Product {i + 1}
                      </div>
                      <span className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[8px] font-bold text-white">#{i+1}</span>
                    </div>
                  ))}
                  {selectedCol.products.length < 3 && Array.from({ length: 3 - selectedCol.products.length }).map((_, i) => (
                    <div key={i} className="aspect-square bg-background-elevated/40 border border-dashed border-border rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="text-center text-text-soft text-sm">No products in this collection yet.</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-red-500 py-4 bg-background-elevated rounded-xl border border-border">Selected collection not found.</div>
      )}
    </section>
  );
}

/* â”€â”€â”€ ProductGrid (matches page.tsx product section) â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function ProductGridPreview({ settings }: { settings: Section["settings"] }) {
  const eyebrow = settings.eyebrow || "Sale picks";
  const heading = settings.heading || "Premium finds, friendly prices";
  const subheading = settings.subheading || "Shop bestselling home decor products.";
  const cols = parseInt(settings.columns || "4");
  const rows = parseInt(settings.rows || "2");
  const gap = parseInt(settings.gap || "24");
  const total = cols * rows;
  const source = settings.productSource || "manual";
  const selectedIds: string[] = settings.productIds || [];

  const [products, setProducts] = useState<any[]>([]);
  
  useEffect(() => {
    fetch(withSiteId("/api/admin/products"))
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Filter by selected IDs or show all
  let displayProducts = products;
  if (source === "manual" && selectedIds.length > 0) {
    displayProducts = products.filter(p => selectedIds.includes(p.id));
  }
  displayProducts = displayProducts.slice(0, total);

  // Pad with placeholders if not enough
  const cards = [...displayProducts];
  while (cards.length < total) cards.push(null);

  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <section className="qh-container qh-section-pad">
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase text-brand-primary">{eyebrow}</p>
        <h2 className="font-display text-3xl font-black text-text-main">{heading}</h2>
        <p className="mt-3 text-base leading-relaxed text-text-muted">{subheading}</p>
      </div>
      <div className="mb-3 flex items-center gap-2 text-[11px] text-text-muted">
        <span className="rounded bg-background-soft px-2 py-0.5 font-semibold">
          {source === "manual" ? `Manual â€¢ ${selectedIds.length} selected` : source === "latest" ? "Latest" : "All"}
        </span>
        <span>{cols}x{rows} = {total} cards</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: `${gap}px` }}>
        {cards.map((p, i) => (
          <div key={p?.id || i} className="qh-card overflow-hidden">
            <div className="relative rounded-b-none rounded-t-xl bg-background-soft" style={{ aspectRatio: "1/1" }}>
              {p?.image_url ? (
                <img src={p.image_url} alt="" className="h-full w-full object-cover rounded-t-xl" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-text-soft">Product {i + 1}</div>
              )}
              {p && <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-yellow-400">â˜… 4.5</div>}
              {p && Number(p.mrp) > Number(p.sale_price) && (
                <div className="absolute left-2 top-2">
                  <span className="rounded-full bg-accent-sale px-2.5 py-0.5 text-[10px] font-bold text-white">
                    {Math.round(((Number(p.mrp) - Number(p.sale_price)) / Number(p.mrp)) * 100)}% Off
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2 p-3">
              <h3 className="line-clamp-2 text-sm font-bold leading-snug text-text-main">{p?.title || "Sample Product"}</h3>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-base font-bold text-text-main">{p ? fmt(Number(p.sale_price || p.mrp || 599)) : "Rs. 599"}</span>
                {p?.mrp && Number(p.mrp) > Number(p.sale_price) && <span className="text-xs text-text-soft line-through">{fmt(Number(p.mrp))}</span>}
              </div>
              <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-background-elevated px-4 py-2 text-xs font-semibold text-text-main">
                ðŸ›’ Add to Cart
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}



/* â”€â”€â”€ PromisesSection (matches page.tsx promises) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function ProductGrid2Preview({ settings }: { settings: Section["settings"] }) {
  const desktopCols = Math.min(6, Math.max(2, parseInt(settings.desktopColumns || "6")));
  const mobileCols = Math.min(2, Math.max(1, parseInt(settings.mobileColumns || "2")));
  const gap = Math.min(32, Math.max(8, Number(settings.gap || 16)));
  const radius = Math.min(28, Math.max(4, Number(settings.cardRadius || 14)));
  const buttonText = settings.buttonText || "Add To Cart";
  const source = settings.productSource || "manual";
  const selectedIds: string[] = settings.productIds || [];
  const viewAllText = settings.viewAllText || "View All Products";

  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    fetch(withSiteId("/api/admin/products"))
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  let allCards = products;
  if (source === "manual" && selectedIds.length > 0) {
    const manualCards = products.filter((p) => selectedIds.includes(String(p.id)));
    allCards = manualCards.length > 0 ? manualCards : products;
  } else if (source === "latest") {
    allCards = products.slice(0, 30);
  }
  const visibleCards = allCards.slice(0, 6);
  const hasMore = allCards.length > 6;

  const uid = `qh-pg2-preview-${Math.random().toString(36).slice(2, 7)}`;
  const css = `
    .${uid} { display: grid; grid-template-columns: repeat(${mobileCols}, minmax(0, 1fr)); gap: ${Math.min(gap, 12)}px; }
    @media (min-width: 768px) {
      .${uid} { grid-template-columns: repeat(${desktopCols}, minmax(0, 1fr)); gap: ${gap}px; }
    }
  `;

  return (
    <section className="qh-container qh-section-pad">
      {(settings.heading || settings.subheading) && (
        <div className="mb-5">
          {settings.heading && <h2 className="font-display text-xl font-black text-text-main md:text-2xl">{settings.heading}</h2>}
          {settings.subheading && <p className="mt-2 text-sm text-text-muted md:text-base">{settings.subheading}</p>}
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {visibleCards.length ? (
        <div className={uid}>
          {visibleCards.map((card, i) => (
            <article key={card.id || i} className="rounded-xl bg-[#efefef] p-2" style={{ borderRadius: `${Math.max(radius - 2, 8)}px` }}>
              <div className="relative overflow-hidden" style={{ borderRadius: `${radius}px`, aspectRatio: "3 / 4" }}>
                {card.image_url ? (
                  <img src={card.image_url} alt={card.title} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#f7be94] to-[#eb7e4d]" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-3 pb-4 pt-8 text-white">
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-xl font-black leading-none">{`Rs. ${Math.round(Number(card.sale_price || card.mrp || 0))}`}</span>
                    {Number(card.mrp) > Number(card.sale_price) && <span className="text-base text-white/70 line-through">{`Rs. ${Math.round(Number(card.mrp))}`}</span>}
                  </div>
                </div>
              </div>
              <button type="button" className="mt-2 w-full rounded-[10px] border border-black/70 bg-white py-2 text-[13px] font-bold text-black md:text-sm">
                {buttonText}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-background-elevated p-6 text-sm text-text-muted">
          No products available for this section.
        </div>
      )}
      {hasMore && (
        <div className="mt-5 flex justify-center">
          <span className="inline-flex rounded-[10px] border border-black/70 bg-white px-5 py-2 text-sm font-semibold text-black">
            {viewAllText}
          </span>
        </div>
      )}
    </section>
  );
}

export function ItemGridPreview({ settings }: { settings: Section["settings"] }) {
  const items = Array.from({ length: 6 }, (_, i) => {
    const n = i + 1;
    return {
      image: settings[`item${n}Image`] || "",
    };
  });

  return (
    <section className="qh-container qh-section-pad">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
        {items.map((item, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-background-elevated">
            <div className="aspect-square bg-background-soft">
              {item.image ? <img src={item.image} alt={`Item ${i + 1}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-text-soft">Image {i + 1}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RecentlyViewedProductsPreview({ settings }: { settings: Section["settings"] }) {
  return (
    <section className="qh-container qh-section-pad">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-black text-text-main">
          {settings.heading || "Recently Viewed Products"}
        </h2>
        <p className="mt-2 text-text-muted">{settings.subheading || "Continue where you left off"}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="overflow-hidden rounded-xl border border-border bg-background-elevated">
            <div className="aspect-square bg-background-soft" />
            <div className="p-3">
              <p className="text-sm font-semibold text-text-main">Recently viewed product {idx + 1}</p>
              <p className="mt-1 text-xs text-text-soft">Real customer viewed products yahan aayenge</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PromisesSectionPreview({ settings }: { settings: Section["settings"] }) {
  const eyebrow = settings.eyebrow || "Why choose us";
  const heading = settings.heading || "A calmer, warmer way to shop for home";

  const promises = [
    { emoji: "âœ¨", title: "Curated decor", text: "Thoughtfully selected pieces with warmth and personality." },
    { emoji: "ðŸ›¡ï¸", title: "Premium quality", text: "Affordable luxury without fragile showroom energy." },
    { emoji: "â†©ï¸", title: "Easy returns", text: "A smoother post-purchase experience for real life." },
    { emoji: "ðŸšš", title: "Fast shipping", text: "Quick dispatch across India on everyday favourites." },
    { emoji: "ðŸ’³", title: "Secure payments", text: "UPI, cards, wallets, and protected checkout flows." },
  ];

  return (
    <section className="qh-container qh-section-pad">
      <div className="mb-8 mx-auto max-w-narrow text-center">
        <p className="mb-2 text-sm font-bold uppercase text-brand-primary">{eyebrow}</p>
        <h2 className="font-display text-3xl font-black text-text-main">{heading}</h2>
      </div>
      <div className="grid bp-promises-grid">
        {promises.map((item) => (
          <div key={item.title} className="qh-card p-5 text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-background-soft text-brand-primary text-xl">
              {item.emoji}
            </div>
            <h3 className="font-semibold text-text-main">{item.title}</h3>
            <p className="mt-2 text-sm text-text-muted">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* â”€â”€â”€ Newsletter (matches page.tsx newsletter) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function NewsletterPreview({ settings }: { settings: Section["settings"] }) {
  const eyebrow = settings.eyebrow || "Decor notes";
  const heading = settings.heading || "Ideas, offers and new drops";
  const subheading = settings.subheading || "Get room styling inspiration, festive sale alerts and new home essentials in your inbox.";
  const buttonText = settings.buttonText || "Join Newsletter";

  return (
    <section className="qh-container qh-section-pad">
      <div className="grid gap-6 rounded-lg bg-background-soft p-6 qh-newsletter-grid items-center">
        <div>
          <div className="mb-8">
            <p className="mb-2 text-sm font-bold uppercase text-brand-primary">{eyebrow}</p>
            <h2 className="font-display text-3xl font-black text-text-main">{heading}</h2>
            <p className="mt-3 text-base leading-relaxed text-text-muted">{subheading}</p>
          </div>
        </div>
        <div className="grid gap-3">
          <input className="h-12 rounded-full border border-border bg-background-elevated px-5 text-text-main placeholder:text-text-soft" placeholder="Enter email for decor notes" readOnly />
          <span className="inline-flex h-12 items-center justify-center rounded-full bg-brand-primary px-8 text-base font-semibold text-text-inverse shadow-glow">
            {buttonText}
          </span>
        </div>
      </div>
    </section>
  );
}

/* â”€â”€â”€ SeoArticle (matches page.tsx SEO section) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function SeoArticlePreview({ settings }: { settings: Section["settings"] }) {
  const allowedTags = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
  const headingTag = allowedTags.has(String(settings.headingTag || "")) ? String(settings.headingTag) : "h2";
  const subheadingTag = allowedTags.has(String(settings.subheadingTag || "")) ? String(settings.subheadingTag) : "h2";
  const HeadingTag = headingTag as any;
  const SubheadingTag = subheadingTag as any;

  if (
    typeof settings.content === "string" &&
    settings.content.includes("<") &&
    settings.content.includes(">")
  ) {
    return (
      <section className="qh-container qh-section-pad">
        <article
          className="qh-seo-copy max-w-none rounded-lg border border-border bg-background-elevated p-6 md:p-8"
          dangerouslySetInnerHTML={{ __html: settings.content || "" }}
        />
      </section>
    );
  }

  return (
    <section className="qh-container qh-section-pad">
      <article className="qh-seo-copy max-w-none rounded-lg border border-border bg-background-elevated p-6 md:p-8">
        {settings.headingText ? <HeadingTag>{String(settings.headingText)}</HeadingTag> : null}
        {settings.content ? <p>{String(settings.content)}</p> : null}
        {settings.subheadingText ? <SubheadingTag>{String(settings.subheadingText)}</SubheadingTag> : null}
        {settings.content2 ? <p>{String(settings.content2)}</p> : null}
      </article>
    </section>
  );
}

/* â”€â”€â”€ Testimonials â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function TestimonialsPreview({ settings }: { settings: Section["settings"] }) {
  const testimonials = [
    { name: settings.testimonial1Name, text: settings.testimonial1Text },
    { name: settings.testimonial2Name, text: settings.testimonial2Text },
    { name: settings.testimonial3Name, text: settings.testimonial3Text },
  ].filter((t) => t.name && t.text);

  return (
    <section className="qh-container qh-section-pad">
      <h2 className="mb-8 text-center font-bold text-text-main">{settings.heading}</h2>
      <div className="grid bp-testimonial-grid">
        {testimonials.map((t, i) => (
          <div key={i} className="qh-card p-6">
            <div className="mb-3 text-2xl text-brand-primary">"</div>
            <p className="text-sm leading-relaxed text-text-muted">{t.text}</p>
            <p className="mt-4 text-sm font-semibold text-text-main">â€” {t.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* â”€â”€â”€ RichText â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function RichTextPreview({ settings }: { settings: Section["settings"] }) {
  const headingAlign = settings.headingAlign === "left" || settings.headingAlign === "right"
    ? settings.headingAlign
    : (settings.textAlign === "left" || settings.textAlign === "right" ? settings.textAlign : "center");
  const contentAlign = settings.contentAlign === "left" || settings.contentAlign === "right"
    ? settings.contentAlign
    : (settings.textAlign === "left" || settings.textAlign === "right" ? settings.textAlign : "center");
  const headingSize = settings.headingSize === "small" ? "1.15rem" : settings.headingSize === "large" ? "1.8rem" : "1.45rem";
  const contentSize = settings.contentSize === "small" ? "0.92rem" : settings.contentSize === "large" ? "1.08rem" : "1rem";
  return (
    <section className="qh-container qh-section-pad">
      <div>
        {settings.heading ? (
          <h2 className="mb-4 font-display font-black text-text-main" style={{ fontSize: headingSize, lineHeight: 1.2, textAlign: headingAlign }}>
            {settings.heading}
          </h2>
        ) : null}
        <div className="qh-seo-copy max-w-none text-text-muted" style={{ fontSize: contentSize, textAlign: contentAlign }} dangerouslySetInnerHTML={{ __html: settings.content || "" }} />
      </div>
    </section>
  );
}

/* â”€â”€â”€ ImageWithText â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function ImageWithTextPreview({ settings }: { settings: Section["settings"] }) {
  return (
    <section className="qh-container qh-section-pad bp-img-text">
      <img src={settings.imageUrl || "https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80"} alt="" className="rounded-lg object-cover w-full" style={{ maxHeight: 400 }} />
      <div>
        <h2 className="text-3xl font-bold mb-4 text-text-main">{settings.heading}</h2>
        <p className="text-text-muted mb-6">{settings.text}</p>
      </div>
    </section>
  );
}

/* â”€â”€â”€ FeaturedCollection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function FeaturedCollectionPreview({ settings }: { settings: Section["settings"] }) {
  return (
    <section className="qh-container qh-section-pad">
      <h2 className="text-2xl font-bold mb-6 text-center text-text-main">{settings.heading}</h2>
      <div className="text-center text-text-muted">Featured Collection: {settings.collectionId || "None"}</div>
    </section>
  );
}

/* â”€â”€â”€ Slideshow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function SlideshowPreview({ settings }: { settings: Section["settings"] }) {
  return (
    <div className="relative overflow-hidden" style={{ height: settings.height || "500px" }}>
      <img src={settings.slide1Image || "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=80"} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <h2 className="font-black text-white">{settings.slide1Heading || "New Season Collection"}</h2>
        <p className="mt-3 text-lg opacity-90">{settings.slide1Subtext || "Explore our latest arrivals"}</p>
      </div>
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-white" /><div className="h-2.5 w-2.5 rounded-full bg-white/50" />
      </div>
    </div>
  );
}

/* â”€â”€â”€ ImageGrid Preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function ImageGridPreview({ settings }: { settings: Section["settings"] }) {
  const gap = settings.gap ?? 12;
  const radius = settings.borderRadius ?? 12;
  const height = settings.desktopHeight ?? 360;

  const uid = `qh-preview-imggrid-${Math.random().toString(36).slice(2, 8)}`;
  const css = `
    .${uid} {
      display: grid;
      grid-template-columns: 2fr 1fr;
      grid-template-rows: repeat(2, ${Math.round(height / 2)}px);
      gap: ${gap}px;
      height: ${height}px;
    }
    .${uid} > div {
      height: 100%;
      width: 100%;
    }
    .${uid} .qh-ig-large {
      grid-row: 1 / 3;
    }

    @container (max-width: 767px) {
      .${uid} {
        grid-template-columns: repeat(2, 1fr) !important;
        grid-template-rows: auto auto !important;
        height: auto !important;
        gap: ${gap}px !important;
      }
      .${uid} > div {
        height: 160px !important;
      }
      .${uid} .qh-ig-large {
        grid-column: span 2 !important;
        grid-row: auto !important;
        height: 240px !important;
      }
    }
  `;

  const renderSlot = (imageUrl: string, alt: string, placeholder: string) => (
    <div
      className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 h-full w-full"
      style={{ borderRadius: `${radius}px` }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={alt || ""} className="absolute inset-0 h-full w-full object-cover" style={{ borderRadius: `${radius}px` }} />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          <span className="text-xs font-medium">{placeholder}</span>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "16px 24px" }}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={uid}>
        <div className="qh-ig-large">
          {renderSlot(settings.image1Url, settings.image1Alt, "Image 1 (Large â€” Left)")}
        </div>
        <div>
          {renderSlot(settings.image2Url, settings.image2Alt, "Image 2 (Top Right)")}
        </div>
        <div>
          {renderSlot(settings.image3Url, settings.image3Alt, "Image 3 (Bottom Right)")}
        </div>
      </div>
    </div>
  );
}

export function FiveGridPreview({ settings }: { settings: Section["settings"] }) {
  const gap = Number(settings.gap ?? 16);
  const radius = Number(settings.radius ?? 22);
  const uid = `qh-preview-fivegrid-${Math.random().toString(36).slice(2, 8)}`;

  const css = `
    .${uid} { display: grid; gap: ${gap}px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .${uid} .fg-item { position: relative; min-height: 140px; overflow: hidden; }
    .${uid} .fg-item-3, .${uid} .fg-item-5 { grid-column: 1 / -1; min-height: 170px; }
    .${uid} .fg-item-2 { display: none; }
    .${uid} .fg-overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 56%, transparent 100%); }
    .${uid} .fg-copy { position: absolute; left: 0; right: 0; bottom: 0; z-index: 2; padding: 14px; }
    .${uid} .fg-copy.right { text-align: right; }
    .${uid} .fg-title { color: #fff; font-size: 13px; font-weight: 700; letter-spacing: 0.3px; line-height: 1.25; text-transform: uppercase; margin-bottom: 3px; }
    .${uid} .fg-off { color: #f2f2f2; font-size: 10px; margin-bottom: 8px; }
    .${uid} .fg-btn { display: inline-flex; align-items: center; justify-content: center; border-radius: 4px; background: #fff; color: #111; font-size: 10px; font-weight: 700; padding: 5px 12px; }
    @media (min-width: 1024px) {
      .${uid} {
        grid-template-columns: 1.1fr 1fr 1fr;
        grid-template-rows: repeat(2, minmax(220px, 1fr));
      }
      .${uid} .fg-item { min-height: 220px; }
      .${uid} .fg-item-2 { display: block; }
      .${uid} .fg-item-1 { grid-row: 1 / 3; grid-column: 1 / 2; min-height: 100%; }
      .${uid} .fg-item-2 { grid-row: 1 / 2; grid-column: 2 / 3; }
      .${uid} .fg-item-3 { grid-row: 1 / 2; grid-column: 3 / 4; }
      .${uid} .fg-item-4 { grid-row: 2 / 3; grid-column: 2 / 3; }
      .${uid} .fg-item-5 { grid-row: 2 / 3; grid-column: 3 / 4; }
      .${uid} .fg-title { font-size: 14px; }
      .${uid} .fg-off { font-size: 11px; }
      .${uid} .fg-btn { font-size: 11px; padding: 6px 14px; }
      .${uid} .fg-item-1 .fg-copy { padding: 18px; }
      .${uid} .fg-item-1 .fg-title { font-size: 22px; line-height: 1.2; }
      .${uid} .fg-item-1 .fg-off { font-size: 14px; }
      .${uid} .fg-item-1 .fg-btn { padding: 8px 20px; font-size: 12px; }
    }
  `;

  const items = [1, 2, 3, 4, 5].map((n) => ({
    key: n,
    image: settings[`image${n}Url`],
    alt: settings[`image${n}Alt`] || `Grid image ${n}`,
    title: settings[`image${n}Title`] || `Image ${n}`,
    offer: settings[`image${n}Offer`] || "",
    cta: settings[`image${n}Cta`] || "Shop Now",
    textAlign: settings[`image${n}TextAlign`] === "right" ? "right" : "left",
  }));

  return (
    <div style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "16px 24px" }}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={uid}>
        {items.map((item) => (
          <div
            key={item.key}
            className={`fg-item fg-item-${item.key} relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200`}
            style={{ borderRadius: `${radius}px` }}
          >
            {item.image ? (
              <img src={item.image} alt={item.alt} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">Image {item.key}</div>
            )}
            <div className="fg-overlay" />
            <div className={`fg-copy ${item.textAlign === "right" ? "right" : ""}`}>
              <p className="fg-title">{item.title}</p>
              {item.offer ? <p className="fg-off">{item.offer}</p> : null}
              <span className="fg-btn">{item.cta}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* â”€â”€â”€ ImageBanner Preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function ImageBannerPreview({ settings }: { settings: Section["settings"] }) {
  const height = settings.desktopHeight ?? 280;
  const radius = settings.borderRadius ?? 12;
  const fullWidth = settings.fullWidth ?? false;
  const imageUrl = settings.desktopImageUrl || settings.imageUrl || "";
  const mobileImageUrl = settings.mobileImageUrl || imageUrl;

  return (
    <section style={{ padding: "8px 0" }}>
      <div style={{ maxWidth: fullWidth ? "100%" : "var(--container-max)", margin: "0 auto", padding: fullWidth ? 0 : "0 24px" }}>
        <div
          className="relative overflow-hidden bg-background-soft"
          style={{ height: `${height}px`, borderRadius: fullWidth ? `0 0 ${Math.max(radius + 8, 20)}px ${Math.max(radius + 8, 20)}px` : `${radius}px` }}
        >
          {imageUrl ? (
            <>
              <img src={imageUrl} alt="" className="hidden h-full w-full object-cover md:block" />
              <img src={mobileImageUrl} alt="" className="h-full w-full object-cover md:hidden" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-text-soft">
              Banner image preview
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function SlideBannerPreview({ settings }: { settings: Section["settings"] }) {
  const slides = Array.from({ length: 15 }, (_, i) => {
    const n = i + 1;
    const desktopImage = settings[`slide${n}Image`] || "";
    const mobileImage = settings[`slide${n}MobileImage`] || desktopImage;
    return { image: desktopImage, mobileImage, alt: settings[`slide${n}Alt`] || "" };
  }).filter((s) => s.image || s.mobileImage);
  const activeSlides = slides.length ? slides : [{ image: "", mobileImage: "", alt: "" }];
  const [index, setIndex] = useState(0);
  const autoPlay = settings.autoPlay !== false;
  const intervalMs = Math.max(2, Number(settings.intervalSec || 4)) * 1000;
  const radius = Math.max(0, Number(settings.radius || 16));
  const mobileHeight = Math.max(80, Number(settings.heightMobile || 220));
  const desktopHeight = Math.max(120, Number(settings.heightDesktop || 360));
  const fullWidth = settings.sectionFullWidth === true;
  const mobileAutoHeight = settings.mobileAutoHeight !== false;
  const desktopAutoHeight = settings.desktopAutoHeight !== false;
  const mobileFit = settings.fitMobile === "cover" ? "cover" : "contain";
  const desktopFit = settings.fitDesktop === "cover" ? "cover" : "contain";
  const mobileImageClass = mobileAutoHeight ? `block w-full h-auto object-${mobileFit}` : `h-full w-full object-${mobileFit}`;
  const desktopImageClass = desktopAutoHeight ? `block w-full h-auto object-${desktopFit}` : `h-full w-full object-${desktopFit}`;

  useEffect(() => {
    if (!autoPlay || activeSlides.length <= 1) return;
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % activeSlides.length), intervalMs);
    return () => clearInterval(timer);
  }, [autoPlay, intervalMs, activeSlides.length]);

  return (
    <section className={`${fullWidth ? "w-full" : "qh-container"} qh-section-pad`}>
      {settings.heading ? <h3 className="mb-3 text-sm font-bold text-text-main md:text-base">{settings.heading}</h3> : null}
      <div className="relative overflow-hidden bg-[#8d67b7]" style={{ borderRadius: fullWidth ? "0" : `${radius}px` }}>
        <div className="md:hidden" style={mobileAutoHeight ? {} : { height: `${mobileHeight}px` }}>
          {activeSlides[index].mobileImage ? <img src={activeSlides[index].mobileImage} alt={activeSlides[index].alt} className={mobileImageClass} /> : <div className="flex h-full min-h-[120px] items-center justify-center bg-background-soft text-sm text-text-muted">Slide image</div>}
        </div>
        <div style={desktopAutoHeight ? {} : { height: `${desktopHeight}px` }} className="hidden md:block bg-black/10">
          {activeSlides[index].image ? <img src={activeSlides[index].image} alt={activeSlides[index].alt} className={desktopImageClass} /> : <div className="flex h-full min-h-[200px] items-center justify-center bg-background-soft text-sm text-text-muted">Slide image</div>}
        </div>
        {activeSlides.length > 1 && (
          <>
            <button className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-transparent p-1.5 text-white md:left-4" onClick={() => setIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-transparent p-1.5 text-white md:right-4" onClick={() => setIndex((prev) => (prev + 1) % activeSlides.length)}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}

export function SaleBannerPreview({ settings }: { settings: Section["settings"] }) {
  const endTime = new Date(settings.endDateTime || "").getTime();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, endTime - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  return (
    <section className="qh-container qh-section-pad" style={{ paddingTop: "10px" }}>
      <div className="grid gap-3 md:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-[#e9adc4] bg-[#f7f7f7] px-4 py-3 md:px-5">
          <p className="text-sm font-black text-[#121212] md:text-[18px]">Sale Ends In:</p>
          <div className="mt-1 flex items-baseline gap-1.5 text-[#d14a35]">
            {[days, hours, mins, secs].map((v, i) => (
              <span key={i} className="text-[26px] font-black leading-none md:text-[40px]">{String(v).padStart(2, "0")}{i < 3 ? <span className="px-1">:</span> : null}</span>
            ))}
          </div>
          <div className="mt-1 flex gap-4 text-[11px] font-medium text-[#2f2f2f] md:gap-6 md:text-sm"><span>Days</span><span>Hrs</span><span>Mins</span><span>Secs</span></div>
        </div>
        <div className="rounded-2xl border border-[#e9adc4] bg-[#f7f7f7] px-4 py-3 md:px-5">
          <div className="grid grid-cols-4 gap-3 text-center text-[11px] text-[#5d5d5d] md:text-sm">
            <div>25L+ Customers</div><div>Free Shipping</div><div>Free Installation</div><div>Best Warranty</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function NewArrivalPreview({ settings }: { settings: Section["settings"] }) {
  type Item = { icon: string; label: string };
  type Group = { tab: string; items: Item[] };
  const parse = (raw: any, fallback: Group[]): Group[] => {
    try {
      const p = JSON.parse(String(raw || "[]"));
      if (Array.isArray(p) && p.length) {
        return p
          .map((g: any) => ({
            tab: String(g?.tab || ""),
            items: Array.isArray(g?.items)
              ? g.items.map((it: any) => ({ icon: String(it?.icon || "*"), label: String(it?.label || "Item") }))
              : [],
          }))
          .filter((g: Group) => g.tab);
      }
    } catch {}
    return fallback;
  };

  const accessory = parse(settings.accessoryDataJson, [{ tab: "Wall Decor", items: [{ icon: "*", label: "Canvas Art" }, { icon: "*", label: "Mirrors" }] }]);
  const furniture = parse(settings.furnitureDataJson, [{ tab: "Sofas & Seating", items: [{ icon: "*", label: "3-Seater Sofa" }, { icon: "*", label: "Recliners" }] }]);
  const [cat, setCat] = useState<"accessory" | "furniture">("accessory");
  const data = cat === "accessory" ? accessory : furniture;
  const [tab, setTab] = useState(0);
  const active = data[Math.min(tab, Math.max(0, data.length - 1))] || { tab: "", items: [] as Item[] };

  const c = {
    sectionBg: settings.sectionBgColor2 || "#f0c8bc",
    cardBg: settings.cardBgColor || "#ffffff",
    title: settings.titleColor || "#2a1c19",
    subtitle: settings.subtitleColor || "#7a5550",
    accent: settings.accentColor || "#d9736a",
    badgeText: settings.badgeTextColor || "#ffffff",
    tabText: settings.tabTextColor || "#9a7470",
    tabActiveText: settings.tabActiveTextColor || "#d9736a",
    tabUnderline: settings.tabUnderlineColor || "#d9736a",
    tabBorder: settings.tabBorderColor || "#f0e6e3",
    itemCardBg: settings.itemCardBgColor || "#fdf4f3",
    itemCardBorder: settings.itemCardBorderColor || "#f0e0dc",
    itemText: settings.itemTextColor || "#7a5550",
    arrowBg: settings.arrowBgColor || "transparent",
    arrowBorder: settings.arrowBorderColor || "#e8d8d5",
    arrowText: settings.arrowTextColor || "#7a5550",
  };

  return (
    <section className="qh-container qh-section-pad">
      <div className="mx-auto w-full max-w-[640px] overflow-hidden rounded-[22px] shadow-[0_16px_56px_rgba(140,60,50,0.18)]" style={{ backgroundColor: c.sectionBg }}>
        <div className="px-4 pt-6 md:px-6 md:pt-7">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-[7px] px-3 py-1 font-serif text-[1.05rem] font-black tracking-[0.06em]" style={{ backgroundColor: c.accent, color: c.badgeText }}>
              {settings.badgeText || "NEW"}
            </span>
            <h2 className="font-serif text-2xl font-bold md:text-[1.75rem]" style={{ color: c.title }}>{settings.title || "Arrivals"}</h2>
          </div>
          <p className="mt-2 max-w-[370px] text-[0.87rem] leading-relaxed" style={{ color: c.subtitle }}>{settings.subtitle || "Be the first to explore our newest furniture and home essentials, crafted for modern homes."}</p>
          <div className="mt-4 flex items-end gap-1">
            <button
              className="relative rounded-t-[16px] px-4 pb-2 pt-3 text-[0.9rem]"
              style={{ backgroundColor: cat === "accessory" ? c.cardBg : "transparent", color: cat === "accessory" ? c.tabActiveText : c.tabText, fontWeight: cat === "accessory" ? 700 : 500 }}
              onClick={() => {
                setCat("accessory");
                setTab(0);
              }}
            >
              {settings.accessoryLabel || "Accessory"}
              {cat === "accessory" ? <span className="absolute bottom-0 left-[20%] right-[20%] h-[2.5px] rounded" style={{ backgroundColor: c.tabUnderline }} /> : null}
            </button>
            <button
              className="relative rounded-t-[16px] px-4 pb-2 pt-3 text-[0.9rem]"
              style={{ backgroundColor: cat === "furniture" ? c.cardBg : "transparent", color: cat === "furniture" ? c.tabActiveText : c.tabText, fontWeight: cat === "furniture" ? 700 : 500 }}
              onClick={() => {
                setCat("furniture");
                setTab(0);
              }}
            >
              {settings.furnitureLabel || "Furniture"}
              {cat === "furniture" ? <span className="absolute bottom-0 left-[20%] right-[20%] h-[2.5px] rounded" style={{ backgroundColor: c.tabUnderline }} /> : null}
            </button>
          </div>
        </div>
        <div style={{ backgroundColor: c.cardBg }}>
          <div className="flex items-center overflow-x-auto border-b px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-[18px]" style={{ borderBottomColor: c.tabBorder }}>
            {data.map((t: Group, i: number) => (
              <button key={t.tab + i} className="relative shrink-0 whitespace-nowrap px-3.5 pb-3 pt-3.5 text-[0.86rem]" style={{ color: i === tab ? c.title : c.tabText, fontWeight: i === tab ? 700 : 500 }} onClick={() => setTab(i)}>
                {t.tab}
                {i === tab ? <span className="absolute bottom-0 left-1/2 h-[2.5px] w-[70%] -translate-x-1/2 rounded" style={{ backgroundColor: c.tabUnderline }} /> : null}
              </button>
            ))}
            <button className="ml-auto inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border text-sm" style={{ backgroundColor: c.arrowBg, borderColor: c.arrowBorder, color: c.arrowText }} onClick={() => setTab((p) => (p + 1) % Math.max(1, data.length))}>
              {">"}
            </button>
          </div>
          <div className="p-4 pt-4 md:p-4 md:pt-[18px]">
            <div className="grid grid-cols-2 gap-[11px] md:grid-cols-3">
              {active.items.map((item: Item, idx: number) => (
                <div key={item.label + idx} className="rounded-[13px] border px-2 py-3 text-center" style={{ backgroundColor: c.itemCardBg, borderColor: c.itemCardBorder }}>
                  <span className="mb-1 block text-[1.85rem]">{item.icon}</span>
                  <span className="block text-[0.73rem] font-medium" style={{ color: c.itemText }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export function ReelImagePreview({ settings }: { settings: Section["settings"] }) {
  const cardH = settings.cardHeight ?? 400;
  const gap = settings.gap ?? 16;
  const radius = settings.borderRadius ?? 16;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Collect reel items
  const reels: { image: string; text: string }[] = [];
  for (let i = 1; i <= 8; i++) {
    const img = settings[`reel${i}Image`];
    if (img) reels.push({ image: img, text: settings[`reel${i}Text`] || "" });
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    const timer = setTimeout(handleScroll, 500);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [reels.length]);

  const scroll = (direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) return;

    const scrollAmount = direction === "left" ? -container.clientWidth : container.clientWidth;
    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const scrollContainerCss = `
    .qh-reel-scroll-preview::-webkit-scrollbar { display: none; }
    .qh-reel-scroll-preview { -ms-overflow-style: none; scrollbar-width: none; }
    
    .qh-reel-card-preview {
      width: calc(50% - ${gap / 2}px);
      height: ${Math.min(cardH, 340)}px;
    }
    
    @media (min-width: 768px) {
      .qh-reel-card-preview {
        width: calc(25% - ${(gap * 3) / 4}px);
        height: ${cardH}px;
      }
    }
  `;

  const hasItems = reels.length > 0;
  const displayItems = hasItems ? reels : Array.from({ length: 4 }).map((_, i) => ({
    image: "",
    text: `Reel ${i + 1}`,
  }));

  return (
    <div className="relative w-full overflow-hidden py-10 md:py-16">
      {settings.heading && <h2 className="mb-8 text-center font-display text-3xl font-black tracking-tight text-text-main md:text-4xl">{settings.heading}</h2>}
      <style dangerouslySetInnerHTML={{ __html: scrollContainerCss }} />
      
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="relative group/arrows w-full">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform hover:scale-105 hover:bg-gray-50 border border-gray-200"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6 stroke-[2]" />
            </button>
          )}

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform hover:scale-105 hover:bg-gray-50 border border-gray-200"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6 stroke-[2]" />
            </button>
          )}

          <div
            ref={containerRef}
            className="qh-reel-scroll-preview flex overflow-x-auto snap-x snap-mandatory"
            style={{ gap: `${gap}px` }}
          >
            {displayItems.map((reel, i) => {
              return (
                <div
                  key={i}
                  className="qh-reel-card-preview shrink-0 snap-start relative overflow-hidden group/card bg-gray-100 shadow-sm transition-shadow hover:shadow-lg"
                  style={{
                    borderRadius: `${radius}px`,
                  }}
                >
                  {reel.image ? (
                    <img
                      src={reel.image}
                      alt={reel.text || ""}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                      <span className="text-xs font-medium">{reel.text}</span>
                    </div>
                  )}
                  {reel.image && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity duration-300 group-hover/card:opacity-100" />}
                  {reel.text && reel.image && (
                    <div className="absolute inset-x-0 bottom-0 p-4 pb-6 text-center transform transition-transform duration-300 group-hover/card:-translate-y-1">
                      <p className="text-base md:text-lg font-bold text-white drop-shadow-md">{reel.text}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ Multicolumn â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function MulticolumnPreview({ settings }: { settings: Section["settings"] }) {
  const cols = parseInt(settings.columns) || 3;
  const columns = [
    { title: settings.col1Title, text: settings.col1Text, image: settings.col1Image },
    { title: settings.col2Title, text: settings.col2Text, image: settings.col2Image },
    { title: settings.col3Title, text: settings.col3Text, image: settings.col3Image },
    { title: settings.col4Title, text: settings.col4Text, image: settings.col4Image },
  ].slice(0, cols).filter((c) => c.title);

  return (
    <section className="qh-container qh-section-pad">
      {settings.heading && <h2 className="mb-8 text-center font-display text-3xl font-black text-text-main">{settings.heading}</h2>}
      <div className="grid bp-multi-grid" style={{ "--bp-cols": cols } as React.CSSProperties}>
        {columns.map((col, i) => (
          <div key={i} className="qh-card p-6 text-center">
            {col.image ? <img src={col.image} alt="" className="mx-auto mb-4 h-16 w-16 rounded-full object-cover" /> : <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-background-soft" />}
            <h3 className="font-semibold text-text-main">{col.title}</h3>
            <p className="mt-2 text-sm text-text-muted">{col.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* â”€â”€â”€ CollapsibleContent â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function CollapsibleContentPreview({ settings }: { settings: Section["settings"] }) {
  const faqs = [
    { q: settings.q1, a: settings.a1 }, { q: settings.q2, a: settings.a2 },
    { q: settings.q3, a: settings.a3 }, { q: settings.q4, a: settings.a4 },
    { q: settings.q5, a: settings.a5 },
  ].filter((f) => f.q);
  const featuredFaqs = faqs.slice(0, 5);

  return (
    <section className="qh-container qh-section-pad">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="rounded-[28px] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,243,236,0.92))] p-6 shadow-soft lg:sticky lg:top-6">
          <span className="inline-flex items-center rounded-full border border-border bg-background-elevated px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
            Support
          </span>
          <h2 className="mt-4 font-display text-4xl font-black tracking-[-0.03em] text-text-main md:text-5xl">
            {settings.heading || "FAQ's"}
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-7 text-text-muted">
            Keep the most common questions clean, easy to scan, and reassuring for customers right inside the page flow.
          </p>
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-background-elevated px-4 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary/10 text-lg font-black text-brand-primary">
              {featuredFaqs.length}
            </div>
            <div>
              <p className="text-sm font-bold text-text-main">Quick answers ready</p>
              <p className="text-xs text-text-muted">Accordion-style layout with a stronger visual hierarchy.</p>
            </div>
          </div>
        </div>
        <div className="grid gap-3">
          {featuredFaqs.map((faq, i) => (
            <div
              key={i}
              className={`overflow-hidden rounded-[24px] border transition-all ${
                i === 0
                  ? "border-brand-primary/20 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(249,246,240,1))] shadow-soft"
                  : "border-border bg-background-elevated"
              }`}
            >
              <div className="flex items-start gap-4 px-5 py-5">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-text-main text-xs font-black text-text-inverse">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-left text-base font-bold leading-6 text-text-main">{faq.q}</span>
                    <span className="text-lg font-light text-text-muted">{i === 0 ? "-" : "+"}</span>
                  </div>
                  {i === 0 && (
                    <div className="mt-4 border-t border-border/80 pt-4 text-sm leading-7 text-text-muted">
                      {faq.a}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* â”€â”€â”€ Video â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function VideoPreview({ settings }: { settings: Section["settings"] }) {
  return (
    <section className="qh-container qh-section-pad">
      {settings.heading && <h2 className="mb-6 text-center font-display text-3xl font-black text-text-main">{settings.heading}</h2>}
      <div className="relative mx-auto aspect-video max-w-3xl overflow-hidden rounded-xl bg-background-soft">
        {settings.videoUrl ? (
          <iframe src={settings.videoUrl} className="h-full w-full" allowFullScreen title="Video" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-text-soft">â–¶</div>
        )}
      </div>
      {settings.description && <p className="mt-4 text-center text-text-muted">{settings.description}</p>}
    </section>
  );
}

/* â”€â”€â”€ ContactForm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function ContactFormPreview({ settings }: { settings: Section["settings"] }) {
  return (
    <section className="qh-container qh-section-pad">
      <div className="mx-auto max-w-lg">
        <h2 className="mb-2 text-center font-display text-3xl font-black text-text-main">{settings.heading}</h2>
        {settings.subheading && <p className="mb-8 text-center text-text-muted">{settings.subheading}</p>}
        <div className="grid gap-4">
          <input className="rounded-lg border border-border bg-background-elevated px-4 py-3 text-sm" placeholder="Your Name" readOnly />
          <input className="rounded-lg border border-border bg-background-elevated px-4 py-3 text-sm" placeholder="Email Address" readOnly />
          {settings.showPhone && <input className="rounded-lg border border-border bg-background-elevated px-4 py-3 text-sm" placeholder="Phone Number" readOnly />}
          <textarea className="rounded-lg border border-border bg-background-elevated px-4 py-3 text-sm" placeholder="Your Message" rows={4} readOnly />
          <span className="inline-flex items-center justify-center rounded-full bg-brand-primary py-3 font-semibold text-text-inverse">{settings.buttonText || "Send Message"}</span>
        </div>
      </div>
    </section>
  );
}

/* â”€â”€â”€ LogoList â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function LogoListPreview({ settings }: { settings: Section["settings"] }) {
  const logos = [settings.logo1, settings.logo2, settings.logo3, settings.logo4, settings.logo5].filter(Boolean);
  return (
    <section className="qh-container qh-section-pad">
      {settings.heading && <h2 className="mb-6 text-center text-sm font-bold uppercase tracking-wide text-text-muted">{settings.heading}</h2>}
      <div className="flex items-center justify-center gap-8 flex-wrap">
        {logos.length > 0 ? logos.map((logo, i) => (
          <img key={i} src={logo} alt="" className="h-10 object-contain opacity-60 grayscale" />
        )) : [1,2,3,4].map((i) => (
          <div key={i} className="h-10 w-24 rounded bg-background-soft" />
        ))}
      </div>
    </section>
  );
}

/* â”€â”€â”€ FeaturedProduct â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function FeaturedProductPreview({ settings }: { settings: Section["settings"] }) {
  return (
    <section className="qh-container qh-section-pad">
      <h2 className="mb-6 text-center font-display text-3xl font-black text-text-main">{settings.heading}</h2>
      <div className="mx-auto grid max-w-4xl gap-8 bp-featured-product items-center">
        <div className="aspect-square rounded-xl bg-background-soft flex items-center justify-center text-text-soft">Product Image</div>
        <div>
          <h3 className="text-2xl font-black text-text-main">Product Name</h3>
          <p className="mt-2 text-xl font-bold text-brand-primary">Rs. 1,299</p>
          {settings.showDescription && <p className="mt-4 text-text-muted">Product description will appear here based on the selected product.</p>}
          <span className="mt-6 inline-flex rounded-full bg-brand-primary px-8 py-3 font-semibold text-text-inverse">Add to Cart</span>
        </div>
      </div>
    </section>
  );
}

/* â”€â”€â”€ MapSection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function MapSectionPreview({ settings }: { settings: Section["settings"] }) {
  return (
    <section className="qh-container qh-section-pad">
      <h2 className="mb-6 text-center font-display text-3xl font-black text-text-main">{settings.heading}</h2>
      <div className="grid gap-6 bp-map-grid">
        <div className="aspect-video rounded-xl bg-background-soft flex items-center justify-center text-text-soft">
          {settings.mapEmbed ? <iframe src={settings.mapEmbed} className="h-full w-full rounded-xl" title="Map" /> : "ðŸ“ Map Preview"}
        </div>
        <div className="flex items-center">
          <p className="text-text-muted whitespace-pre-line">{settings.address}</p>
        </div>
      </div>
    </section>
  );
}

/* â”€â”€â”€ CustomHTML â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function CustomHTMLPreview({ settings }: { settings: Section["settings"] }) {
  return <div dangerouslySetInnerHTML={{ __html: settings.content || "<div style='padding:2rem;text-align:center;color:#888'>Custom HTML</div>" }} />;
}

export function HeadingPreview({ settings }: { settings: Section["settings"] }) {
  type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  const allowedTags = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
  const Tag = (allowedTags.has(settings.tag) ? settings.tag : "h2") as HeadingTag;
  const align = settings.align === "center" || settings.align === "right" ? settings.align : "left";
  const fontSize = Math.max(22, Math.min(48, Number(settings.fontSize || 22)));
  const color = settings.textColor || "var(--color-text-main)";

  return (
    <section className="qh-container qh-section-pad">
      <Tag style={{ textAlign: align, fontSize: `${fontSize}px`, lineHeight: 1.2, color, fontWeight: 800 }}>
        {settings.text || "Section Heading"}
      </Tag>
    </section>
  );
}

/* â”€â”€â”€ Divider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function DividerPreview({ settings }: { settings: Section["settings"] }) {
  return (
    <div style={{ paddingTop: settings.paddingTop || 32, paddingBottom: settings.paddingBottom || 32 }}>
      {settings.style === "space" ? null : (
        <hr className="qh-container border-0" style={{ height: 1, background: "var(--color-border)", borderStyle: settings.style === "dotted" ? "dotted" : "solid" }} />
      )}
    </div>
  );
}

/* â”€â”€â”€ Component Map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export const sectionComponentMap: Record<string, React.FC<{ settings: Section["settings"] }>> = {
  BannerStrip: BannerStripPreview,
  HeroBanner: HeroBannerPreview,
  Slideshow: SlideshowPreview,
  ImageBanner: ImageBannerPreview,
  SlideBanner: SlideBannerPreview,
  SaleBanner: SaleBannerPreview,
  NewArrival: NewArrivalPreview,
  ImageGrid: ImageGridPreview,
  FiveGrid: FiveGridPreview,
  SearchBand: SearchBandPreview,
  CategoryGrid: CategoryGridPreview,
  CollectionsSection: CollectionsSectionPreview,
  ProductGrid: ProductGridPreview,
  ProductGrid2: ProductGrid2Preview,
  ItemGrid: ItemGridPreview,
  RecentlyViewedProducts: RecentlyViewedProductsPreview,
  FeaturedCollection: FeaturedCollectionPreview,
  FeaturedProduct: FeaturedProductPreview,
  PromisesSection: PromisesSectionPreview,
  Multicolumn: MulticolumnPreview,
  ImageWithText: ImageWithTextPreview,
  Video: VideoPreview,
  RichText: RichTextPreview,
  CollapsibleContent: CollapsibleContentPreview,
  ContactForm: ContactFormPreview,
  Newsletter: NewsletterPreview,
  Testimonials: TestimonialsPreview,
  LogoList: LogoListPreview,
  MapSection: MapSectionPreview,
  SeoArticle: SeoArticlePreview,
  CustomHTML: CustomHTMLPreview,
  Heading: HeadingPreview,
  Divider: DividerPreview,
  ReelImage: ReelImagePreview,
};




