import { notFound } from "next/navigation";
import { getCatalogProductsByCategory } from "@/lib/catalog";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getBuilderSchema } from "@/lib/builder/fetch-schema";
import { RenderSections } from "@/components/storefront/SectionRenderer";
import type { ThemeSettings } from "@/lib/builder/types";

const fallbackTheme: ThemeSettings = {
  colors: {
    primary: "#111111",
    secondary: "#5f3f00",
    accent: "#ffd86f",
    background: "#fffdf7",
    surface: "#fff4cf",
    elevated: "#ffffff",
    text: "#111111",
    textMuted: "#555555",
    border: "#e8e0d0",
  },
  typography: {
    fontFamily: "Arial, Helvetica, sans-serif",
    headingFamily: "Arial, Helvetica, sans-serif",
    baseSize: "1rem",
    headingWeight: "700",
  },
  spacing: {
    sectionPadding: "3rem",
    containerMax: "1200px",
    borderRadius: "0.5rem",
  },
};

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) notFound();

  const schema = await getBuilderSchema("quirkyhome");
  const pageSections = schema?.pages?.[slug]?.sections || [];
  const theme = (schema?.themeSettings as ThemeSettings) || fallbackTheme;
  const products = await getCatalogProductsByCategory(slug);

  return (
    <>
      {pageSections.length ? <RenderSections sections={pageSections as any} theme={theme} /> : null}
      <section className="qh-container qh-section-pad">
        {products.length ? (
          <ProductGrid products={products} />
        ) : (
          <div className="rounded-lg border border-border bg-background-elevated p-6 text-text-muted">
            No products found in this category yet.
          </div>
        )}
      </section>
    </>
  );
}
