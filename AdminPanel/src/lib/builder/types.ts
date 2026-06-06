/**
 * QuirkyHome Visual Page Builder — Type Definitions (Shopify-complete)
 * 
 * Drives the entire builder with a JSON-first architecture.
 * Every page is a list of typed sections, and global theme
 * settings are injected as CSS variables for instant previews.
 */

/* ─── Theme Settings (Maps directly to CSS custom properties) ── */

export interface ThemeColors {
  primary: string;      // --color-brand-primary
  secondary: string;    // --color-brand-secondary
  accent: string;       // --color-brand-accent
  background: string;   // --color-bg-main
  surface: string;      // --color-bg-soft
  elevated: string;     // --color-bg-elevated
  text: string;         // --color-text-main
  textMuted: string;    // --color-text-muted
  border: string;       // --color-border
}

export interface ThemeTypography {
  fontFamily: string;
  headingFamily: string;
  baseSize: string;
  headingWeight: string;
}

export interface ThemeSpacing {
  sectionPadding: string;
  containerMax: string;
  borderRadius: string;
}

export interface ThemeSettings {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
}

/* ─── Section Types (Shopify-complete set) ──────────────────── */

export type SectionType =
  | "BannerStrip"
  | "HeroBanner"
  | "Slideshow"
  | "SlideBanner"
  | "SaleBanner"
  | "SearchBand"
  | "NewArrival"
  | "CategoryGrid"
  | "CollectionsSection"
  | "ProductGrid"
  | "ProductGrid2"
  | "ItemGrid"
  | "RecentlyViewedProducts"
  | "FeaturedCollection"
  | "FeaturedProduct"
  | "PromisesSection"
  | "Multicolumn"
  | "ImageWithText"
  | "ImageBanner"
  | "ImageGrid"
  | "FiveGrid"
  | "ReelImage"
  | "Video"
  | "RichText"
  | "CollapsibleContent"
  | "ContactForm"
  | "Newsletter"
  | "Testimonials"
  | "LogoList"
  | "MapSection"
  | "SeoArticle"
  | "CustomHTML"
  | "Heading"
  | "Divider"
  | "ReelImage";

/** Single section in a page */
export interface Section {
  id: string;
  type: SectionType;
  settings: Record<string, any>;
  visible: boolean;
}

/* ─── Page Schema ──────────────────────────────────────────── */

export interface PageConfig {
  name: string;
  slug: string;
  sections: Section[];
}

/** Root schema persisted to the DB */
export interface BuilderSchema {
  themeSettings: ThemeSettings;
  pages: Record<string, PageConfig>;
}

/* ─── Section Field Schema (drives dynamic editor forms) ──── */

export type FieldType =
  | "text"
  | "datetime"
  | "textarea"
  | "richtext"
  | "color"
  | "number"
  | "range"
  | "select"
  | "image"
  | "url"
  | "toggle"
  | "product-list"
  | "collection-select"
  | "alignment"
  | "spacing"
  | "media-array";

export interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: { label: string; value: string }[];
  defaultValue?: any;
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
  /** For grouping fields visually in the sidebar */
  group?: string;
}

export interface SectionDefinition {
  type: SectionType;
  label: string;
  icon: string;           // Lucide icon name
  description: string;    // Short description for add-section modal
  category: "hero" | "content" | "product" | "media" | "trust" | "form" | "utility";
  fields: FieldSchema[];
  defaultSettings: Record<string, any>;
}
