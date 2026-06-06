"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Boxes,
  CheckCircle2,
  Copy,
  Edit3,
  ImagePlus,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Coins,
  FolderTree,
  Tag,
  FileText,
  Layers,
  Heart,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { withSiteId } from "@/lib/site-context";
import { useAdminPermissions } from "@/lib/use-admin-permissions";

type Product = { id: string; title: string; mrp?: string | null; sale_price?: string | null; image_url?: string | null };
type Category = { id: string; name: string; slug: string };
type Collection = { id: string; name: string; slug: string };
type VariantAttributes = {
  size?: string;
  color?: string;
  fabric?: string;
  pack?: string;
  gsm?: string;
  dimensions?: string;
};
type Variant = {
  id: string;
  product_id: string;
  product_title: string;
  sku: string;
  title: string | null;
  attributes: VariantAttributes | null;
  mrp: string;
  sale_price: string;
  is_active: boolean;
  quantity_available: number | null;
  image_url: string | null;
};
type VariantForm = {
  product_id: string;
  sku: string;
  title: string;
  mrp: string;
  sale_price: string;
  quantity_available: string;
  image_url: string;
  is_active: boolean;
  size: string;
  color: string;
  fabric: string;
  pack: string;
  gsm: string;
  dimensions: string;
};
type DetailTab = {
  id: string;
  label: string;
  value: string;
};

const emptyForm: VariantForm = {
  product_id: "",
  sku: "",
  title: "",
  mrp: "",
  sale_price: "",
  quantity_available: "0",
  image_url: "",
  is_active: true,
  size: "",
  color: "",
  fabric: "",
  pack: "",
  gsm: "",
  dimensions: "",
};

const presets = [
  { label: "Bedsheet", size: "King", fabric: "Cotton", pack: "1 Bedsheet + 2 Pillow Covers", dimensions: "108 x 108 in" },
  { label: "Sofa Cover", size: "3 Seater", fabric: "Stretch Fabric", pack: "Set of 1", dimensions: "Standard 3 seater" },
  { label: "Towel", size: "Bath", fabric: "Cotton Terry", pack: "Set of 2", gsm: "450 GSM" },
  { label: "Cushion Cover", size: "16 x 16 in", fabric: "Cotton Blend", pack: "Set of 5", dimensions: "16 x 16 in" },
];

const sizeIdeas = ["Single", "Queen", "King", "Bath", "Hand", "3 Seater", "5 Seater", "16 x 16 in"];
const colorIdeas = ["White", "Blue", "Grey", "Beige", "Maroon", "Green", "Multicolor"];
const fabricIdeas = ["Cotton", "Cotton Terry", "Microfiber", "Stretch Fabric", "Velvet", "Cotton Blend"];
const packIdeas = ["Single Piece", "Set of 2", "Set of 4", "Set of 5", "1 Bedsheet + 2 Pillow Covers"];
const pageSize = 5;
const maxImages = 10;

