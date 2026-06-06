"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { Loader2, Layers, Calendar, Filter, ChevronDown, Copy, Trash2, Plus, Save } from "lucide-react";

type BuilderSchema = {
  themeSettings?: Record<string, any>;
  pages?: Record<string, any>;
};

function lines(input: string) {
  return String(input || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

const puckConfig: any = {
  components: {
    AnnouncementBar: {
      label: "Announcement Bar",
      fields: {
        text: { type: "text" },
        bgColor: { type: "text" },
        textColor: { type: "text" },
      },
      defaultProps: {
        text: "Free shipping on orders above Rs. 999",
        bgColor: "#8a6636",
        textColor: "#ffffff",
      },
      render: ({ text, bgColor, textColor }: any) => (
        <div style={{ background: bgColor || "#8a6636", color: textColor || "#fff", padding: "10px 16px", textAlign: "center", fontWeight: 700 }}>
          {text}
        </div>
      ),
    },
    HeadingBlock: {
      label: "Heading",
      fields: {
        title: { type: "text" },
        subtitle: { type: "textarea" },
        align: {
          type: "select",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
        },
      },
      defaultProps: {
        title: "Your heading",
        subtitle: "Write a short supporting line",
        align: "left",
      },
      render: ({ title, subtitle, align }: any) => (
        <section style={{ textAlign: align || "left", padding: "28px 20px" }}>
          <h2 style={{ fontSize: "clamp(24px,4vw,38px)", lineHeight: 1.15, fontWeight: 800 }}>{title}</h2>
          {subtitle ? <p style={{ marginTop: 10, color: "#666", fontSize: "16px" }}>{subtitle}</p> : null}
        </section>
      ),
    },
    HeroSection: {
      label: "Hero Section",
      fields: {
        title: { type: "text" },
        subtitle: { type: "textarea" },
        buttonText: { type: "text" },
        buttonLink: { type: "text" },
        imageUrl: { type: "text" },
      },
      defaultProps: {
        title: "Give your home a quirky refresh",
        subtitle: "Premium home decor, bedding and essentials curated for modern Indian homes.",
        buttonText: "Shop Collection",
        buttonLink: "/search",
        imageUrl: "",
      },
      render: ({ title, subtitle, buttonText, buttonLink, imageUrl }: any) => (
        <section style={{ padding: "28px 20px" }}>
          <div style={{ borderRadius: 22, overflow: "hidden", background: "#f4efe7", display: "grid", gap: 18, padding: 22 }}>
            {imageUrl ? <img src={imageUrl} alt="" style={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 16 }} /> : null}
            <div>
              <h2 style={{ fontSize: "clamp(24px,4vw,40px)", lineHeight: 1.1, fontWeight: 800 }}>{title}</h2>
              <p style={{ marginTop: 10, color: "#5f5a53", fontSize: 16 }}>{subtitle}</p>
              {buttonText ? (
                <a href={buttonLink || "#"} style={{ marginTop: 14, display: "inline-flex", padding: "10px 18px", borderRadius: 999, background: "#8a6636", color: "#fff", textDecoration: "none", fontWeight: 700 }}>
                  {buttonText}
                </a>
              ) : null}
            </div>
          </div>
        </section>
      ),
    },
    RichTextBlock: {
      label: "Rich Text",
      fields: { content: { type: "textarea" } },
      defaultProps: { content: "Add your content here." },
      render: ({ content }: any) => (
        <section style={{ padding: "16px 20px", color: "#333", lineHeight: 1.7, fontSize: 15 }}>{content}</section>
      ),
    },
    CategoryGrid: {
      label: "Category Grid",
      fields: {
        heading: { type: "text" },
        items: { type: "textarea" },
      },
      defaultProps: {
        heading: "Shop by category",
        items: "Bedding\nFurnishing\nBath\nOrganiser\nGifts\nComforters",
      },
      render: ({ heading, items }: any) => (
        <section style={{ padding: "22px 20px" }}>
          <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 14 }}>{heading}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10 }}>
            {lines(items).map((item) => (
              <div key={item} style={{ border: "1px solid #e8e2d8", borderRadius: 14, padding: "14px 12px", background: "#fff" }}>
                <p style={{ fontWeight: 700 }}>{item}</p>
              </div>
            ))}
          </div>
        </section>
      ),
    },
    ProductGrid: {
      label: "Product Grid",
      fields: {
        heading: { type: "text" },
        cardTitles: { type: "textarea" },
      },
      defaultProps: {
        heading: "Best selling products",
        cardTitles: "Elegant Paisley Bedsheet\nClassic Stripe Set\nPremium Comforter\nSoft Pillow Covers",
      },
      render: ({ heading, cardTitles }: any) => (
        <section style={{ padding: "22px 20px" }}>
          <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 14 }}>{heading}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            {lines(cardTitles).map((item, i) => (
              <div key={`${item}-${i}`} style={{ border: "1px solid #e8e2d8", borderRadius: 16, overflow: "hidden", background: "#fff" }}>
                <div style={{ height: 130, background: "#f5f3ef" }} />
                <div style={{ padding: 12 }}>
                  <p style={{ fontSize: 14, fontWeight: 700 }}>{item}</p>
                  <p style={{ marginTop: 6, fontSize: 12, color: "#666" }}>Product card preview</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ),
    },
    ImageBanner: {
      label: "Image Banner",
      fields: { imageUrl: { type: "text" }, alt: { type: "text" }, height: { type: "number" } },
      defaultProps: { imageUrl: "", alt: "Banner image", height: 360 },
      render: ({ imageUrl, alt, height }: any) => (
        <section style={{ padding: "12px 20px" }}>
          <div style={{ borderRadius: 20, overflow: "hidden", background: "#f2f2f2", minHeight: 180, height: Number(height) || 360 }}>
            {imageUrl ? (
              <img src={imageUrl} alt={alt || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#888", fontWeight: 600 }}>Add image URL</div>
            )}
          </div>
        </section>
      ),
    },
    Testimonials: {
      label: "Testimonials",
      fields: {
        heading: { type: "text" },
        quotes: { type: "textarea" },
      },
      defaultProps: {
        heading: "What customers say",
        quotes: "Best quality and fast delivery\nLooks exactly like photos\nValue for money",
      },
      render: ({ heading, quotes }: any) => (
        <section style={{ padding: "22px 20px" }}>
          <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>{heading}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            {lines(quotes).map((q, i) => (
              <div key={`${q}-${i}`} style={{ border: "1px solid #e8e2d8", borderRadius: 14, padding: 14, background: "#fff" }}>
                <p style={{ fontSize: 14, color: "#4b4742" }}>"{q}"</p>
              </div>
            ))}
          </div>
        </section>
      ),
    },
    FAQSection: {
      label: "FAQ",
      fields: {
        heading: { type: "text" },
        questions: { type: "textarea" },
      },
      defaultProps: {
        heading: "Frequently asked questions",
        questions: "How long is delivery?\nCan I return product?\nDo you offer COD?",
      },
      render: ({ heading, questions }: any) => (
        <section style={{ padding: "22px 20px" }}>
          <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>{heading}</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {lines(questions).map((q, i) => (
              <details key={`${q}-${i}`} style={{ border: "1px solid #e8e2d8", borderRadius: 12, padding: "10px 12px", background: "#fff" }}>
                <summary style={{ cursor: "pointer", fontWeight: 700 }}>{q}</summary>
                <p style={{ marginTop: 8, color: "#666" }}>Answer content can be added from full data mapping phase.</p>
              </details>
            ))}
          </div>
        </section>
      ),
    },
    PromoStrip: {
      label: "Promo Strip",
      fields: {
        title: { type: "text" },
        subtitle: { type: "text" },
        ctaText: { type: "text" },
        ctaHref: { type: "text" },
      },
      defaultProps: {
        title: "Festive Sale Live",
        subtitle: "Up to 70% OFF on selected home essentials",
        ctaText: "Explore Deals",
        ctaHref: "/search",
      },
      render: ({ title, subtitle, ctaText, ctaHref }: any) => (
        <section style={{ padding: "20px" }}>
          <div style={{ borderRadius: 18, padding: "18px 16px", background: "linear-gradient(135deg,#8a6636,#6e4f2b)", color: "#fff" }}>
            <p style={{ fontSize: 12, opacity: 0.9, letterSpacing: 0.4 }}>LIMITED OFFER</p>
            <h3 style={{ marginTop: 6, fontSize: 24, fontWeight: 800 }}>{title}</h3>
            <p style={{ marginTop: 8, opacity: 0.95 }}>{subtitle}</p>
            <a href={ctaHref || "#"} style={{ marginTop: 14, display: "inline-flex", background: "#fff", color: "#6e4f2b", borderRadius: 999, padding: "9px 16px", textDecoration: "none", fontWeight: 700 }}>
              {ctaText}
            </a>
          </div>
        </section>
      ),
    },
    TrustBadges: {
      label: "Trust Badges",
      fields: {
        heading: { type: "text" },
        badges: { type: "textarea" },
      },
      defaultProps: {
        heading: "Why customers trust us",
        badges: "Fast shipping\nEasy returns\nSecure checkout\nPremium quality",
      },
      render: ({ heading, badges }: any) => (
        <section style={{ padding: "20px" }}>
          <h3 style={{ fontSize: 24, fontWeight: 800 }}>{heading}</h3>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10 }}>
            {lines(badges).map((item, i) => (
              <div key={`${item}-${i}`} style={{ border: "1px solid #e8e2d8", borderRadius: 12, padding: "12px", background: "#fff", fontWeight: 600 }}>
                {item}
              </div>
            ))}
          </div>
        </section>
      ),
    },
    LogoStrip: {
      label: "Logo Strip",
      fields: {
        heading: { type: "text" },
        logos: { type: "textarea" },
      },
      defaultProps: {
        heading: "Trusted by",
        logos: "https://dummyimage.com/150x60/eee/777&text=Logo+1\nhttps://dummyimage.com/150x60/eee/777&text=Logo+2\nhttps://dummyimage.com/150x60/eee/777&text=Logo+3\nhttps://dummyimage.com/150x60/eee/777&text=Logo+4",
      },
      render: ({ heading, logos }: any) => (
        <section style={{ padding: "20px" }}>
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>{heading}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10 }}>
            {lines(logos).map((logo, i) => (
              <div key={`${logo}-${i}`} style={{ border: "1px solid #e8e2d8", borderRadius: 10, background: "#fff", minHeight: 64, display: "grid", placeItems: "center", padding: 8 }}>
                <img src={logo} alt={`logo-${i + 1}`} style={{ maxHeight: 40, width: "100%", objectFit: "contain" }} />
              </div>
            ))}
          </div>
        </section>
      ),
    },
    NewsletterBlock: {
      label: "Newsletter",
      fields: {
        heading: { type: "text" },
        subheading: { type: "textarea" },
        buttonText: { type: "text" },
      },
      defaultProps: {
        heading: "Join our newsletter",
        subheading: "Get updates about new drops and deals.",
        buttonText: "Subscribe",
      },
      render: ({ heading, subheading, buttonText }: any) => (
        <section style={{ padding: "20px" }}>
          <div style={{ border: "1px solid #e8e2d8", borderRadius: 16, padding: 16, background: "#fffdf9" }}>
            <h3 style={{ fontSize: 24, fontWeight: 800 }}>{heading}</h3>
            <p style={{ marginTop: 8, color: "#5f5a53" }}>{subheading}</p>
            <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input type="email" placeholder="Enter your email" style={{ flex: "1 1 220px", minWidth: 160, border: "1px solid #d8d2c9", borderRadius: 10, padding: "10px 12px" }} />
              <button style={{ borderRadius: 10, border: "none", background: "#8a6636", color: "#fff", padding: "10px 14px", fontWeight: 700 }}>{buttonText}</button>
            </div>
          </div>
        </section>
      ),
    },
    ContactBlock: {
      label: "Contact Form",
      fields: {
        heading: { type: "text" },
        subheading: { type: "text" },
      },
      defaultProps: {
        heading: "Get in touch",
        subheading: "Have a question? Send us a message.",
      },
      render: ({ heading, subheading }: any) => (
        <section style={{ padding: "20px" }}>
          <div style={{ border: "1px solid #e8e2d8", borderRadius: 16, padding: 16, background: "#fff" }}>
            <h3 style={{ fontSize: 24, fontWeight: 800 }}>{heading}</h3>
            <p style={{ marginTop: 8, color: "#5f5a53" }}>{subheading}</p>
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              <input placeholder="Your name" style={{ border: "1px solid #d8d2c9", borderRadius: 10, padding: "10px 12px" }} />
              <input placeholder="Your email" style={{ border: "1px solid #d8d2c9", borderRadius: 10, padding: "10px 12px" }} />
              <textarea placeholder="Message" rows={4} style={{ border: "1px solid #d8d2c9", borderRadius: 10, padding: "10px 12px", resize: "vertical" }} />
            </div>
          </div>
        </section>
      ),
    },
    VideoEmbed: {
      label: "Video",
      fields: {
        heading: { type: "text" },
        videoUrl: { type: "text" },
      },
      defaultProps: {
        heading: "Watch our story",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
      render: ({ heading, videoUrl }: any) => (
        <section style={{ padding: "20px" }}>
          <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>{heading}</h3>
          <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #e8e2d8", background: "#000" }}>
            <iframe title="video" src={videoUrl} style={{ width: "100%", height: 360, border: "none" }} allowFullScreen />
          </div>
        </section>
      ),
    },
    ReelCards: {
      label: "Reel Cards",
      fields: {
        heading: { type: "text" },
        images: { type: "textarea" },
      },
      defaultProps: {
        heading: "Inspiration reels",
        images: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80\nhttps://images.unsplash.com/photo-1617104551722-3b2d51366474?auto=format&fit=crop&w=600&q=80\nhttps://images.unsplash.com/photo-1616627459494-d5f2f02f846b?auto=format&fit=crop&w=600&q=80",
      },
      render: ({ heading, images }: any) => (
        <section style={{ padding: "20px" }}>
          <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>{heading}</h3>
          <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(170px,220px)", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
            {lines(images).map((img, i) => (
              <div key={`${img}-${i}`} style={{ borderRadius: 14, overflow: "hidden", background: "#f5f3ef", height: 280 }}>
                <img src={img} alt={`reel-${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </section>
      ),
    },
    CTAButton: {
      label: "CTA Button",
      fields: {
        text: { type: "text" },
        href: { type: "text" },
        align: {
          type: "select",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
        },
      },
      defaultProps: { text: "Shop now", href: "/search", align: "left" },
      render: ({ text, href, align }: any) => (
        <section style={{ textAlign: align || "left", padding: "16px 20px 28px" }}>
          <a
            href={href || "#"}
            style={{ display: "inline-flex", padding: "11px 20px", borderRadius: 999, background: "#8a6636", color: "#fff", fontWeight: 700, textDecoration: "none" }}
          >
            {text || "Shop now"}
          </a>
        </section>
      ),
    },
    Divider: {
      label: "Divider",
      fields: { height: { type: "number" } },
      defaultProps: { height: 32 },
      render: ({ height }: any) => <div style={{ height: Number(height) || 32 }} />,
    },
    CustomHTML: {
      label: "Custom HTML",
      fields: { html: { type: "textarea" } },
      defaultProps: { html: "<div style='padding:16px'>Custom HTML block</div>" },
      render: ({ html }: any) => <div dangerouslySetInnerHTML={{ __html: html || "" }} />,
    },
    BlogPost: {
      label: "Post",
      fields: {
        title: { type: "text" },
        headingTag: {
          type: "select",
          options: [
            { label: "H1", value: "h1" },
            { label: "H2", value: "h2" },
            { label: "H3", value: "h3" },
            { label: "H4", value: "h4" },
          ],
        },
        headingSize: { type: "number" },
        excerpt: { type: "textarea" },
        excerptSize: { type: "number" },
        coverImage: { type: "text" },
        imageAlt: { type: "text" },
        contentHtml: { type: "textarea" },
        contentSize: { type: "number" },
        contentLineHeight: { type: "number" },
      },
      defaultProps: {
        title: "Post Title",
        headingTag: "h1",
        headingSize: 42,
        excerpt: "Short description of your post.",
        excerptSize: 16,
        coverImage: "",
        imageAlt: "",
        contentHtml:
          "<p>Start writing your post content...</p><p>You can add links like <a href='https://example.com'>this</a> and images with HTML.</p>",
        contentSize: 16,
        contentLineHeight: 1.8,
      },
      render: ({ title, headingTag, headingSize, excerpt, excerptSize, coverImage, imageAlt, contentHtml, contentSize, contentLineHeight }: any) => {
        const HeadingTag = (["h1", "h2", "h3", "h4"].includes(String(headingTag)) ? String(headingTag) : "h1") as "h1" | "h2" | "h3" | "h4";
        return (
        <article style={{ padding: "24px 20px", maxWidth: 860, margin: "0 auto" }}>
          <HeadingTag style={{ fontSize: `clamp(28px,4vw,${Number(headingSize) || 42}px)`, lineHeight: 1.1, fontWeight: 900 }}>{title}</HeadingTag>
          {excerpt ? <p style={{ marginTop: 10, color: "#5f5a53", fontSize: Number(excerptSize) || 16 }}>{excerpt}</p> : null}
          {coverImage ? (
            <img src={coverImage} alt={imageAlt || title || ""} style={{ width: "100%", marginTop: 16, borderRadius: 16, objectFit: "cover", maxHeight: 480 }} />
          ) : null}
          <div style={{ marginTop: 16, color: "#2f2c29", lineHeight: Number(contentLineHeight) || 1.8, fontSize: Number(contentSize) || 16 }} dangerouslySetInnerHTML={{ __html: contentHtml || "" }} />
        </article>
      )},
    },
  },
};

export function PuckBuilderPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [schema, setSchema] = useState<BuilderSchema | null>(null);
  const [puckData, setPuckData] = useState<any>({ content: [] });
  const [activePageId, setActivePageId] = useState("home");
  const [newPageName, setNewPageName] = useState("");
  const [newPageType, setNewPageType] = useState<"page" | "post">("page");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [showPageManager, setShowPageManager] = useState(false);

  async function buildPostPuckDataFromDb(slug: string, fallbackTitle?: string) {
    const res = await fetch("/api/admin/content", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const posts = Array.isArray(data?.posts) ? data.posts : [];
    const match = posts.find((p: any) => String(p?.slug || "") === slug);
    if (!match) return null;
    return {
      content: [
        {
          type: "BlogPost",
          props: {
            title: String(match.title || fallbackTitle || slug),
            excerpt: String(match.excerpt || ""),
            coverImage: String(match.cover_image || ""),
            imageAlt: String(match.image_alt || ""),
            contentHtml: String(match.content_html || "<p></p>"),
          },
        },
      ],
      root: { props: { title: String(match.title || fallbackTitle || slug) } },
    };
  }

  useEffect(() => {
    fetch("/api/admin/builder?site_id=quirkyhome", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const nextSchema = data?.schema || null;
        setSchema(nextSchema);
        const defaultPage = nextSchema?.pages?.home ? "home" : Object.keys(nextSchema?.pages || {})[0] || "home";
        setActivePageId(defaultPage);
        const savedPuck = nextSchema?.pages?.[defaultPage]?.puckData;
        setPuckData(savedPuck && typeof savedPuck === "object" ? savedPuck : { content: [] });
      })
      .finally(() => setLoading(false));
  }, []);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedPage = params.get("page");
    if (!requestedPage || !schema) return;
    if (schema?.pages?.[requestedPage]) {
      const page = schema.pages?.[requestedPage];
      const existingData = page?.puckData;
      const hasContent = Array.isArray(existingData?.content) && existingData.content.length > 0;
      if (!hasContent && String(page?.pageType || "") === "post") {
        void (async () => {
          const hydrated = await buildPostPuckDataFromDb(requestedPage, page?.name || requestedPage);
          if (!hydrated) {
            void switchPage(requestedPage);
            return;
          }
          const nextSchema = {
            ...schema,
            pages: {
              ...(schema.pages || {}),
              [requestedPage]: {
                ...page,
                puckData: hydrated,
              },
            },
          };
          setSchema(nextSchema);
          setActivePageId(requestedPage);
          setPuckData(hydrated);
          setDirty(true);
        })();
        return;
      }
      void switchPage(requestedPage);
      return;
    }
    const createType = params.get("create");
    if (createType === "post") {
      const nameFromQuery = params.get("title") || requestedPage.replace(/-/g, " ");
      const defaultPuckData = {
        content: [
          {
            type: "BlogPost",
            props: {
              title: nameFromQuery,
              excerpt: "Add short summary",
              coverImage: "",
              imageAlt: "",
              contentHtml: "<p>Write your post here.</p>",
            },
          },
        ],
        root: { props: { title: nameFromQuery } },
      };
      const nextSchema = {
        ...schema,
        pages: {
          ...(schema.pages || {}),
          [requestedPage]: {
            name: nameFromQuery,
            slug: requestedPage,
            sections: [],
            puckData: defaultPuckData,
            lastPublishedBuilder: "advanced",
            pageType: "post",
          },
        },
      };
      setSchema(nextSchema);
      setActivePageId(requestedPage);
      setPuckData(defaultPuckData);
      setDirty(true);
      void persistSchema(nextSchema);
    }
  }, [schema]);

  const pageEntries = useMemo(() => Object.entries(schema?.pages || {}), [schema?.pages]);

  const header = useMemo(() => {
    if (!schema) return "Advanced Editor";
    return `Advanced Editor - ${schema.pages?.[activePageId]?.name || "Home"}`;
  }, [schema, activePageId]);

  async function switchPage(nextPageId: string) {
    if (!schema) return;
    const page = schema.pages?.[nextPageId];
    const existingData = page?.puckData;
    const hasContent = Array.isArray(existingData?.content) && existingData.content.length > 0;
    if (!hasContent && String(page?.pageType || "") === "post") {
      const hydrated = await buildPostPuckDataFromDb(nextPageId, page?.name || nextPageId);
      if (hydrated) {
        const nextSchema = {
          ...schema,
          pages: {
            ...(schema.pages || {}),
            [nextPageId]: {
              ...page,
              puckData: hydrated,
            },
          },
        };
        setSchema(nextSchema);
        setActivePageId(nextPageId);
        setPuckData(hydrated);
        setDirty(true);
        await persistSchema(nextSchema);
        return;
      }
    }
    setActivePageId(nextPageId);
    const nextPuck = page?.puckData;
    setPuckData(nextPuck && typeof nextPuck === "object" ? nextPuck : { content: [] });
    setDirty(false);
  }

  function patchActivePageData(data: any) {
    setPuckData(data);
    setDirty(true);
    setSchema((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: {
          ...prev.pages,
          [activePageId]: {
            ...(prev.pages?.[activePageId] || { name: activePageId, slug: activePageId, sections: [] }),
            puckData: data,
          },
        },
      };
    });
  }

  function toSlug(name: string) {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleAddPage() {
    if (!schema) return;
    const cleanName = newPageName.trim();
    if (!cleanName) return;
    const slug = toSlug(cleanName);
    if (!slug) return;
    if (schema.pages?.[slug]) {
      alert("Page already exists. Try another name.");
      return;
    }
    setSaving(true);
    const defaultPuckData =
      newPageType === "post"
        ? {
            content: [
              {
                type: "BlogPost",
                props: {
                  title: cleanName,
                  excerpt: "Add short summary",
                  coverImage: "",
                  imageAlt: "",
                  contentHtml: "<p>Write your post here.</p>",
                },
              },
            ],
            root: { props: { title: cleanName } },
          }
        : {
            content: [
              { type: "HeadingBlock", props: { title: cleanName, subtitle: "Start writing your page content here.", align: "left" } },
              { type: "RichTextBlock", props: { content: "This page is ready. Add headings, images, CTA, FAQ and more blocks from the left panel." } },
            ],
            root: { props: { title: cleanName } },
          };
    const nextSchema = {
      ...schema,
      pages: {
        ...(schema.pages || {}),
        [slug]: {
          name: cleanName,
          slug,
          sections: [],
          puckData: defaultPuckData,
          lastPublishedBuilder: "advanced",
          pageType: newPageType,
        },
      },
    };
    const ok = await persistSchema(nextSchema);
    if (ok) {
      setSchema(nextSchema);
      setActivePageId(slug);
      setPuckData(defaultPuckData);
      setNewPageName("");
      setNewPageType("page");
    }
    setSaving(false);
  }

  async function persistSchema(nextSchema: any) {
    const res = await fetch("/api/admin/builder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schema: nextSchema, site_id: "quirkyhome" }),
    });
    if (res.ok) {
      setSchema(nextSchema);
      setLastSavedAt(new Date().toISOString());
      setDirty(false);
    }
    return res.ok;
  }

  async function handlePublish(data: any) {
    if (!schema) return;
    setSaving(true);
    let nextPage: any = {
      ...(schema.pages?.[activePageId] || { name: "Page", slug: activePageId, sections: [] }),
      puckData: data,
      lastPublishedBuilder: "advanced",
      lastPublishedAt: new Date().toISOString(),
    };

    const blogBlock = Array.isArray(data?.content) ? data.content.find((b: any) => b?.type === "BlogPost") : null;
    if ((nextPage.pageType || "page") === "post" || blogBlock) {
      const props = blogBlock?.props || {};
      const payload = {
        id: nextPage.blogPostId || undefined,
        title: String(props.title || nextPage.name || activePageId),
        slug: String(nextPage.slug || activePageId),
        excerpt: String(props.excerpt || ""),
        coverImage: String(props.coverImage || ""),
        imageAlt: String(props.imageAlt || ""),
        contentHtml: String(props.contentHtml || "<p></p>"),
        published: true,
      };
      const blogRes = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (blogRes.ok) {
        const blogSaved = await blogRes.json();
        nextPage = {
          ...nextPage,
          blogPostId: blogSaved?.id || nextPage.blogPostId,
          pageType: "post",
        };
      }
    }

    const nextSchema = {
      ...schema,
      pages: {
        ...schema.pages,
        [activePageId]: nextPage,
      },
    };
    const ok = await persistSchema(nextSchema);
    if (ok) {
      setSchema(nextSchema);
      setPuckData(data);
    }
    setSaving(false);
  }

  async function handleSaveDraftNow() {
    if (!schema) return;
    setSaving(true);
    await persistSchema(schema);
    setSaving(false);
  }

  async function handleDuplicatePage() {
    if (!schema || !schema.pages?.[activePageId]) return;
    const base = schema.pages[activePageId];
    const baseSlug = toSlug(`${base.slug || activePageId}-copy`);
    let slug = baseSlug;
    let i = 2;
    while (schema.pages?.[slug]) {
      slug = `${baseSlug}-${i}`;
      i += 1;
    }
    const nextSchema = {
      ...schema,
      pages: {
        ...schema.pages,
        [slug]: {
          ...structuredClone(base),
          slug,
          name: `${base.name || activePageId} Copy`,
          lastPublishedAt: undefined,
        },
      },
    };
    const ok = await persistSchema(nextSchema);
    if (ok) void switchPage(slug);
  }

  async function handleDeletePage() {
    if (!schema || activePageId === "home") return;
    if (!confirm("Delete this page?")) return;
    const nextPages = { ...(schema.pages || {}) };
    delete nextPages[activePageId];
    const nextSchema = { ...schema, pages: nextPages };
    const nextId = nextPages.home ? "home" : Object.keys(nextPages)[0] || "home";
    const ok = await persistSchema(nextSchema);
    if (ok) void switchPage(nextId);
  }

  function applyStarter(name: "landing" | "post" | "brand") {
    const templates: Record<string, any> = {
      landing: {
        content: [
          { type: "HeroSection", props: { title: "Premium Home Collection", subtitle: "Curated comfort for modern homes", buttonText: "Shop Now", buttonLink: "/search", imageUrl: "" } },
          { type: "CategoryGrid", props: { heading: "Shop by category", items: "Bedding\nFurnishing\nBath\nOrganiser\nGifts\nComforters" } },
          { type: "TrustBadges", props: { heading: "Why choose us", badges: "Fast shipping\nEasy returns\nSecure checkout\nPremium quality" } },
        ],
      },
      post: {
        content: [
          { type: "BlogPost", props: { title: schema?.pages?.[activePageId]?.name || "Post Title", excerpt: "Write a short summary", coverImage: "", imageAlt: "", contentHtml: "<p>Write your post content here.</p>" } },
        ],
      },
      brand: {
        content: [
          { type: "HeadingBlock", props: { title: "Our Story", subtitle: "Built for homes that feel personal.", align: "left" } },
          { type: "RichTextBlock", props: { content: "Add your brand narrative, craftsmanship details, and value proposition." } },
          { type: "LogoStrip", props: { heading: "Trusted by", logos: "https://dummyimage.com/150x60/eee/777&text=Logo+1\nhttps://dummyimage.com/150x60/eee/777&text=Logo+2\nhttps://dummyimage.com/150x60/eee/777&text=Logo+3" } },
        ],
      },
    };
    patchActivePageData(templates[name]);
  }

  useEffect(() => {
    if (!schema || !dirty) return;
    const t = setTimeout(async () => {
      setAutoSaving(true);
      await persistSchema(schema);
      setAutoSaving(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [schema, dirty]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background-soft">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-primary" />
          <p className="mt-3 text-xs font-extrabold uppercase tracking-wider text-text-soft">Loading Visual Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background-muted">
      {/* CSS Theme overrides for Puck Editor */}
      <style>{`
        .puck {
          --puck-color-black: var(--color-brand-ink) !important;
          --puck-color-white: var(--color-bg-elevated) !important;
          --puck-color-primary: var(--color-brand-primary) !important;
          --puck-color-primary-dark: var(--color-brand-secondary) !important;
          --puck-color-grey-1: var(--color-text-main) !important;
          --puck-color-grey-2: var(--color-text-muted) !important;
          --puck-color-grey-3: var(--color-border) !important;
          --puck-color-grey-4: var(--color-bg-soft) !important;
          --puck-color-grey-5: var(--color-bg-muted) !important;
          --puck-color-grey-6: var(--color-bg-soft) !important;
          --puck-color-grey-7: var(--color-bg-soft) !important;
          --puck-color-grey-8: var(--color-bg-soft) !important;
          --puck-color-grey-9: var(--color-bg-soft) !important;
          --puck-color-grey-10: var(--color-bg-soft) !important;
          --puck-color-grey-11: var(--color-bg-soft) !important;
          --puck-color-grey-12: var(--color-bg-soft) !important;
        }
        .puck [class*="Sidebar"], .puck [class*="Components"] {
          background-color: var(--color-bg-elevated) !important;
          border-color: var(--color-border) !important;
        }
        .puck__header {
          display: none !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 99px;
        }
      `}</style>

      {/* Premium Figma-style Builder Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-background-elevated px-4 py-0 shadow-sm relative z-20 h-14 shrink-0">
        
        {/* Left Section: Page selector and popover trigger */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            <button
              onClick={() => setShowPageManager(!showPageManager)}
              className="flex items-center gap-2 rounded-full border border-border bg-background-soft px-4 py-1.5 text-xs font-black text-text-main cursor-pointer hover:bg-background-muted transition-all duration-200 active:scale-95 h-9"
            >
              <Layers className="h-4 w-4 text-brand-primary" />
              <span className="truncate max-w-[120px] md:max-w-[180px]">
                {schema?.pages?.[activePageId]?.name || activePageId}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shrink-0">
                {schema?.pages?.[activePageId]?.pageType === "post" ? "Post" : "Page"}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-text-soft transition-transform duration-200 shrink-0 ${showPageManager ? 'rotate-180' : ''}`} />
            </button>

            {/* Page Manager Popover Dropdown */}
            {showPageManager && (
              <>
                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowPageManager(false)} />
                <div className="absolute left-0 top-full mt-2 w-80 rounded-2xl border border-border bg-background-elevated/95 backdrop-blur-md shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-3 duration-200">
                  
                  {/* Active Page Quick Actions */}
                  <div className="mb-4">
                    <div className="text-[10px] font-black text-text-soft uppercase tracking-wider mb-2">Active Page Actions</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setShowPageManager(false);
                          void handleDuplicatePage();
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background-soft hover:bg-background-muted text-xs font-bold text-text-main hover:text-brand-primary transition-all duration-150 active:scale-95"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Duplicate
                      </button>
                      <button
                        onClick={() => {
                          setShowPageManager(false);
                          void handleDeletePage();
                        }}
                        disabled={activePageId === "home"}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500 hover:text-white text-xs font-bold text-rose-600 disabled:opacity-40 disabled:hover:bg-rose-500/5 disabled:hover:text-rose-600 transition-all duration-150 active:scale-95"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Starter Templates Section */}
                  <div className="mb-4 border-t border-border/60 pt-3">
                    <div className="text-[10px] font-black text-text-soft uppercase tracking-wider mb-2">Reset Layout with Starter</div>
                    <div className="flex gap-1.5">
                      {(["landing", "post", "brand"] as const).map((tmpl) => (
                        <button
                          key={tmpl}
                          onClick={() => {
                            applyStarter(tmpl);
                            setShowPageManager(false);
                          }}
                          className="flex-1 text-center py-1.5 rounded-lg border border-border bg-background-soft hover:bg-background-muted text-xs font-bold text-text-muted hover:text-text-main capitalize transition-all duration-150 active:scale-95"
                        >
                          {tmpl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Document Switcher List */}
                  <div className="mb-4 border-t border-border/60 pt-3">
                    <div className="text-[10px] font-black text-text-soft uppercase tracking-wider mb-2">Switch Page ({pageEntries.length})</div>
                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {pageEntries.map(([id, page]) => {
                        const isCurrent = id === activePageId;
                        const pageType = (page as any)?.pageType === "post" ? "post" : "page";
                        return (
                          <button
                            key={id}
                            onClick={() => {
                              void switchPage(id);
                              setShowPageManager(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 text-left ${
                              isCurrent
                                ? "bg-brand-primary text-text-inverse shadow-sm"
                                : "hover:bg-background-soft text-text-main"
                            }`}
                          >
                            <span className="truncate mr-2">{(page as any)?.name || id}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${
                              isCurrent ? "bg-white/20 text-white" : "bg-background-soft border border-border text-text-soft"
                            }`}>
                              {pageType}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add New Page Form */}
                  <div className="border-t border-border/60 pt-3">
                    <div className="text-[10px] font-black text-text-soft uppercase tracking-wider mb-2">Create New Page</div>
                    <div className="space-y-2">
                      <input
                        value={newPageName}
                        onChange={(e) => setNewPageName(e.target.value)}
                        placeholder="e.g. Terms & Conditions"
                        className="w-full rounded-xl border border-border bg-background-soft px-3 py-2 text-xs font-bold text-text-main placeholder-text-soft focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newPageName.trim()) {
                            void handleAddPage();
                            setShowPageManager(false);
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <select
                          value={newPageType}
                          onChange={(e) => setNewPageType(e.target.value === "post" ? "post" : "page")}
                          className="flex-1 rounded-xl border border-border bg-background-soft px-3 py-2 text-xs font-bold text-text-main cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-primary h-9"
                        >
                          <option value="page">Page Layout</option>
                          <option value="post">Blog Post</option>
                        </select>
                        <button
                          onClick={() => {
                            void handleAddPage();
                            setShowPageManager(false);
                          }}
                          disabled={saving || !newPageName.trim()}
                          className="bg-brand-primary hover:bg-brand-secondary text-text-inverse px-4 py-2 rounded-xl transition-all disabled:opacity-50 text-xs font-bold flex items-center justify-center gap-1 active:scale-95 duration-150 h-9 shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Create</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </>
            )}
          </div>
        </div>

        {/* Center Section: Dynamic Status Indicator */}
        <div className="flex items-center gap-2">
          {saving ? (
            <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving Changes...</span>
            </span>
          ) : dirty ? (
            <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-600 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
              <span>Not Saved • Save Draft or Publish</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Saved</span>
            </span>
          )}
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2">
          {/* Save Draft Button */}
          <button
            onClick={() => void handleSaveDraftNow()}
            disabled={saving}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border bg-background-soft px-4 text-xs font-bold text-text-main hover:bg-background-muted transition-all active:scale-95 duration-150 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Draft</span>
          </button>

          {/* Publish Button */}
          <button
            onClick={() => void handlePublish(puckData)}
            disabled={saving}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-brand-primary text-text-inverse px-5 text-xs font-black hover:bg-brand-secondary transition-all shadow-md active:scale-95 duration-150 disabled:opacity-50"
          >
            <span>Publish Page</span>
          </button>
        </div>

      </div>
      
      {/* Puck Editor Workspace */}
      <div className="flex-1 overflow-hidden relative">
        <Puck config={puckConfig} data={puckData} onPublish={handlePublish} onChange={(nextData: any) => patchActivePageData(nextData)} />
      </div>
    </div>
  );
}
