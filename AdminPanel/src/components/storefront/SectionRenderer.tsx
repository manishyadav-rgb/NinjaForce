/**
 * Storefront Section Renderer
 * 
 * Maps builder section types to actual storefront React components.
 * Used by the dynamic homepage to render builder-defined layouts.
 * 
 * These are the PRODUCTION versions of the section components.
 * They use real CSS classes (not builder CSS vars) and fetch real data.
 */

import React from "react";
import Link from "next/link";
import type { Section, ThemeSettings } from "@/lib/builder/types";

/* ─── HeroBanner (Vaaree Style) ───────────────────────────────────────────── */

function StorefrontHeroBanner({ settings, theme }: { settings: Record<string, any>; theme: ThemeSettings }) {
  return (
    <section className="bg-background-elevated">
      <div className="qh-container py-4 md:py-8 lg:py-10">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-background-soft shadow-soft">
          <img src={settings.imageUrl || "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=80"} alt="" className="h-[360px] w-full object-cover md:h-[480px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10 md:from-black/55 md:via-black/25 md:to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="w-full max-w-xl p-5 md:p-10">
          {settings.badgeText && (
                <div className="mb-4 w-fit rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#202223]">
                  ✨ {settings.badgeText}
            </div>
          )}
              <h1 className="font-display text-[1.75rem] font-black leading-tight text-white md:text-[2.9rem]">
                {settings.heading}
          </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/90 md:text-base">
                {settings.subheading}
          </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {settings.button1Text && (
                  <Link href={settings.button1Link || "#"} className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#202223] transition-colors hover:bg-white/90 md:h-12 md:px-8 md:text-base">
                {settings.button1Text}
              </Link>
            )}
            {settings.button2Text && (
                  <Link href={settings.button2Link || "#"} className="inline-flex h-11 items-center justify-center rounded-full border border-white/70 bg-transparent px-6 text-sm font-semibold text-white transition-colors hover:border-white md:h-12 md:px-8 md:text-base">
                {settings.button2Text}
              </Link>
            )}
          </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-[11px] font-bold text-white/95 md:text-sm">
                {settings.feature1 && <div className="flex items-center gap-2">🚚 {settings.feature1}</div>}
                {settings.feature2 && <div className="flex items-center gap-2">🛡️ {settings.feature2}</div>}
                {settings.feature3 && <div className="flex items-center gap-2">✨ {settings.feature3}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── SearchBand ───────────────────────────────────────────── */
function StorefrontSearchBand({ settings }: { settings: Record<string, any> }) {
  const chips = (settings.chips || "").split(",").map((c: string) => c.trim()).filter(Boolean);
  return (
    <section className="qh-market-band">
      <div className="qh-container flex flex-wrap items-center gap-3 py-4">
        <span className="text-sm font-black text-text-main">{settings.label}</span>
        {chips.map((chip: string) => (
          <Link key={chip} href={`/search?q=${encodeURIComponent(chip)}`} className="rounded-full border border-text-main/10 bg-background-elevated px-4 py-2 text-sm font-bold text-text-main shadow-soft transition-all duration-base hover:border-brand-primary">
            {chip}
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─── CategoryGrid ───────────────────────────────────────────── */
import { CategoryGrid as ActualCategoryGrid } from "@/components/home/CategoryGrid";
function StorefrontCategoryGrid({ settings }: { settings: Record<string, any> }) {
  // Pass settings to override header? For now just render it.
  return (
    <div>
       <ActualCategoryGrid />
    </div>
  );
}

/* ─── CollectionsSection ───────────────────────────────────────────── */
import { CollectionsSection as ActualCollectionsSection } from "@/components/home/CollectionsSection";
function StorefrontCollectionsSection({ settings }: { settings: Record<string, any> }) {
  return (
    <div>
      <ActualCollectionsSection />
    </div>
  );
}

/* ─── ProductGrid ───────────────────────────────────────────── */
import { ProductGrid as ActualProductGrid } from "@/components/product/ProductGrid";
import { getCatalogProducts } from "@/lib/catalog";
import { SectionHeader } from "@/components/ui/SectionHeader";
// We need this to be async or fetch inside... Wait, SectionRenderer is a server component!
async function StorefrontProductGridWrapper({ settings }: { settings: Record<string, any> }) {
  const products = await getCatalogProducts();
  return (
    <section className="qh-container qh-section-pad">
      <SectionHeader eyebrow={settings.eyebrow} title={settings.heading} description={settings.subheading} />
      {products.length ? (
        <ActualProductGrid products={products} />
      ) : (
        <div className="rounded-lg border border-border bg-background-elevated p-6 text-text-muted">
          No published products yet.
        </div>
      )}
    </section>
  );
}

async function StorefrontProductGrid2({ settings }: { settings: Record<string, any> }) {
  const products = await getCatalogProducts();
  const desktopCols = Math.min(6, Math.max(2, parseInt(settings.desktopColumns || "6", 10)));
  const mobileCols = Math.min(2, Math.max(1, parseInt(settings.mobileColumns || "2", 10)));
  const gap = Math.min(32, Math.max(8, Number(settings.gap || 16)));
  const source = settings.productSource || "manual";
  const selectedIds: string[] = Array.isArray(settings.productIds) ? settings.productIds : [];
  const buttonText = settings.buttonText || "Add To Cart";
  const viewAllText = settings.viewAllText || "View All Products";
  const viewAllLink = settings.viewAllLink || "/products";

  let cards = products;
  if (source === "manual" && selectedIds.length > 0) {
    const manualCards = products.filter((p: any) => selectedIds.includes(String(p.id)));
    cards = manualCards.length > 0 ? manualCards : products;
  } else if (source === "latest") {
    cards = [...products].reverse();
  }
  cards = cards.slice(0, 6);

  const uid = `pg2-${Math.random().toString(36).slice(2, 8)}`;
  const gridCss = `
    .${uid} { display: grid; grid-template-columns: repeat(${mobileCols}, minmax(0, 1fr)); gap: ${Math.min(gap, 12)}px; }
    @media (min-width: 768px) { .${uid} { grid-template-columns: repeat(${desktopCols}, minmax(0, 1fr)); gap: ${gap}px; } }
  `;

  return (
    <section className="qh-container qh-section-pad">
      {(settings.heading || settings.subheading) && (
        <div className="mb-5">
          {settings.heading ? <h2 className="font-display text-xl font-black text-text-main md:text-2xl">{settings.heading}</h2> : null}
          {settings.subheading ? <p className="mt-2 text-text-muted">{settings.subheading}</p> : null}
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: gridCss }} />
      {cards.length ? (
        <div className={uid}>
          {cards.map((p: any, i: number) => (
            <article key={p?.id || i} className="overflow-hidden rounded-xl border border-border bg-background-elevated">
              <div className="aspect-[4/5] bg-background-soft">
                {p?.image_url ? <img src={p.image_url} alt={p.title || ""} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-text-soft">Product</div>}
              </div>
              <div className="space-y-2 p-3">
                <h3 className="line-clamp-2 text-sm font-bold text-text-main">{p?.title || "Sample Product"}</h3>
                <p className="text-sm font-semibold text-text-main">{p?.sale_price ? `Rs. ${p.sale_price}` : p?.mrp ? `Rs. ${p.mrp}` : "Rs. 0"}</p>
                <button type="button" className="w-full rounded-full border border-border bg-background-soft px-3 py-2 text-xs font-semibold text-text-main">
                  {buttonText}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-background-elevated p-6 text-sm text-text-muted">
          No products available for this section.
        </div>
      )}
      <div className="mt-5 text-center">
        <Link href={viewAllLink} className="inline-flex rounded-full border border-border bg-background-elevated px-5 py-2 text-sm font-semibold text-text-main">
          {viewAllText}
        </Link>
      </div>
    </section>
  );
}

/* ─── PromisesSection ───────────────────────────────────────────── */
import { ShieldCheck, Sparkles, Truck, Undo2, WalletCards } from "lucide-react";
function StorefrontPromisesSection({ settings }: { settings: Record<string, any> }) {
  const promises = [
    { icon: Sparkles, title: "Curated decor", text: "Thoughtfully selected pieces with warmth and personality." },
    { icon: ShieldCheck, title: "Premium quality", text: "Affordable luxury without fragile showroom energy." },
    { icon: Undo2, title: "Easy returns", text: "A smoother post-purchase experience for real life." },
    { icon: Truck, title: "Fast shipping", text: "Quick dispatch across India on everyday favourites." },
    { icon: WalletCards, title: "Secure payments", text: "UPI, cards, wallets, and protected checkout flows." },
  ];
  return (
    <section className="qh-container qh-section-pad">
      <SectionHeader align="center" eyebrow={settings.eyebrow} title={settings.heading} />
      <div className="grid gap-4 md:grid-cols-5">
        {promises.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="qh-card p-5 text-center">
              <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-background-soft text-brand-primary"><Icon className="h-6 w-6" /></div>
              <h3 className="font-semibold text-text-main">{item.title}</h3>
              <p className="mt-2 text-sm text-text-muted">{item.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Newsletter ───────────────────────────────────────────── */
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { Button } from "@/components/ui/Button";
import { StorefrontRecentlyViewed } from "@/components/storefront/StorefrontRecentlyViewed";
function StorefrontNewsletterVaaree({ settings }: { settings: Record<string, any> }) {
  return (
    <section className="qh-container qh-section-pad">
      <div className="grid gap-6 rounded-lg bg-background-soft p-6 md:qh-newsletter-grid md:items-center md:p-8">
        <div>
          <SectionHeader eyebrow={settings.eyebrow} title={settings.heading} description={settings.subheading} />
          <ThemeSwitcher />
        </div>
        <form className="grid gap-3 md:min-w-80" onSubmit={(e) => e.preventDefault()}>
          <input className="qh-focus h-button-lg rounded-full border border-border bg-background-elevated px-5 text-text-main placeholder:text-text-soft" placeholder="Enter email for decor notes" />
          <Button type="button" size="lg">{settings.buttonText || "Join Newsletter"}</Button>
        </form>
      </div>
    </section>
  );
}

/* ─── SeoArticle ───────────────────────────────────────────── */
function StorefrontSeoArticle({ settings }: { settings: Record<string, any> }) {
  const allowedTags = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
  const headingTag = allowedTags.has(settings.headingTag) ? settings.headingTag : "h2";
  const subheadingTag = allowedTags.has(settings.subheadingTag) ? settings.subheadingTag : "h2";
  const HeadingTag = headingTag as any;
  const SubheadingTag = subheadingTag as any;

  // Backward compatibility for previously saved raw HTML.
  if (
    typeof settings.content === "string" &&
    settings.content.includes("<") &&
    settings.content.includes(">")
  ) {
    return (
      <section className="qh-container qh-section-pad">
        <article
          className="qh-seo-copy max-w-none rounded-lg border border-border bg-background-elevated p-6 md:p-8"
          dangerouslySetInnerHTML={{ __html: settings.content }}
        />
      </section>
    );
  }

  return (
    <section className="qh-container qh-section-pad">
      <article className="qh-seo-copy max-w-none rounded-lg border border-border bg-background-elevated p-6 md:p-8">
        {settings.headingText ? <HeadingTag>{settings.headingText}</HeadingTag> : null}
        {settings.content ? <p>{settings.content}</p> : null}
        {settings.subheadingText ? <SubheadingTag>{settings.subheadingText}</SubheadingTag> : null}
        {settings.content2 ? <p>{settings.content2}</p> : null}
      </article>
    </section>
  );
}

/* ─── Testimonials ─────────────────────────────────────────── */

function StorefrontTestimonials({ settings, theme }: { settings: Record<string, any>; theme: ThemeSettings }) {
  const testimonials = [
    { name: settings.testimonial1Name, text: settings.testimonial1Text },
    { name: settings.testimonial2Name, text: settings.testimonial2Text },
    { name: settings.testimonial3Name, text: settings.testimonial3Text },
  ].filter((t) => t.name && t.text);

  return (
    <section className="qh-container qh-section-pad">
      <h2 className="mb-8 text-center text-2xl font-bold text-text-main md:text-3xl">{settings.heading}</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <div key={i} className="qh-card p-6">
            <div className="mb-3 text-2xl" style={{ color: theme.colors.primary }}>"</div>
            <p className="text-sm leading-relaxed text-text-muted">{t.text}</p>
            <p className="mt-4 text-sm font-semibold text-text-main">— {t.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── BannerStrip ──────────────────────────────────────────── */

function StorefrontBannerStrip({ settings }: { settings: Record<string, any>; theme: ThemeSettings }) {
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

function StorefrontImageBanner({ settings }: { settings: Record<string, any> }) {
  const desktopImageUrl = settings.desktopImageUrl || settings.imageUrl || "";
  const mobileImageUrl = settings.mobileImageUrl || desktopImageUrl;
  const altText = settings.altText || "Banner image";
  const desktopHeight = Math.max(120, Number(settings.desktopHeight || 280));
  const mobileHeight = Math.max(80, Number(settings.mobileHeight || 180));
  const radius = Math.max(0, Number(settings.borderRadius || 12));
  const fullWidth = settings.fullWidth === true || settings.sectionFullWidth === true;

  const body = (
    <div className="overflow-hidden bg-background-soft" style={{ borderRadius: fullWidth ? 0 : radius }}>
      <div className="md:hidden" style={{ height: `${mobileHeight}px` }}>
        {mobileImageUrl ? <img src={mobileImageUrl} alt={altText} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="hidden md:block" style={{ height: `${desktopHeight}px` }}>
        {desktopImageUrl ? <img src={desktopImageUrl} alt={altText} className="h-full w-full object-cover" /> : null}
      </div>
    </div>
  );

  return (
    <section className={`${fullWidth ? "w-full" : "qh-container"} qh-section-pad`}>
      {settings.link ? <Link href={settings.link}>{body}</Link> : body}
    </section>
  );
}

function StorefrontSlideBanner({ settings }: { settings: Record<string, any> }) {
  const slides = Array.from({ length: 15 }, (_, i) => {
    const n = i + 1;
    const desktopImage = settings[`slide${n}Image`] || "";
    const mobileImage = settings[`slide${n}MobileImage`] || desktopImage;
    const alt = settings[`slide${n}Alt`] || "";
    const link = settings[`slide${n}Link`] || "";
    return { desktopImage, mobileImage, alt, link };
  }).filter((s) => s.desktopImage || s.mobileImage);
  const activeSlides = slides.length ? slides : [{ desktopImage: "", mobileImage: "", alt: "", link: "" }];
  const radius = Math.max(0, Number(settings.radius || 16));
  const desktopHeight = Math.max(120, Number(settings.heightDesktop || 360));
  const mobileHeight = Math.max(80, Number(settings.heightMobile || 220));
  const fullWidth = settings.sectionFullWidth === true;

  return (
    <section className={`${fullWidth ? "w-full" : "qh-container"} qh-section-pad`}>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto">
        {activeSlides.map((s, idx) => {
          const content = (
            <div className="w-full shrink-0 snap-start overflow-hidden bg-background-soft" style={{ borderRadius: fullWidth ? 0 : radius }}>
              <div className="md:hidden" style={{ height: `${mobileHeight}px` }}>
                {s.mobileImage ? <img src={s.mobileImage} alt={s.alt} className="h-full w-full object-cover" /> : null}
              </div>
              <div className="hidden md:block" style={{ height: `${desktopHeight}px` }}>
                {s.desktopImage ? <img src={s.desktopImage} alt={s.alt} className="h-full w-full object-cover" /> : null}
              </div>
            </div>
          );
          return <div key={idx} className="min-w-full">{s.link ? <Link href={s.link}>{content}</Link> : content}</div>;
        })}
      </div>
    </section>
  );
}

function StorefrontItemGrid({ settings }: { settings: Record<string, any> }) {
  const items = Array.from({ length: 6 }, (_, i) => {
    const n = i + 1;
    return {
      image: settings[`item${n}Image`] || "",
      link: settings[`item${n}Link`] || "/",
    };
  });

  return (
    <section className="qh-container qh-section-pad">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
        {items.map((item, i) => (
          <Link key={i} href={item.link} className="overflow-hidden rounded-xl border border-border bg-background-elevated">
            <div className="aspect-square bg-background-soft">
              {item.image ? <img src={item.image} alt={`Item ${i + 1}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-text-soft">Item image</div>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─── Missing Components ────────────────────────────────────────── */

function StorefrontHeading({ settings }: { settings: Record<string, any> }) {
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

function StorefrontRichText({ settings }: { settings: Record<string, any> }) {
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

function StorefrontImageWithText({ settings }: { settings: Record<string, any> }) {
  return (
    <section className="qh-container qh-section-pad grid md:grid-cols-2 gap-6 items-center">
      <img src={settings.imageUrl || "https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80"} alt="" className="rounded-lg object-cover w-full h-full max-h-[400px]" />
      <div>
        <h2 className="text-3xl font-bold mb-4 text-text-main">{settings.heading}</h2>
        <p className="text-text-muted mb-6">{settings.text}</p>
      </div>
    </section>
  );
}

function StorefrontFeaturedCollection({ settings }: { settings: Record<string, any> }) {
  return (
    <section className="qh-container qh-section-pad">
      <h2 className="text-2xl font-bold mb-6 text-center text-text-main">{settings.heading}</h2>
      <div className="text-center text-text-muted">Featured Collection: {settings.collectionId || "None"}</div>
    </section>
  );
}

/* ─── Component Map ────────────────────────────────────────── */

const storefrontComponentMap: Record<string, React.FC<{ settings: Record<string, any>; theme: ThemeSettings }>> = {
  HeroBanner: StorefrontHeroBanner,
  SearchBand: StorefrontSearchBand,
  CategoryGrid: StorefrontCategoryGrid,
  CollectionsSection: StorefrontCollectionsSection,
  ProductGrid: StorefrontProductGridWrapper as unknown as React.FC<any>, // It's async
  ProductGrid2: StorefrontProductGrid2 as unknown as React.FC<any>, // It's async
  PromisesSection: StorefrontPromisesSection,
  Newsletter: StorefrontNewsletterVaaree,
  SeoArticle: StorefrontSeoArticle,
  RichText: StorefrontRichText,
  ImageWithText: StorefrontImageWithText,
  FeaturedCollection: StorefrontFeaturedCollection,
  Testimonials: StorefrontTestimonials,
  BannerStrip: StorefrontBannerStrip,
  ImageBanner: StorefrontImageBanner,
  SlideBanner: StorefrontSlideBanner,
  ItemGrid: StorefrontItemGrid,
  RecentlyViewedProducts: StorefrontRecentlyViewed as unknown as React.FC<any>,
  Heading: StorefrontHeading,
};

/* ─── Public Renderer ──────────────────────────────────────── */

interface RenderSectionProps {
  section: Section;
  theme: ThemeSettings;
}

export function RenderSection({ section, theme }: RenderSectionProps) {
  if (!section.visible) return null;
  const Component = storefrontComponentMap[section.type];
  if (!Component) return null;

  const s = section.settings || {};
  const wrapperStyle: React.CSSProperties = {};
  if (s.sectionPaddingTop !== undefined) wrapperStyle.paddingTop = `${s.sectionPaddingTop}px`;
  if (s.sectionPaddingBottom !== undefined) wrapperStyle.paddingBottom = `${s.sectionPaddingBottom}px`;
  if (s.sectionBgColor) wrapperStyle.backgroundColor = s.sectionBgColor;

  return (
    <div style={wrapperStyle}>
      <Component settings={section.settings} theme={theme} />
    </div>
  );
}

export function RenderSections({ sections, theme }: { sections: Section[]; theme: ThemeSettings }) {
  return (
    <>
      {sections.filter((s) => s.visible && s.type !== "BannerStrip").map((section) => (
        <RenderSection key={section.id} section={section} theme={theme} />
      ))}
    </>
  );
}