function money(value: string | number) {
  return `INR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function discountPercent(mrp: string | number, salePrice: string | number) {
  const original = Number(mrp || 0);
  const sale = Number(salePrice || 0);
  if (original <= 0 || sale <= 0 || sale >= original) return 0;
  return Math.round(((original - sale) / original) * 100);
}

function fieldLabel(key: keyof VariantAttributes) {
  return ({ size: "Size", color: "Color", fabric: "Fabric", pack: "Pack", gsm: "GSM", dimensions: "Dimensions" } as const)[key];
}

function buildTitle(form: VariantForm) {
  const parts = [form.size, form.color, form.fabric, form.pack].map((v) => v.trim()).filter(Boolean);
  return form.title.trim() || parts.join(" / ");
}

function buildAttributes(form: VariantForm): VariantAttributes {
  return {
    size: form.size.trim() || undefined,
    color: form.color.trim() || undefined,
    fabric: form.fabric.trim() || undefined,
    pack: form.pack.trim() || undefined,
    gsm: form.gsm.trim() || undefined,
    dimensions: form.dimensions.trim() || undefined,
  };
}

function StatCard({ icon: Icon, label, value, colorClass }: { icon: LucideIcon; label: string; value: string; colorClass: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card hover:shadow-md hover:border-slate-300 transition-all duration-300 flex items-center justify-between overflow-hidden relative group">
      <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-brand-primary/5 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300 pointer-events-none" />
      <div className="flex items-center gap-4 min-w-0">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colorClass} shadow-soft transition-transform duration-300 group-hover:scale-105`}>
          <Icon className="h-5.5 w-5.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-800 tracking-tight transition-all duration-300 group-hover:translate-x-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ChipGroup({
  label,
  items,
  onPick,
  onAdd,
  onRemove,
}: {
  label: string;
  items: string[];
  onPick: (value: string) => void;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
}) {
  const [newItem, setNewItem] = useState("");
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200/80 bg-white text-[11.5px] font-semibold text-slate-700 shadow-soft hover:shadow-sm hover:border-brand-primary/45 transition-all duration-200">
            <button type="button" onClick={() => onPick(item)} className="pl-3 pr-2.5 py-1.5 hover:bg-brand-primary/[0.03] hover:text-brand-primary transition-colors">
              {item}
            </button>
            <button type="button" onClick={() => onRemove(item)} className="flex h-7 w-7 items-center justify-center border-l border-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" aria-label={`Remove ${item}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <form
        className="mt-2.5 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const clean = newItem.trim();
          if (!clean) return;
          onAdd(clean);
          onPick(clean);
          setNewItem("");
        }}
      >
        <input
          value={newItem}
          onChange={(event) => setNewItem(event.target.value)}
          placeholder={`Add custom ${label.toLowerCase().replace(" ideas", "")}`}
          className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-800 outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
        />
        <button type="submit" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-primary px-3 text-[12px] font-black text-white hover:bg-brand-secondary transition-all active:scale-95 shadow-soft">
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </form>
    </div>
  );
}

function ProductSearchPicker({
  label,
  products,
  value,
  search,
  open,
  onSearchChange,
  onOpenChange,
  onSelect,
  onClear,
}: {
  label: string;
  products: Product[];
  value: string;
  search: string;
  open: boolean;
  onSearchChange: (value: string) => void;
  onOpenChange: (value: boolean) => void;
  onSelect: (productId: string) => void;
  onClear?: () => void;
}) {
  const selectedProduct = products.find((product) => product.id === value);
  const term = search.trim().toLowerCase();
  const suggestions = products
    .filter((product) => !term || product.title.toLowerCase().includes(term));

  return (
    <div className="relative" onBlur={() => window.setTimeout(() => onOpenChange(false), 150)}>
      <label className="mb-1.5 block text-[12.5px] font-bold text-slate-700">{label}</label>
      <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-soft focus-within:border-brand-primary focus-within:ring-4 focus-within:ring-brand-primary/10 transition-all duration-200">
        {selectedProduct ? (
          <div className="mb-2.5 flex items-center justify-between gap-3 rounded-xl bg-brand-primary/[0.02] border border-brand-primary/10 px-3.5 py-2.5 transition-all">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-black text-slate-800">{selectedProduct.title}</p>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{money(selectedProduct.sale_price || 0)} / MRP {money(selectedProduct.mrp || 0)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClear?.();
                onSearchChange("");
                onOpenChange(true);
              }}
              className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-100 shadow-soft transition-all"
              aria-label="Clear selected product"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              onSearchChange(event.target.value);
              onOpenChange(true);
            }}
            onFocus={() => onOpenChange(true)}
            placeholder={selectedProduct ? "Search to change product" : "Search product by name"}
            className="h-10 w-full rounded-xl border border-transparent bg-slate-50/70 pl-[38px] pr-3.5 text-[13px] font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-slate-100"
          />
        </div>
      </div>
      {open ? (
        <div className="absolute z-35 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-dropdown animate-fadeIn" style={{ scrollbarWidth: "thin" }}>
          {suggestions.length === 0 ? (
            <div className="p-4.5 text-[13px] font-semibold text-slate-450">No product found.</div>
          ) : (
            suggestions.map((product) => (
              <button
                key={product.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(product.id);
                  onSearchChange("");
                  onOpenChange(false);
                }}
                className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition-all duration-150 last:border-b-0 hover:bg-brand-primary/[0.03]"
              >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-50 border border-slate-100/50 shadow-soft">
                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400 bg-slate-50">
                      <Boxes className="h-4.5 w-4.5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-black text-slate-800">{product.title}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{money(product.sale_price || 0)} / MRP {money(product.mrp || 0)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function VariantsPage() {
  const { can } = useAdminPermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [filterProductSearch, setFilterProductSearch] = useState("");
  const [filterProductPickerOpen, setFilterProductPickerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [variantMode, setVariantMode] = useState<"option" | "full">("full");
  const [variantShortName, setVariantShortName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [detailTabs, setDetailTabs] = useState<DetailTab[]>([
    { id: "highlights", label: "Highlights", value: "" },
    { id: "details", label: "Details", value: "" },
    { id: "care", label: "Care", value: "" },
  ]);
  const [activeDetailTabId, setActiveDetailTabId] = useState("highlights");
  const [imageUrls, setImageUrls] = useState<string[]>(Array(maxImages).fill(""));
  const [categoryId, setCategoryId] = useState("");
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [sizeOptions, setSizeOptions] = useState(sizeIdeas);
  const [colorOptions, setColorOptions] = useState(colorIdeas);
  const [fabricOptions, setFabricOptions] = useState(fabricIdeas);
  const [packOptions, setPackOptions] = useState(packIdeas);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [form, setForm] = useState<VariantForm>(emptyForm);

  const selectedProduct = products.find((p) => p.id === form.product_id);
  const activeProductFilter = selectedProductId || form.product_id;
  const canShowForm = editingId ? can("variants.edit") : can("variants.create");

  const filteredVariants = useMemo(() => {
    const term = search.trim().toLowerCase();
    return variants.filter((variant) => {
      const matchesProduct = activeProductFilter ? variant.product_id === activeProductFilter : true;
      const haystack = `${variant.product_title} ${variant.title || ""} ${variant.sku}`.toLowerCase();
      return matchesProduct && (!term || haystack.includes(term));
    });
  }, [variants, activeProductFilter, search]);

  const stats = useMemo(() => {
    const active = variants.filter((v) => v.is_active).length;
    const lowStock = variants.filter((v) => Number(v.quantity_available || 0) <= 5).length;
    const productCount = new Set(variants.map((v) => v.product_id)).size;
    return { active, lowStock, productCount };
  }, [variants]);

  const totalPages = Math.max(1, Math.ceil(filteredVariants.length / pageSize));
  const paginatedVariants = filteredVariants.slice((page - 1) * pageSize, page * pageSize);
  const pageStart = filteredVariants.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(filteredVariants.length, page * pageSize);
  const previewTitle = buildTitle(form) || "King / Blue / Cotton";
  const previewImage = variantMode === "full" ? imageUrls.find((url) => url.trim()) || form.image_url : form.image_url;
  const previewDiscount = discountPercent(form.mrp, form.sale_price);
  const activeDetailTab = detailTabs.find((tab) => tab.id === activeDetailTabId) || detailTabs[0];

  async function loadProducts() {
    const res = await fetch(withSiteId("/api/admin/products"));
    const data = await res.json();
    setProducts(Array.isArray(data) ? data.map((p: any) => ({ id: p.id, title: p.title, mrp: p.mrp, sale_price: p.sale_price, image_url: p.image_url })) : []);
  }

  async function loadTaxonomy() {
    const [categoryRes, collectionRes] = await Promise.all([
      fetch(withSiteId("/api/admin/categories")),
      fetch(withSiteId("/api/admin/collections")),
    ]);
    const categoryData = await categoryRes.json();
    const collectionData = await collectionRes.json();
    setCategories(Array.isArray(categoryData.categories) ? categoryData.categories : []);
    setCollections(Array.isArray(collectionData.collections) ? collectionData.collections : []);
  }

  async function loadVariants() {
    setLoading(true);
    const query = selectedProductId ? `?productId=${encodeURIComponent(selectedProductId)}` : "";
    const res = await fetch(withSiteId(`/api/admin/variants${query}`));
    const data = await res.json();
    setVariants(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts().catch(() => {});
    loadTaxonomy().catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("qh_variant_ideas");
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.size)) setSizeOptions(parsed.size);
      if (Array.isArray(parsed.color)) setColorOptions(parsed.color);
      if (Array.isArray(parsed.fabric)) setFabricOptions(parsed.fabric);
      if (Array.isArray(parsed.pack)) setPackOptions(parsed.pack);
    } catch {
      // Ignore malformed local custom chips.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "qh_variant_ideas",
      JSON.stringify({ size: sizeOptions, color: colorOptions, fabric: fabricOptions, pack: packOptions }),
    );
  }, [sizeOptions, colorOptions, fabricOptions, packOptions]);

  useEffect(() => {
    loadVariants().catch(() => setLoading(false));
  }, [selectedProductId]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedProductId, form.product_id, filteredVariants.length]);

  function resetForm(keepProduct = true) {
    setEditingId(null);
    setForm({ ...emptyForm, product_id: keepProduct ? form.product_id : "" });
    setSlug("");
    setVariantShortName("");
    setShortDescription("");
    setDetailTabs([
      { id: "highlights", label: "Highlights", value: "" },
      { id: "details", label: "Details", value: "" },
      { id: "care", label: "Care", value: "" },
    ]);
    setActiveDetailTabId("highlights");
    setImageUrls(Array(maxImages).fill(""));
    setCategoryId("");
    setCollectionIds([]);
  }

  function updateField<K extends keyof VariantForm>(key: K, value: VariantForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addOption(setter: (updater: (current: string[]) => string[]) => void, value: string) {
    setter((current) => current.some((item) => item.toLowerCase() === value.toLowerCase()) ? current : [...current, value]);
  }

  function removeOption(setter: (updater: (current: string[]) => string[]) => void, value: string) {
    setter((current) => current.filter((item) => item !== value));
  }

  function addDetailTab() {
    const id = `tab-${Date.now().toString(36)}`;
    setDetailTabs((current) => [...current, { id, label: "New Tab", value: "" }]);
    setActiveDetailTabId(id);
  }

  function removeDetailTab(tabId: string) {
    setDetailTabs((current) => {
      const next = current.filter((tab) => tab.id !== tabId);
      if (activeDetailTabId === tabId) setActiveDetailTabId(next[0]?.id || "");
      return next.length ? next : [{ id: "details", label: "Details", value: "" }];
    });
  }

  function onChangeProduct(productId: string) {
    const product = products.find((p) => p.id === productId);
    setSelectedProductId(productId);
    setForm((current) => ({
      ...current,
      product_id: productId,
      mrp: current.mrp || String(Number(product?.mrp || 0) || ""),
      sale_price: current.sale_price || String(Number(product?.sale_price || 0) || ""),
      image_url: current.image_url || product?.image_url || "",
    }));
  }

  function clearProductSelection() {
    setSelectedProductId("");
    setForm((current) => ({ ...current, product_id: "" }));
  }

  function applyPreset(preset: (typeof presets)[number]) {
    setForm((current) => ({
      ...current,
      size: preset.size,
      fabric: preset.fabric,
      pack: preset.pack,
      gsm: preset.gsm || current.gsm,
      dimensions: preset.dimensions || current.dimensions,
    }));
  }

  async function uploadVariantImage(file: File | null) {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data.error || "Image upload failed");
      updateField("image_url", data.url);
      setImageUrls((current) => {
        const next = [...current];
        const emptyIndex = next.findIndex((url) => !url.trim());
        next[emptyIndex === -1 ? 0 : emptyIndex] = data.url;
        return next;
      });
      setMessage({ text: "Image uploaded. Save variant to publish it.", type: "success" });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Image upload failed", type: "error" });
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const title = buildTitle(form);
    if (!form.product_id) return setMessage({ text: "Product select karo.", type: "error" });
    if (!title) return setMessage({ text: "At least size, color, fabric, pack ya variant title dalo.", type: "error" });
    if (Number(form.sale_price) > Number(form.mrp)) return setMessage({ text: "Sale price MRP se zyada nahi ho sakta.", type: "error" });

    setSaving(true);
    setMessage(null);

    if (variantMode === "full" && !editingId) {
      const cleanedImages = imageUrls.map((url) => url.trim()).filter(Boolean);
      if (cleanedImages.length === 0 && form.image_url.trim()) cleanedImages.push(form.image_url.trim());
      const res = await fetch(withSiteId("/api/admin/variants/full-product"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_product_id: form.product_id,
          title,
          variant_short_name: variantShortName,
          slug,
          short_description: shortDescription,
          description_sections: detailTabs.reduce<Record<string, string>>((sections, tab) => {
            sections[tab.label.trim() || "Details"] = tab.value;
            return sections;
          }, {}),
          mrp: Number(form.mrp),
          sale_price: Number(form.sale_price),
          quantity_available: Number(form.quantity_available),
          sku: form.sku.trim(),
          images: cleanedImages,
          category_id: categoryId,
          collection_ids: collectionIds,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage({ text: data?.error || "Failed to create full product variant", type: "error" });
        setSaving(false);
        return;
      }
      setMessage({ text: "Full product variant created and linked with the product group.", type: "success" });
      resetForm(true);
      await loadProducts();
      await loadVariants();
      setSaving(false);
      return;
    }

    const payload = {
      product_id: form.product_id,
      sku: form.sku.trim(),
      title,
      mrp: Number(form.mrp),
      sale_price: Number(form.sale_price),
      quantity_available: Number(form.quantity_available),
      image_url: form.image_url.trim(),
      is_active: form.is_active,
      attributes: buildAttributes(form),
    };
    const url = editingId ? withSiteId(`/api/admin/variants/${editingId}`) : withSiteId("/api/admin/variants");
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage({ text: data?.error || "Failed to save variant", type: "error" });
      setSaving(false);
      return;
    }
    setMessage({ text: editingId ? "Variant updated." : "Variant created.", type: "success" });
    resetForm(true);
    await loadVariants();
    setSaving(false);
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this variant?")) return;
    const res = await fetch(withSiteId(`/api/admin/variants/${id}`), { method: "DELETE" });
    if (!res.ok) {
      setMessage({ text: "Failed to delete variant", type: "error" });
      return;
    }
    setMessage({ text: "Variant deleted.", type: "success" });
    await loadVariants();
  }

  function onEdit(variant: Variant) {
    const attrs = variant.attributes || {};
    setEditingId(variant.id);
    setSelectedProductId(variant.product_id);
    setForm({
      product_id: variant.product_id,
      sku: variant.sku,
      title: variant.title || "",
      mrp: String(Number(variant.mrp || 0)),
      sale_price: String(Number(variant.sale_price || 0)),
      quantity_available: String(Number(variant.quantity_available || 0)),
      image_url: variant.image_url || "",
      is_active: variant.is_active,
      size: attrs.size || "",
      color: attrs.color || "",
      fabric: attrs.fabric || "",
      pack: attrs.pack || "",
      gsm: attrs.gsm || "",
      dimensions: attrs.dimensions || "",
    });
  }

  function duplicateVariant(variant: Variant) {
    const attrs = variant.attributes || {};
    setEditingId(null);
    setSelectedProductId(variant.product_id);
    setForm({
      product_id: variant.product_id,
      sku: "",
      title: variant.title ? `${variant.title} Copy` : "",
      mrp: String(Number(variant.mrp || 0)),
      sale_price: String(Number(variant.sale_price || 0)),
      quantity_available: String(Number(variant.quantity_available || 0)),
      image_url: variant.image_url || "",
      is_active: true,
      size: attrs.size || "",
      color: attrs.color || "",
      fabric: attrs.fabric || "",
      pack: attrs.pack || "",
      gsm: attrs.gsm || "",
      dimensions: attrs.dimensions || "",
    });
  }

  const previewColors = useMemo(() => {
    const defaultColors = ["White", "Blue", "Grey", "Beige", "Maroon", "Green", "Multicolor"];
    const activeColor = form.color.trim();
    if (!activeColor) return defaultColors;
    const list = defaultColors.some((c) => c.toLowerCase() === activeColor.toLowerCase())
      ? defaultColors
      : [...defaultColors, activeColor];
    return list;
  }, [form.color]);

  const previewSizes = useMemo(() => {
    const defaultSizes = ["Single", "Queen", "King"];
    const activeSize = form.size.trim();
    if (!activeSize) return defaultSizes;
    const list = defaultSizes.some((s) => s.toLowerCase() === activeSize.toLowerCase())
      ? defaultSizes
      : [...defaultSizes, activeSize];
    return list;
  }, [form.size]);

  const colorBubbleClass = (colorName: string) => {
    const clean = colorName.toLowerCase().trim();
    if (clean.includes("white")) return "bg-white border border-slate-300";
    if (clean.includes("blue")) return "bg-blue-600 border border-transparent";
    if (clean.includes("grey") || clean.includes("gray")) return "bg-slate-400 border border-transparent";
    if (clean.includes("beige") || clean.includes("cream")) return "bg-amber-100 border border-transparent";
    if (clean.includes("maroon") || clean.includes("red")) return "bg-red-800 border border-transparent";
    if (clean.includes("green")) return "bg-emerald-600 border border-transparent";
    if (clean.includes("yellow") || clean.includes("gold")) return "bg-yellow-400 border border-transparent";
    if (clean.includes("pink")) return "bg-pink-400 border border-transparent";
    if (clean.includes("black")) return "bg-slate-900 border border-transparent";
    if (clean.includes("multi")) return "bg-gradient-to-tr from-rose-400 via-emerald-400 to-blue-500 border border-transparent";
    return "bg-slate-200 border border-transparent";
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-brand-primary/[0.02] via-white to-brand-secondary/[0.02] p-6 shadow-card relative overflow-hidden group">
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-brand-primary/5 blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
        <div className="absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-brand-secondary/5 blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-brand-primary shadow-soft">
              <Sparkles className="h-3.5 w-3.5" />
              Variant studio
            </div>
            <h2 className="mt-3 text-lg font-bold tracking-tight text-slate-900 sm:text-xl lg:text-[22px]">Product Variants</h2>
            <p className="mt-1 max-w-3xl text-[13px] font-medium text-slate-500">
              Manage product variant details, pricing, overrides, and images. Perfect for bedsheets, covers, towels, and clothing catalog configurations.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:justify-end">
            {can("variants.create") ? (
              <button
                type="button"
                onClick={() => {
                  resetForm(false);
                  setSelectedProductId("");
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[12px] font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-soft active:scale-95"
              >
                <Plus className="h-4 w-4" />
                New variant
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => loadVariants()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 text-[12px] font-bold text-white hover:bg-brand-secondary transition-all shadow-soft active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {message ? (
        <div className={`rounded-xl border px-4 py-3.5 text-[13px] font-semibold flex items-center gap-2.5 animate-fadeIn shadow-sm ${
          message.type === "success"
            ? "border-emerald-100 bg-emerald-50/50 text-emerald-800"
            : "border-rose-100 bg-rose-50/50 text-rose-800"
        }`}>
          <div className={`h-2 w-2 rounded-full ${message.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`} />
          <span>{message.text}</span>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Boxes} label="Products with variants" value={String(stats.productCount)} colorClass="bg-blue-50 text-blue-600 border border-blue-100/50" />
        <StatCard icon={CheckCircle2} label="Active variants" value={String(stats.active)} colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100/50" />
        <StatCard icon={PackageCheck} label="Low stock variants" value={String(stats.lowStock)} colorClass="bg-rose-50 text-rose-600 border border-rose-100/50" />
      </div>

      <div className={`grid gap-6 ${canShowForm ? "xl:grid-cols-[1fr_420px] items-start" : "max-w-4xl mx-auto"}`}>
        {canShowForm ? (
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card space-y-5">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-[16px] font-black text-slate-800">{editingId ? "Edit variant" : "Create variant"}</h3>
                  <p className="mt-1 text-[12px] text-slate-400">Configure parameters for specific catalog variant groups.</p>
                </div>
                {editingId ? (
                  <button type="button" onClick={() => resetForm(true)} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-[11.5px] font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    <X className="h-3.5 w-3.5" />
                    Cancel edit
                  </button>
                ) : null}
              </div>

              {!editingId ? (
                <div className="grid rounded-xl border border-slate-200 bg-slate-50/50 p-1 sm:grid-cols-2">
                  {[
                    { id: "full", label: "Full product variant", hint: "Creates a linked stand-alone item (custom tabs, descriptions)" },
                    { id: "option", label: "Quick option", hint: "Creates size/color details under the active product" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setVariantMode(item.id as "option" | "full")}
                      className={`rounded-lg px-4 py-2.5 text-left transition-all ${
                        variantMode === item.id
                          ? "bg-white shadow-sm border border-slate-200/80 text-brand-primary"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span className="block text-[13px] font-black">{item.label}</span>
                      <span className="mt-0.5 block text-[10.5px] font-medium leading-normal opacity-85">{item.hint}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="space-y-4">
                <div>
                  <ProductSearchPicker
                    label="Parent Product Group"
                    products={products}
                    value={form.product_id}
                    search={productSearch}
                    open={productPickerOpen}
                    onSearchChange={setProductSearch}
                    onOpenChange={setProductPickerOpen}
                    onSelect={onChangeProduct}
                    onClear={clearProductSelection}
                  />
                  {selectedProduct ? (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 shadow-soft">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-black text-slate-850">{selectedProduct.title}</p>
                        <p className="mt-0.5 text-[11.5px] text-slate-400">Base details: {money(selectedProduct.sale_price || 0)} / MRP {money(selectedProduct.mrp || 0)}</p>
                      </div>
                      <Link className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-soft" href={`/products/${selectedProduct.id}`} target="_blank">
                        Open Group
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Presets Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="h-4.5 w-4.5 text-brand-primary animate-pulse" />
                <h4 className="text-[13px] font-black uppercase tracking-wider text-slate-700">Quick Attribute Presets</h4>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {presets.map((preset) => {
                  const isActive = form.size === preset.size && form.fabric === preset.fabric && form.pack === preset.pack;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 shadow-soft ${
                        isActive
                          ? "border-brand-primary bg-brand-primary/5 text-brand-primary ring-1 ring-brand-primary/20"
                          : "border-slate-200 bg-white hover:border-brand-primary/30 hover:bg-brand-primary/[0.01]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12.5px] font-black text-slate-800">{preset.label}</span>
                        {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-brand-primary shrink-0" />}
                      </div>
                      <span className="mt-1 block text-[10.5px] font-bold text-slate-400 truncate">
                        {preset.size} / {preset.fabric} / {preset.pack}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Attributes Details Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Layers className="h-4.5 w-4.5 text-brand-primary" />
                <h4 className="text-[13px] font-black uppercase tracking-wider text-slate-700">Core Attributes</h4>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {(["size", "color", "fabric", "pack", "gsm", "dimensions"] as const).map((key) => (
                  <label key={key} className={key === "dimensions" ? "md:col-span-2" : ""}>
                    <span className="mb-1.5 block text-[12.5px] font-bold text-slate-600">{fieldLabel(key)}</span>
                    <input
                      value={form[key]}
                      onChange={(e) => updateField(key, e.target.value)}
                      placeholder={key === "size" ? "King, Queen, Bath, 3 Seater" : key === "color" ? "Blue, White, Multicolor" : fieldLabel(key)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Pricing & Stock Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Coins className="h-4.5 w-4.5 text-brand-primary" />
                <h4 className="text-[13px] font-black uppercase tracking-wider text-slate-700">Pricing & Inventory</h4>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <label>
                  <span className="mb-1.5 block text-[12px] font-bold text-slate-600">MRP</span>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-[13px] font-extrabold text-slate-400 select-none">₹</span>
                    <input
                      required
                      type="number"
                      min="1"
                      value={form.mrp}
                      onChange={(e) => updateField("mrp", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-[32px] pr-3.5 py-2.5 text-[13px] font-semibold text-slate-800 outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                    />
                  </div>
                </label>
                <label>
                  <span className="mb-1.5 block text-[12px] font-bold text-slate-600">Sale Price</span>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-[13px] font-extrabold text-slate-400 select-none">₹</span>
                    <input
                      required
                      type="number"
                      min="1"
                      value={form.sale_price}
                      onChange={(e) => updateField("sale_price", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-[32px] pr-3.5 py-2.5 text-[13px] font-semibold text-slate-800 outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                    />
                  </div>
                </label>
                <label>
                  <span className="mb-1.5 block text-[12px] font-bold text-slate-600">Stock Units</span>
                  <div className="relative flex items-center">
                    <Boxes className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="number"
                      min="0"
                      value={form.quantity_available}
                      onChange={(e) => updateField("quantity_available", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-[38px] pr-3.5 py-2.5 text-[13px] font-semibold text-slate-800 outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* Media & SKU Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ImagePlus className="h-4.5 w-4.5 text-brand-primary" />
                <h4 className="text-[13px] font-black uppercase tracking-wider text-slate-700">Media & Identification</h4>
              </div>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[1fr,auto] sm:items-end">
                  <label className="flex-1">
                    <span className="mb-1.5 block text-[12.5px] font-bold text-slate-600">Variant Image URL</span>
                    <div className="relative flex items-center">
                      <ImagePlus className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        value={form.image_url}
                        onChange={(e) => updateField("image_url", e.target.value)}
                        placeholder="Paste media link or click upload"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-[38px] pr-3.5 py-2.5 text-[13px] font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                      />
                    </div>
                  </label>
                  <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[12.5px] font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-soft select-none active:scale-95">
                    <Upload className="h-4 w-4 text-slate-400" />
                    {uploading ? "Uploading..." : "Upload File"}
                    <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      e.currentTarget.value = "";
                      uploadVariantImage(file);
                    }} />
                  </label>
                </div>

                {variantMode === "full" && !editingId ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/20 p-4">
                    <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Variant Gallery Images (1-10)</p>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="grid grid-cols-[44px,1fr] gap-2 rounded-xl border border-slate-200 bg-white p-2">
                          <div className="h-11 w-11 overflow-hidden rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                            {url ? (
                              <img src={url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="text-slate-400"><ImagePlus className="h-4.5 w-4.5" /></div>
                            )}
                          </div>
                          <input
                            value={url}
                            onChange={(e) => setImageUrls((current) => current.map((item, itemIndex) => itemIndex === index ? e.target.value : item))}
                            placeholder={`Image ${index + 1} URL`}
                            className="min-w-0 rounded-lg border border-slate-250 bg-white px-2 py-1 text-[12px] font-semibold outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-1.5 block text-[12.5px] font-bold text-slate-600">
                      {variantMode === "full" ? "Variant Product Title" : "Display Title Override"}
                    </span>
                    <div className="relative flex items-center">
                      <Edit3 className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        value={form.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        placeholder={variantMode === "full" ? "Blue King Bedsheet Set" : "Auto: Size / Color / Fabric / Pack"}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-[38px] pr-3.5 py-2.5 text-[13px] font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                      />
                    </div>
                  </label>

                  {variantMode === "full" && !editingId ? (
                    <label>
                      <span className="mb-1.5 block text-[12.5px] font-bold text-slate-600">Variant Short Name</span>
                      <div className="relative flex items-center">
                        <Tag className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          value={variantShortName}
                          onChange={(e) => setVariantShortName(e.target.value)}
                          placeholder="Blue / King / Floral"
                          className="w-full rounded-xl border border-slate-200 bg-white pl-[38px] pr-3.5 py-2.5 text-[13px] font-semibold text-slate-800 outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        />
                      </div>
                    </label>
                  ) : null}

                  <label className={variantMode === "full" && !editingId ? "" : "md:col-span-2"}>
                    <span className="mb-1.5 block text-[12.5px] font-bold text-slate-600">Custom SKU Code</span>
                    <div className="relative flex items-center">
                      <Tag className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        value={form.sku}
                        onChange={(e) => updateField("sku", e.target.value)}
                        placeholder="Leave blank to generate SKU automatically"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-[38px] pr-3.5 py-2.5 text-[13px] font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                      />
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Catalog settings (Slug, Categories, collections) - only shown when creating full product variant */}
            {variantMode === "full" && !editingId ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FolderTree className="h-4.5 w-4.5 text-brand-primary" />
                  <h4 className="text-[13px] font-black uppercase tracking-wider text-slate-700">Storefront & Catalog Settings</h4>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-1.5 block text-[12.5px] font-bold text-slate-600">Slug URL (Optional)</span>
                    <div className="relative flex items-center">
                      <Tag className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="auto-generated-url-path"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-[38px] pr-3.5 py-2.5 text-[13px] font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                      />
                    </div>
                  </label>

                  <label>
                    <span className="mb-1.5 block text-[12.5px] font-bold text-slate-600">Category Tag</span>
                    <div className="relative">
                      <FolderTree className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-[38px] pr-10 py-2.5 text-[13px] font-semibold text-slate-800 outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 appearance-none cursor-pointer"
                      >
                        <option value="">No category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[12.5px] font-bold text-slate-600">Short Storefront Description</span>
                  <div className="relative flex items-start">
                    <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <textarea
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      rows={3}
                      placeholder="Short summary displayed directly on the storefront variant details"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-[38px] pr-3.5 py-2.5 text-[13px] font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                    />
                  </div>
                </label>

                <div>
                  <p className="mb-2 text-[12px] font-bold text-slate-600">Collections Association</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {collections.map((collection) => {
                      const checked = collectionIds.includes(collection.id);
                      return (
                        <label key={collection.id} className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[12px] font-bold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-soft ${
                          checked
                            ? "border-brand-primary bg-brand-primary/5 text-brand-primary ring-1 ring-brand-primary/15"
                            : "border-slate-200 bg-white text-slate-700 hover:border-brand-primary/20"
                        }`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => setCollectionIds((current) => e.target.checked ? [...current, collection.id] : current.filter((id) => id !== collection.id))}
                            className="accent-brand-primary h-4 w-4 rounded cursor-pointer"
                          />
                          <span className="truncate">{collection.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Tabs panel */}
                <div className="grid gap-3 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12.5px] font-bold text-slate-650">Detailed Specification Tabs</p>
                    <button type="button" onClick={addDetailTab} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-primary px-3 text-[11px] font-black text-white hover:bg-brand-secondary transition-all shadow-soft active:scale-95">
                      <Plus className="h-3.5 w-3.5" />
                      Add Tab
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2" style={{ scrollbarWidth: "none" }}>
                    {detailTabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveDetailTabId(tab.id)}
                        className={`shrink-0 rounded-lg px-3 py-1.5 text-[11.5px] font-black transition-all ${
                          activeDetailTabId === tab.id
                            ? "bg-brand-primary text-white shadow-soft"
                            : "bg-white text-slate-500 hover:text-slate-800 border border-slate-200"
                        }`}
                      >
                        {tab.label || "Untitled"}
                      </button>
                    ))}
                  </div>
                  {activeDetailTab ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3.5 shadow-soft">
                      <div className="grid gap-2 sm:grid-cols-[1fr,auto]">
                        <input
                          value={activeDetailTab.label}
                          onChange={(e) => setDetailTabs((current) => current.map((tab) => tab.id === activeDetailTab.id ? { ...tab, label: e.target.value } : tab))}
                          placeholder="Tab Heading (e.g. Care Instructions)"
                          className="h-9.5 rounded-lg border border-slate-200 px-3 text-[12px] font-semibold text-slate-800 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                        />
                        <button
                          type="button"
                          onClick={() => removeDetailTab(activeDetailTab.id)}
                          className="inline-flex h-9.5 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 text-[11px] font-black text-rose-700 hover:bg-rose-100 transition-all active:scale-95"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete Tab
                        </button>
                      </div>
                      <textarea
                        value={activeDetailTab.value}
                        onChange={(e) => setDetailTabs((current) => current.map((tab) => tab.id === activeDetailTab.id ? { ...tab, value: e.target.value } : tab))}
                        rows={4}
                        placeholder="Write dynamic content, instructions, or tables..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-800 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Chip ideas card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="h-4.5 w-4.5 text-brand-primary" />
                <h4 className="text-[13px] font-black uppercase tracking-wider text-slate-700">Quick Idea Chip Pools</h4>
              </div>
              <div className="space-y-4">
                <ChipGroup label="Size ideas" items={sizeOptions} onPick={(value) => updateField("size", value)} onAdd={(value) => addOption(setSizeOptions, value)} onRemove={(value) => removeOption(setSizeOptions, value)} />
                <ChipGroup label="Color ideas" items={colorOptions} onPick={(value) => updateField("color", value)} onAdd={(value) => addOption(setColorOptions, value)} onRemove={(value) => removeOption(setColorOptions, value)} />
                <ChipGroup label="Fabric ideas" items={fabricOptions} onPick={(value) => updateField("fabric", value)} onAdd={(value) => addOption(setFabricOptions, value)} onRemove={(value) => removeOption(setFabricOptions, value)} />
                <ChipGroup label="Pack ideas" items={packOptions} onPick={(value) => updateField("pack", value)} onAdd={(value) => addOption(setPackOptions, value)} onRemove={(value) => removeOption(setPackOptions, value)} />
              </div>
            </div>

            {/* Footer submission controls */}
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center justify-between rounded-xl border border-slate-150 bg-slate-50/50 px-4 py-3 w-full sm:w-auto gap-4">
                <span className="text-[12.5px] font-bold text-slate-700">Storefront Status</span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => updateField("is_active", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary"></div>
                  <span className="ml-2.5 text-[12px] font-black text-slate-600 peer-checked:text-brand-primary select-none">
                    {form.is_active ? "Active" : "Hidden"}
                  </span>
                </label>
              </div>
              <button disabled={saving} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-[13px] font-black text-white shadow-soft hover:bg-brand-secondary disabled:opacity-60 transition-all hover:shadow-md active:scale-[0.98]">
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {saving ? "Saving..." : editingId ? "Update variant" : variantMode === "full" ? "Create product variant" : "Create option variant"}
              </button>
            </div>
          </form>
        ) : null}

        <div className="space-y-6">
          {/* Storefront preview card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-[15px] font-black text-slate-800">Storefront preview</h3>
                <p className="mt-0.5 text-[11px] text-slate-400">This is how customers view options on the storefront.</p>
              </div>
            </div>
            
            <div className="overflow-hidden rounded-2xl border border-slate-200/85 bg-white shadow-soft hover:shadow-card transition-all duration-300 group">
              <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden border-b border-slate-100">
                {previewImage ? (
                  <img src={previewImage} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-slate-400 bg-slate-100/50">
                    <ImagePlus className="h-8 w-8 text-slate-300 animate-pulse" />
                    <p className="mt-2 text-[11.5px] font-bold text-slate-400">Variant Image Preview</p>
                  </div>
                )}
                
                {/* Save / Favorite bubble */}
                <button type="button" className="absolute top-3.5 left-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-soft text-slate-400 hover:text-rose-500 hover:bg-white transition-all select-none">
                  <Heart className="h-4.5 w-4.5 fill-current" />
                </button>

                {previewDiscount > 0 ? (
                  <span className="absolute top-3.5 right-3.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-[10.5px] font-black tracking-wider uppercase shadow-soft">
                    {previewDiscount}% Off
                  </span>
                ) : null}
              </div>

              <div className="p-4.5 space-y-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                    <span className="text-[10.5px] font-bold text-slate-500 ml-0.5">4.8 (128 Reviews)</span>
                  </div>

                  <p className="line-clamp-1 text-[14.5px] font-black text-slate-800 leading-snug">
                    {variantMode === "full" && form.title ? form.title : selectedProduct?.title || "Select product from menu"}
                  </p>
                  <p className="text-[11.5px] font-semibold text-slate-400 truncate">{previewTitle}</p>
                </div>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-xl font-black text-slate-800">{money(form.sale_price || 0)}</span>
                  <span className="text-xs.5 font-bold text-slate-400 line-through">{money(form.mrp || 0)}</span>
                </div>

                {/* Simulated Stock Beacon */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      !form.is_active ? "bg-slate-400" : Number(form.quantity_available || 0) <= 0 ? "bg-rose-400" : Number(form.quantity_available || 0) <= 5 ? "bg-amber-400" : "bg-emerald-400"
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      !form.is_active ? "bg-slate-500" : Number(form.quantity_available || 0) <= 0 ? "bg-rose-500" : Number(form.quantity_available || 0) <= 5 ? "bg-amber-500" : "bg-emerald-500"
                    }`}></span>
                  </span>
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    {!form.is_active ? "Hidden on store" : Number(form.quantity_available || 0) <= 0 ? "Out of stock" : Number(form.quantity_available || 0) <= 5 ? `Only ${form.quantity_available} units left!` : "In stock (ready to dispatch)"}
                  </span>
                </div>

                {/* Simulated dynamic colors pills */}
                {form.color.trim() && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider">Colors:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {previewColors.map((colorName) => {
                        const isChosen = colorName.toLowerCase().trim() === form.color.toLowerCase().trim();
                        return (
                          <div
                            key={colorName}
                            title={colorName}
                            className={`h-5 w-5 rounded-full cursor-pointer flex items-center justify-center transition-all ${
                              isChosen ? "ring-2 ring-brand-primary ring-offset-2 scale-110 shadow-sm" : "hover:scale-105"
                            } ${colorBubbleClass(colorName)}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Simulated dynamic sizes pills */}
                {form.size.trim() && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider">Sizes:</span>
                    <div className="flex flex-wrap gap-1">
                      {previewSizes.map((sizeName) => {
                        const isChosen = sizeName.toLowerCase().trim() === form.size.toLowerCase().trim();
                        return (
                          <span
                            key={sizeName}
                            className={`rounded-lg border px-2 py-1 text-[10.5px] font-extrabold cursor-pointer transition-all select-none ${
                              isChosen
                                ? "bg-brand-primary border-brand-primary text-white shadow-soft"
                                : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                            }`}
                          >
                            {sizeName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {Object.entries(buildAttributes(form)).filter(([, value]) => value).map(([key, value]) => (
                    <span key={key} className="rounded-lg bg-slate-50 border border-slate-200/80 px-2 py-0.5 text-[9.5px] font-black text-slate-600 uppercase tracking-wider">
                      {fieldLabel(key as keyof VariantAttributes)}: {value}
                    </span>
                  ))}
                </div>

                {/* Buy simulated CTAs */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button type="button" className="w-full h-9.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-[12px] flex items-center justify-center gap-1.5 hover:bg-slate-100 hover:border-slate-300 transition-all select-none">
                    <ShoppingCart className="h-3.5 w-3.5 text-slate-500" />
                    Add to Cart
                  </button>
                  <button type="button" className="w-full h-9.5 rounded-xl bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-black text-[12px] flex items-center justify-center hover:opacity-95 transition-all shadow-soft active:scale-95 select-none">
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Variant inventory block */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-[15px] font-black text-slate-800">Variant Inventory Ledger</h3>
                <p className="mt-0.5 text-[11.5px] text-slate-400">
                  {filteredVariants.length} variants found · showing {pageStart}-{pageEnd}
                </p>
              </div>
              <div className="relative rounded-xl border border-slate-250 bg-white focus-within:border-brand-primary focus-within:ring-4 focus-within:ring-brand-primary/10 transition-all sm:w-60">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search variant catalog..." className="h-9.5 w-full bg-transparent pl-9 pr-3 text-[12.5px] font-semibold text-slate-800 placeholder:text-slate-400 outline-none" />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr,auto] sm:items-end">
              <ProductSearchPicker
                label="Filter variants by parent group"
                products={products}
                value={selectedProductId}
                search={filterProductSearch}
                open={filterProductPickerOpen}
                onSearchChange={setFilterProductSearch}
                onOpenChange={setFilterProductPickerOpen}
                onSelect={setSelectedProductId}
                onClear={() => setSelectedProductId("")}
              />
              {selectedProductId ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductId("");
                    setFilterProductSearch("");
                  }}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[12px] font-black text-slate-700 hover:bg-slate-50 transition-all shadow-soft active:scale-95"
                >
                  Show All Products
                </button>
              ) : null}
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/50">
              {loading ? (
                <div className="p-6 text-center text-sm font-semibold text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="h-4.5 w-4.5 animate-spin text-brand-primary" />
                  Loading variant registry...
                </div>
              ) : filteredVariants.length === 0 ? (
                <div className="p-6 text-center text-sm font-semibold text-slate-400">No active variants found in selected filters.</div>
              ) : (
                <div className="grid gap-3 p-3">
                  {paginatedVariants.map((variant) => {
                    const stock = Number(variant.quantity_available || 0);
                    const off = discountPercent(variant.mrp, variant.sale_price);
                    return (
                      <div key={variant.id} className={`overflow-hidden rounded-2xl border bg-white shadow-soft hover:shadow-card hover:border-slate-350 transition-all duration-200 flex flex-col ${
                        variant.is_active ? "border-slate-200/80 border-l-4 border-l-brand-primary" : "border-slate-200/80 border-l-4 border-l-slate-300"
                      }`}>
                        <div className="p-4 flex gap-4 min-w-0">
                          <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-slate-50 border border-slate-100 shadow-soft">
                            {variant.image_url ? (
                              <img src={variant.image_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400 bg-slate-100"><Boxes className="h-6 w-6" /></div>
                            )}
                          </div>
                          
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {variant.is_active ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-250/30 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                  </span>
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200/35 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                                  Hidden
                                </span>
                              )}
                              {off > 0 ? (
                                <span className="rounded-full bg-emerald-50 border border-emerald-200/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600">
                                  {off}% OFF
                                </span>
                              ) : null}
                              {stock <= 5 ? (
                                <span className="rounded-full bg-rose-50 border border-rose-200/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-600">
                                  Low Stock
                                </span>
                              ) : null}
                            </div>
                            
                            <p className="font-black text-slate-800 text-[13.5px] leading-snug line-clamp-1" title={variant.product_title}>{variant.product_title}</p>
                            <p className="text-xs font-semibold text-slate-500 truncate" title={variant.title || variant.sku}>{variant.title || "Default Option"}</p>
                            
                            <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1">
                              <span className="text-[10.5px] font-bold text-slate-600 bg-slate-50 border border-slate-100 rounded-md px-2 py-0.5">
                                Sale: <span className="font-extrabold text-slate-800">{money(variant.sale_price)}</span>
                              </span>
                              <span className="text-[10.5px] font-bold text-slate-400 bg-slate-50/50 border border-slate-100/50 rounded-md px-2 py-0.5">
                                MRP: <span className="line-through">{money(variant.mrp)}</span>
                              </span>
                              <span className={`text-[10.5px] font-bold rounded-md px-2 py-0.5 ${stock <= 5 ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-slate-50 text-slate-600 border border-slate-100"}`}>
                                Stock: <span className="font-extrabold">{stock}</span>
                              </span>
                            </div>
                            
                            {variant.sku && (
                              <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest pt-1">SKU: {variant.sku}</p>
                            )}

                            {Object.values(variant.attributes || {}).some(Boolean) && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {Object.entries(variant.attributes || {}).filter(([, value]) => value).map(([key, value]) => (
                                  <span key={key} className="rounded-lg bg-brand-primary/[0.03] border border-brand-primary/10 px-2 py-0.5 text-[9px] font-black text-brand-primary uppercase tracking-wider">
                                    {fieldLabel(key as keyof VariantAttributes)}: {String(value)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {can("variants.edit") || can("variants.delete") ? (
                          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 bg-slate-50/50 p-2.5">
                            {can("variants.edit") && (
                              <button
                                type="button"
                                onClick={() => onEdit(variant)}
                                className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11.5px] font-bold text-slate-700 hover:bg-brand-primary/[0.03] hover:text-brand-primary hover:border-brand-primary/30 transition-all shadow-soft focus:outline-none active:scale-[0.98]"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                Edit
                              </button>
                            )}
                            {can("variants.edit") && (
                              <button
                                type="button"
                                onClick={() => duplicateVariant(variant)}
                                className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11.5px] font-bold text-slate-700 hover:bg-brand-primary/[0.03] hover:text-brand-primary hover:border-brand-primary/30 transition-all shadow-soft focus:outline-none active:scale-[0.98]"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                Copy
                              </button>
                            )}
                            {can("variants.delete") && (
                              <button
                                type="button"
                                onClick={() => onDelete(variant.id)}
                                className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-xl border border-rose-250 bg-white px-3 text-[11.5px] font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-all shadow-soft focus:outline-none active:scale-[0.98]"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {filteredVariants.length > pageSize ? (
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[12px] font-bold text-slate-400">
                  Page {page} of {totalPages} · {pageSize} items per page
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-black text-slate-700 hover:bg-slate-50 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page >= totalPages}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-black text-slate-700 hover:bg-slate-50 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
