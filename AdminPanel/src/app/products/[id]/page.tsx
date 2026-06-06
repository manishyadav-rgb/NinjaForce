"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Droplet,
  GripVertical,
  ImagePlus,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  X,
  PackageOpen,
  Settings,
  Tags,
  AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { withSiteId } from "@/lib/site-context";
import { useAdminPermissions } from "@/lib/use-admin-permissions";
import { motion, AnimatePresence } from "framer-motion";

const MAX_IMAGES = 10;

type KeyValueRow = {
  label: string;
  value: string;
};

type DescriptionSections = {
  highlights: KeyValueRow[];
  details: KeyValueRow[];
  care: KeyValueRow[];
};

function parseToKeyValueArray(input: any, defaultLabel: string): KeyValueRow[] {
  if (Array.isArray(input)) {
    return input.map(item => ({
      label: item.label || defaultLabel,
      value: item.value || ""
    }));
  }
  
  if (typeof input === "string" && input.trim()) {
    return input.split("\n").map(line => {
      const trimmed = line.trim().replace(/^•\s*/, "");
      if (!trimmed) return null;
      
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx > 0) {
        return {
          label: trimmed.substring(0, colonIdx).trim(),
          value: trimmed.substring(colonIdx + 1).trim()
        };
      }
      return {
        label: defaultLabel,
        value: trimmed
      };
    }).filter(Boolean) as KeyValueRow[];
  }
  
  return [];
}

type CollectionOption = {
  id: string;
  name: string;
  slug: string;
};

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

type AssignedCollection = {
  collection_id: string;
  name: string;
  slug: string;
};

type ProductDetail = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  long_description: string | null;
  is_active: boolean;
  descriptionSections: DescriptionSections;
  gallery_images: { id: string; image_url: string; sort_order: number }[];
  variant: {
    sku: string | null;
    sale_price: string | null;
    mrp: string | null;
    collection: string | null;
    size: string | null;
  } | null;
  collections: AssignedCollection[];
};


// Elegant product image component with error boundary fallback
const ProductImage = ({ src }: { src: string | null }) => {
  const [error, setError] = useState(false);
  
  if (!src || error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-brand-primary/5 text-brand-primary/60">
        <PackageOpen className="h-5 w-5" />
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt="" 
      onError={() => setError(true)} 
      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" 
    />
  );
};

export default function ProductEditPage() {
  const { can } = useAdminPermissions();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form state
  const [imageUrls, setImageUrls] = useState<string[]>(Array(MAX_IMAGES).fill(""));
  const [sections, setSections] = useState<DescriptionSections>({
    highlights: [],
    details: [],
    care: [],
  });
  const [activeTab, setActiveTab] = useState<"highlights" | "details" | "care">("highlights");
  const [size, setSize] = useState("");
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Collections
  const [allCollections, setAllCollections] = useState<CollectionOption[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [collectionDropdownOpen, setCollectionDropdownOpen] = useState(false);
  const [allCategories, setAllCategories] = useState<CategoryOption[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  async function loadProduct() {
    setLoading(true);
    try {
      const res = await fetch(withSiteId(`/api/admin/products/${id}`));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setProduct(data);

      // Populate images
      const imgs = (data.gallery_images || []).map((g: { image_url: string }) => g.image_url);
      while (imgs.length < MAX_IMAGES) imgs.push("");
      setImageUrls(imgs.slice(0, MAX_IMAGES));

      // Populate descriptions
      const loaded = data.descriptionSections || { highlights: "", details: "", care: "" };
      setSections({
        highlights: parseToKeyValueArray(loaded.highlights, "Highlight"),
        details: parseToKeyValueArray(loaded.details, "Detail"),
        care: parseToKeyValueArray(loaded.care, "Care"),
      });

      if (data.variant?.size) {
        setSize(data.variant.size);
      }
      setTitle(data.title || "");
      setSku(data.variant?.sku || "");
      setSalePrice(data.variant?.sale_price || "");
      setMrp(data.variant?.mrp || "");
      setIsActive(Boolean(data.is_active));

      // Populate collections
      setSelectedCollectionIds(
        (data.collections || []).map((c: AssignedCollection) => c.collection_id),
      );
      setSelectedCategoryId(data.category?.id || "");
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to load product",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadCollections() {
    try {
      const res = await fetch(withSiteId("/api/admin/collections"));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load collections");
      setAllCollections(
        (data.collections || []).map((c: CollectionOption) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        })),
      );
    } catch (err) {
      console.error("loadCollections error:", err);
      setMessage({
        text: err instanceof Error ? `Collections: ${err.message}` : "Failed to load collections",
        type: "error",
      });
    }
  }

  async function loadCategories() {
    try {
      const res = await fetch(withSiteId("/api/admin/categories"));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load categories");
      setAllCategories(
        (data.categories || []).map((c: CategoryOption) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        })),
      );
    } catch (err) {
      console.error("loadCategories error:", err);
      setMessage({
        text: err instanceof Error ? `Categories: ${err.message}` : "Failed to load categories",
        type: "error",
      });
    }
  }

  useEffect(() => {
    loadProduct();
    loadCollections();
    loadCategories();
  }, [id]);


  function updateImage(index: number, value: string) {
    setImageUrls((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function removeImage(index: number) {
    setImageUrls((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      next.push("");
      return next;
    });
  }

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= MAX_IMAGES) return;
    setImageUrls((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function toggleCollection(colId: string) {
    setSelectedCollectionIds((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId],
    );
  }

  const filledImages = imageUrls.filter((u) => u.trim());


  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(withSiteId(`/api/admin/products/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          is_active: isActive,
          sale_price: salePrice.trim() || null,
          mrp: mrp.trim() || null,
          descriptionSections: sections,
          images: imageUrls.filter((u) => u.trim()),
          collectionIds: selectedCollectionIds,
          categoryId: selectedCategoryId || null,
          size: size,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setMessage({ text: "Product enrichment saved successfully!", type: "success" });
      await loadProduct();
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to save",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-xs font-bold text-text-soft uppercase tracking-wider">Loading Product Editor...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-sm font-bold text-text-soft uppercase tracking-wider">Product not found</p>
        <Link
          href="/products"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-primary px-5 text-xs font-extrabold text-text-inverse hover:bg-brand-secondary transition-all active:scale-95 shadow-soft"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
      </div>
    );
  }

  const descTabs = [
    {
      key: "highlights" as const,
      label: "Highlights",
      icon: <Sparkles className="h-4 w-4 shrink-0" />,
    },
    {
      key: "details" as const,
      label: "Details & Specs",
      icon: <ClipboardList className="h-4 w-4 shrink-0" />,
    },
    {
      key: "care" as const,
      label: "Care Instructions",
      icon: <Droplet className="h-4 w-4 shrink-0" />,
    },
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 font-primary">
      {/* Back & Title Header banner */}
      <div className="pb-6 border-b border-border/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/products"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background-elevated text-text-soft hover:bg-background-soft hover:text-brand-primary transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-brand-primary">
                <Settings className="h-3 w-3 animate-spin-slow text-brand-primary" />
                Product Editor
              </div>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-text-main font-display truncate">
              {title || product.title}
            </h2>
            <p className="text-[10px] font-bold text-text-soft flex items-center gap-1.5 truncate">
              <span>/{product.slug}</span>
              {product.variant?.sku && <span>•</span>}
              {product.variant?.sku && (
                <span className="font-mono bg-background-soft px-1.5 py-0.5 rounded border border-border/80 text-[9px] text-text-soft font-semibold select-all">
                  SKU: {product.variant.sku}
                </span>
              )}
              {product.variant?.sale_price && <span>•</span>}
              {product.variant?.sale_price && (
                <span className="text-brand-primary">₹{product.variant.sale_price}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/products"
            className="inline-flex h-[38px] items-center justify-center rounded-full border border-border bg-background-elevated px-5 text-xs font-extrabold text-text-main hover:bg-background-soft transition-colors shadow-soft"
          >
            Discard
          </Link>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-full bg-brand-primary text-text-inverse px-5 text-xs font-extrabold hover:bg-brand-secondary transition-all active:scale-95 disabled:opacity-50 shadow-soft"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{saving ? "Saving..." : "Save Enrichment"}</span>
          </button>
        </div>
      </div>

      {/* Status Alert Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-xs font-bold shadow-soft ${
              message.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}
          >
            {message.type === "success" ? (
              <Check className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            )}
            <span className="flex-1">{message.text}</span>
            <button onClick={() => setMessage(null)} className="hover:opacity-75 transition-opacity pl-2">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Grid layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* —— LEFT PANEL: Media & Specs —— */}
        <div className="space-y-6">
          {/* —— IMAGES SECTION —— */}
          <div className="rounded-3xl border border-border bg-background-elevated shadow-soft overflow-hidden animate-fadeIn">
            <div className="border-b border-border bg-background-soft/60 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-text-main flex items-center gap-2">
                  <ImagePlus className="h-4.5 w-4.5 text-brand-primary" />
                  Product Gallery
                </h3>
                <p className="mt-1 text-[11px] text-text-soft font-semibold">
                  Add up to 10 images. The first image serves as the primary catalog thumbnail.
                </p>
              </div>
              <span className="rounded-full bg-background-soft border border-border px-3 py-0.5 text-[10px] font-black uppercase text-text-soft shrink-0">
                {filledImages.length} / {MAX_IMAGES}
              </span>
            </div>

            <div className="p-5 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                {filledImages.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className={`group relative aspect-square overflow-hidden rounded-2xl border bg-background-soft shadow-soft hover:border-brand-primary/45 transition-all duration-300 ${
                      idx === 0 ? "border-brand-primary ring-2 ring-brand-primary/10 animate-pulse-once" : "border-border"
                    }`}
                  >
                    <ProductImage src={url} />
                    
                    {idx === 0 ? (
                      <span className="absolute left-2.5 top-2.5 rounded-md bg-brand-primary px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-text-inverse shadow-sm">
                        Main
                      </span>
                    ) : (
                      <span className="absolute left-2.5 top-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[8px] font-black text-white/95 shadow-sm">
                        #{idx + 1}
                      </span>
                    )}
                    
                    <div className="absolute inset-0 flex flex-col justify-between p-2 bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/35 group-hover:opacity-100">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="rounded-xl bg-rose-500 p-1.5 text-white hover:bg-rose-600 shadow-soft transition-colors"
                          title="Remove image"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex justify-between gap-1">
                        {idx > 0 ? (
                          <button
                            type="button"
                            onClick={() => moveImage(idx, idx - 1)}
                            className="rounded-lg bg-background-elevated/90 p-1 text-text-main hover:bg-background-elevated shadow-soft transition-colors"
                            title="Move Left"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <div />
                        )}
                        
                        {idx < filledImages.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => moveImage(idx, idx + 1)}
                            className="rounded-lg bg-background-elevated/90 p-1 text-text-main hover:bg-background-elevated shadow-soft transition-colors"
                            title="Move Right"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <div />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filledImages.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => {
                      const inputs = document.querySelectorAll('input[type="url"]');
                      const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
                      if (lastInput) {
                        lastInput.focus();
                        lastInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className="flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background-elevated text-text-soft transition-all hover:bg-background-soft/30 hover:border-brand-primary hover:text-brand-primary group"
                  >
                    <ImagePlus className="h-5 w-5 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-wider">Add URL</span>
                  </button>
                )}
              </div>

              <div className="grid gap-3 border-t border-border/60 pt-5">
                <span className="text-[10px] font-black uppercase tracking-wider text-text-soft">Image URL Sources</span>
                {Array.from({ length: Math.min(MAX_IMAGES, filledImages.length + 1) }).map((_, idx) => {
                  const url = imageUrls[idx] || "";
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-5 text-right text-[10px] font-black text-text-soft">
                        {idx + 1}
                      </span>
                      <div className={`flex-1 flex items-center rounded-xl border px-3 py-2 transition-all duration-200 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15 ${
                        url.trim()
                          ? "border-brand-primary/25 bg-brand-primary/5"
                          : "border-border border-dashed bg-background-elevated"
                      }`}>
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => updateImage(idx, e.target.value)}
                          placeholder={idx === 0 ? "Paste main product image URL..." : "Paste secondary gallery URL..."}
                          className="w-full border-none bg-transparent text-xs font-semibold text-text-main placeholder-text-soft focus:outline-none focus:ring-0 p-0"
                        />
                      </div>
                      
                      {url.trim() && (
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-text-soft hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                          title="Remove image URL"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* —— DESCRIPTION SECTIONS —— */}
          <div className="rounded-3xl border border-border bg-background-elevated shadow-soft overflow-hidden">
            <div className="flex border-b border-border bg-background-soft/30">
              {descTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wide transition-all duration-200 border-b-2 ${
                    activeTab === tab.key
                      ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                      : "border-transparent text-text-soft hover:bg-background-soft/30 hover:text-text-main"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {sections[tab.key]?.some(r => r.value.trim()) && (
                    <Check className="ml-1 h-3.5 w-3.5 text-brand-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/40">
                <span className="text-[10px] font-bold text-text-soft">
                  Manage lists and specifications as custom key-value label pairs.
                </span>
                
                <button
                  type="button"
                  onClick={() => {
                    setSections((prev) => {
                      const next = { ...prev };
                      next[activeTab] = [...next[activeTab], { label: "", value: "" }];
                      return next;
                    });
                  }}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-brand-primary bg-background-elevated text-brand-primary px-4 text-xs font-bold hover:bg-brand-primary hover:text-text-inverse hover:border-transparent transition-all shadow-soft active:scale-95 duration-200 shrink-0"
                >
                  <span>+ Add Parameter</span>
                </button>
              </div>

              {!sections[activeTab] || sections[activeTab].length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-10 text-center bg-background-soft/10">
                  <p className="text-xs font-bold text-text-soft">No specifications added yet</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSections((prev) => {
                        const next = { ...prev };
                        const defaultLabel = activeTab === "highlights" ? "Highlight" : activeTab === "details" ? "Detail" : "Care";
                        next[activeTab] = [
                          { label: defaultLabel, value: "" }
                        ];
                        return next;
                      });
                    }}
                    className="mt-2 text-xs font-extrabold text-brand-primary hover:underline"
                  >
                    Click to add custom row template
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sections[activeTab].map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className="flex flex-col gap-0.5 text-text-soft shrink-0">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSections((prev) => {
                                const next = { ...prev };
                                const list = [...next[activeTab]];
                                const temp = list[idx];
                                list[idx] = list[idx - 1];
                                list[idx - 1] = temp;
                                next[activeTab] = list;
                                return next;
                              });
                            }}
                            className="hover:text-text-main transition-colors"
                            title="Move Up"
                          >
                            <ChevronDown className="h-4 w-4 rotate-180" />
                          </button>
                        )}
                        
                        {idx < sections[activeTab].length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSections((prev) => {
                                const next = { ...prev };
                                const list = [...next[activeTab]];
                                const temp = list[idx];
                                list[idx] = list[idx + 1];
                                list[idx + 1] = temp;
                                next[activeTab] = list;
                                return next;
                              });
                            }}
                            className="hover:text-text-main transition-colors"
                            title="Move Down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="w-[180px] shrink-0 flex items-center rounded-xl border border-border bg-background-soft px-3 py-2 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15 transition-all duration-200">
                        <input
                          type="text"
                          value={row.label}
                          onChange={(e) => {
                            setSections((prev) => {
                              const next = { ...prev };
                              const list = [...next[activeTab]];
                              list[idx] = { ...list[idx], label: e.target.value };
                              next[activeTab] = list;
                              return next;
                            });
                          }}
                          placeholder="Label"
                          className="w-full border-none bg-transparent text-xs font-bold text-text-main placeholder-text-soft focus:outline-none focus:ring-0 p-0"
                        />
                      </div>

                      <div className="flex-1 flex items-center rounded-xl border border-border bg-background-soft px-3 py-2 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15 transition-all duration-200">
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) => {
                            setSections((prev) => {
                              const next = { ...prev };
                              const list = [...next[activeTab]];
                              list[idx] = { ...list[idx], value: e.target.value };
                              next[activeTab] = list;
                              return next;
                            });
                          }}
                          placeholder="Value details..."
                          className="w-full border-none bg-transparent text-xs font-semibold text-text-main placeholder-text-soft focus:outline-none focus:ring-0 p-0"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSections((prev) => {
                            const next = { ...prev };
                            const list = [...next[activeTab]];
                            list.splice(idx, 1);
                            next[activeTab] = list;
                            return next;
                          });
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-text-soft hover:bg-rose-500/10 hover:text-rose-500 transition-colors shrink-0"
                        title="Delete parameter row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


        </div>

        {/* —— RIGHT SIDEBAR: Parameters —— */}
        <div className="space-y-6 self-start">
          <div className="rounded-3xl border border-border bg-background-elevated p-5 shadow-soft space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-text-soft flex items-center gap-1.5">
              <Settings className="h-4 w-4 text-brand-primary" />
              Product status
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-soft">Product Title</label>
              <div className="flex items-center rounded-xl border border-border bg-background-soft px-3 py-2.5 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15 transition-all duration-200">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-none bg-transparent text-xs font-bold text-text-main placeholder-text-soft focus:outline-none focus:ring-0 p-0"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-b border-border/40">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span className="text-xs font-extrabold text-text-main">{isActive ? "Active" : "Draft"}</span>
              </div>
              
              <label className="inline-flex items-center gap-2 text-xs font-bold text-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-border accent-brand-primary focus:ring-0"
                />
                <span>Active</span>
              </label>
            </div>

            {product.variant && (
              <div className="space-y-2 text-xs font-semibold text-text-muted bg-background-soft/30 p-3 rounded-2xl border border-border">
                <div className="flex justify-between">
                  <span>Current Price</span>
                  <span className="font-extrabold text-text-main">₹{salePrice || "0"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current MRP</span>
                  <span className="line-through text-text-soft">₹{mrp || "0"}</span>
                </div>
                {sku && (
                  <div className="flex justify-between">
                    <span>Active SKU</span>
                    <span className="font-mono font-bold text-brand-primary">{sku}</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4 border-t border-border/40 pt-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-soft">Sale Price (₹)</label>
                <div className="flex items-center rounded-xl border border-border bg-background-soft px-3 py-2.5 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15 transition-all duration-200">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full border-none bg-transparent text-xs font-bold text-text-main placeholder-text-soft focus:outline-none focus:ring-0 p-0 no-spinner"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-soft">MRP (₹)</label>
                <div className="flex items-center rounded-xl border border-border bg-background-soft px-3 py-2.5 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15 transition-all duration-200">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    className="w-full border-none bg-transparent text-xs font-bold text-text-main placeholder-text-soft focus:outline-none focus:ring-0 p-0 no-spinner"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-soft">System SKU</label>
                <div className="rounded-xl border border-border bg-background-soft/60 px-3.5 py-2.5 font-mono text-xs font-semibold text-text-soft select-all">
                  {sku || "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Size / Attributes Card */}
          <div className="rounded-3xl border border-border bg-background-elevated p-5 shadow-soft space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-text-soft">
              Attributes
            </h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-soft">Size Variant</label>
              <div className="relative">
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-border bg-background-soft px-3.5 py-2.5 pr-10 text-xs font-bold text-text-main transition-colors hover:border-brand-primary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15 cursor-pointer"
                >
                  <option value="">Select Size...</option>
                  <option value="Single">Single</option>
                  <option value="Queen">Queen</option>
                  <option value="King">King</option>
                  <option value="Super King">Super King</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-soft" />
              </div>
            </div>

            <div className="space-y-1.5 border-t border-border/40 pt-4">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-soft">Category Tag</label>
              <div className="relative">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-border bg-background-soft px-3.5 py-2.5 pr-10 text-xs font-bold text-text-main transition-colors hover:border-brand-primary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15 cursor-pointer"
                >
                  <option value="">Select Category...</option>
                  {allCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-soft" />
              </div>
            </div>
          </div>

          {/* Collections Card */}
          <div className="rounded-3xl border border-border bg-background-elevated shadow-soft overflow-hidden">
            <div className="border-b border-border bg-background-soft/60 px-5 py-4">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-text-main flex items-center gap-1.5">
                <Tags className="h-4.5 w-4.5 text-brand-primary" />
                Collections
              </h3>
              <p className="mt-0.5 text-[10px] text-text-soft font-semibold">
                Assign this product to custom store collections.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCollectionDropdownOpen(!collectionDropdownOpen)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-background-soft px-3.5 py-2.5 text-xs font-bold text-text-main transition-colors hover:border-brand-primary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15"
                >
                  <span>
                    {selectedCollectionIds.length === 0
                      ? "Select collections..."
                      : `${selectedCollectionIds.length} collections selected`}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-text-soft transition-transform duration-200 ${
                      collectionDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {collectionDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-border bg-background-elevated shadow-dropdown py-1 animate-fadeIn">
                    {allCollections.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs font-semibold text-text-soft">
                        No collections configured.{" "}
                        <Link href="/collections" className="text-brand-primary underline font-bold">
                          Create one now
                        </Link>
                      </p>
                    ) : (
                      allCollections.map((col) => {
                        const isSelected = selectedCollectionIds.includes(col.id);
                        return (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => toggleCollection(col.id)}
                            className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs transition-colors duration-150 ${
                              isSelected
                                ? "bg-brand-primary/10 text-brand-primary font-bold"
                                : "text-text-main hover:bg-background-soft/50"
                            }`}
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                isSelected
                                  ? "border-brand-primary bg-brand-primary"
                                  : "border-border bg-background-elevated"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 text-text-inverse" />}
                            </span>
                            <span className="flex-1 truncate">{col.name}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Selected Tags */}
              {selectedCollectionIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {selectedCollectionIds.map((colId) => {
                    const col = allCollections.find((c) => c.id === colId);
                    if (!col) return null;
                    return (
                      <span
                        key={colId}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-2.5 py-1 text-[10px] font-bold text-brand-primary border border-brand-primary/15"
                      >
                        {col.name}
                        <button
                          type="button"
                          onClick={() => toggleCollection(colId)}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-brand-primary/20 text-brand-primary"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-3xl border border-border bg-background-elevated p-5 shadow-soft space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-text-soft">
              Quick Actions
            </h3>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full inline-flex h-9 items-center justify-center rounded-xl bg-brand-primary text-text-inverse text-xs font-extrabold hover:bg-brand-secondary active:scale-98 transition-all disabled:opacity-50 shadow-soft"
              >
                {saving ? "Saving..." : "Save All Changes"}
              </button>
              <Link
                href="/products"
                className="w-full inline-flex h-9 items-center justify-center rounded-xl border border-border bg-background-soft text-text-main text-xs font-bold hover:bg-background-soft/85 transition-colors text-center"
              >
                Discard & Go Back
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
