"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  CheckSquare, 
  Edit3, 
  LayoutGrid, 
  Plus, 
  Search, 
  Square, 
  Trash2, 
  X, 
  Loader2, 
  ArrowRight,
  FolderOpen,
  Sparkles,
  Layers,
  FileText
} from "lucide-react";
import { useSiteContext, withSiteId } from "@/lib/site-context";
import { useAdminPermissions } from "@/lib/use-admin-permissions";

type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order?: number;
  products: string[];
};

type StoreProduct = {
  slug: string;
  title: string;
  image_url: string | null;
};

export default function CollectionsPage() {
  const { can } = useAdminPermissions();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const activeSiteId = useSiteContext((s) => s.activeSiteId);

  async function loadCollections() {
    try {
      const res = await fetch(withSiteId("/api/admin/collections?products=1", activeSiteId));
      const data = await res.json();
      setCollections(data.collections ?? []);
    } catch {
      // Ignore
    }
  }

  async function loadProducts() {
    try {
      const res = await fetch(withSiteId("/api/admin/products", activeSiteId));
      const data = await res.json();
      setProducts(Array.isArray(data) ? data.map((p: any) => ({ slug: p.slug, title: p.title, image_url: p.image_url })) : []);
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    Promise.all([loadCollections(), loadProducts()]).finally(() => setLoading(false));
  }, [activeSiteId]);

  async function handleCreate() {
    if (!name.trim()) { 
      setMessage({ text: "Collection name is required", type: "error" }); 
      return; 
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(withSiteId("/api/admin/collections", activeSiteId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null, products: selectedSlugs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create collection");
      setMessage({ text: `Collection "${name.trim()}" created successfully!`, type: "success" });
      setName(""); 
      setDescription(""); 
      setSelectedSlugs([]); 
      setShowCreate(false);
      await loadCollections();
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to create collection",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this collection? This action cannot be undone.")) return;
    try {
      await fetch(withSiteId(`/api/admin/collections?id=${id}`, activeSiteId), { method: "DELETE" });
      setMessage({ text: "Collection deleted successfully", type: "success" });
      await loadCollections();
    } catch {
      setMessage({ text: "Failed to delete collection", type: "error" });
    }
  }

  function toggleProduct(slug: string) {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  function selectAllFiltered() {
    const filteredSlugs = filteredProducts.map((p) => p.slug);
    setSelectedSlugs((prev) => Array.from(new Set([...prev, ...filteredSlugs])));
  }

  function clearFilteredSelection() {
    const filteredSlugSet = new Set(filteredProducts.map((p) => p.slug));
    setSelectedSlugs((prev) => prev.filter((slug) => !filteredSlugSet.has(slug)));
  }

  function clearAllSelection() {
    setSelectedSlugs([]);
  }

  const normalizedSearch = productSearch.trim().toLowerCase();
  const filteredProducts = products.filter((p) => {
    if (!normalizedSearch) return true;
    return (
      p.title.toLowerCase().includes(normalizedSearch) ||
      p.slug.toLowerCase().includes(normalizedSearch)
    );
  });
  const selectedProducts = products.filter((p) => selectedSlugs.includes(p.slug));
  const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedSlugs.includes(p.slug));

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-[13px] font-medium text-[#6d7175]">Loading collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-1">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white border border-[#e1e3e5] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/5 text-brand-primary">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#202223] tracking-tight">Collections</h2>
            <p className="mt-0.5 text-[12px] font-medium text-[#6d7175]">
              {collections.length} active collection{collections.length !== 1 ? "s" : ""} to organize products
            </p>
          </div>
        </div>
        
        {can("collections.create") ? <button
          onClick={() => {
            setShowCreate(!showCreate);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4.5 py-2.5 text-[13px] font-bold text-white shadow-[0_1px_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.2)] transition-all hover:bg-brand-secondary active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Collection
        </button> : null}
      </div>

      {/* Message Notifications */}
      {message && (
        <div
          className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 text-[13px] font-medium shadow-sm transition-all duration-200 ${
            message.type === "success"
              ? "border-[#b6d3b2] bg-[#e3f1df] text-[#1a5e1a]"
              : "border-[#e0b3b3] bg-[#fdf0f0] text-[#d72c0d]"
          }`}
        >
          {message.type === "success" ? (
            <FolderOpen className="h-4 w-4 shrink-0" />
          ) : (
            <X className="h-4 w-4 shrink-0" />
          )}
          <span>{message.text}</span>
          <button 
            onClick={() => setMessage(null)} 
            className="ml-auto flex h-6 w-6 items-center justify-center rounded-md hover:bg-black/5 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Create Collection Card */}
      {showCreate && can("collections.create") && (
        <div className="rounded-xl border border-[#e1e3e5] bg-white shadow-md transition-all duration-300">
          <div className="border-b border-[#e1e3e5] px-5 py-4 flex items-center justify-between bg-[#fafbfc] rounded-t-xl">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4.5 w-4.5 text-brand-primary" />
              <h3 className="text-[15px] font-bold text-[#202223]">New Collection Details</h3>
            </div>
            <button 
              onClick={() => setShowCreate(false)} 
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6d7175] border border-transparent transition-colors hover:bg-black/5 hover:text-[#202223]"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="p-6 grid gap-6 md:grid-cols-12">
            {/* Info form (Left side) */}
            <div className="space-y-5 md:col-span-6 lg:col-span-5">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#202223]">
                  Collection Name <span className="text-[#d72c0d]">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer Collection"
                  className="w-full rounded-lg border border-[#d6d9dc] px-3.5 py-2.5 text-[14px] text-[#202223] placeholder:text-[#c9cccf] transition-all focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 hover:border-[#8c9196]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#202223]">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Tell customers what these products have in common..."
                  className="w-full rounded-lg border border-[#d6d9dc] px-3.5 py-2.5 text-[14px] text-[#202223] placeholder:text-[#c9cccf] transition-all focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 hover:border-[#8c9196] resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary py-2.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-brand-secondary active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? "Creating Collection..." : "Create Collection"}
                </button>
              </div>
            </div>

            {/* Product Selector (Right side) */}
            <div className="md:col-span-6 lg:col-span-7 border-t border-[#e1e3e5] pt-6 md:border-t-0 md:pt-0 md:border-l md:pl-6 space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-semibold text-[#202223]">
                  Assign Products ({selectedSlugs.length} selected)
                </span>
                <span className="text-[11px] font-medium text-[#8c9196]">
                  Search and check products to add them to this new collection
                </span>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-2.5 rounded-lg border border-[#d6d9dc] bg-[#f6f6f7] px-3.5 py-2.5 transition-all focus-within:border-brand-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-primary/10">
                <Search className="h-4 w-4 text-[#8c9196]" />
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products by title or slug..."
                  className="w-full border-0 bg-transparent text-[13px] text-[#202223] placeholder:text-[#b5b5b5] focus:outline-none"
                />
              </div>

              {/* Selection helper controls */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={allFilteredSelected ? clearFilteredSelection : selectAllFiltered}
                  disabled={filteredProducts.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#d6d9dc] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#202223] shadow-sm transition-all hover:bg-[#f6f6f7] active:scale-95 disabled:opacity-50"
                >
                  {allFilteredSelected ? <CheckSquare className="h-3.5 w-3.5 text-brand-primary" /> : <Square className="h-3.5 w-3.5" />}
                  {allFilteredSelected ? "Deselect matching" : "Select matching"}
                </button>
                <button
                  type="button"
                  onClick={clearAllSelection}
                  disabled={selectedSlugs.length === 0}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#d6d9dc] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#202223] shadow-sm transition-all hover:bg-[#f6f6f7] active:scale-95 disabled:opacity-50"
                >
                  Clear Selection
                </button>
              </div>

              {/* Selected Tag View */}
              {selectedProducts.length > 0 && (
                <div className="max-h-24 overflow-y-auto rounded-lg border border-brand-primary/20 bg-brand-primary/5 p-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProducts.slice(0, 12).map((p) => (
                      <span key={p.slug} className="inline-flex items-center gap-1 rounded-full border border-brand-primary/20 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-brand-primary">
                        <span className="max-w-[120px] truncate">{p.title}</span>
                        <button type="button" onClick={() => toggleProduct(p.slug)} className="rounded-full p-0.5 hover:bg-brand-primary/10">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                    {selectedProducts.length > 12 && (
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#6d7175] border border-[#e1e3e5]">
                        +{selectedProducts.length - 12} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Product Catalog Checklist */}
              <div className="max-h-60 overflow-y-auto rounded-xl border border-[#e1e3e5] divide-y divide-[#f1f2f3] hide-scrollbar bg-[#fafbfc]">
                {filteredProducts.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[12px] font-medium text-[#8c9196]">
                    {productSearch ? "No matching products found" : "No products available in catalog"}
                  </div>
                ) : (
                  filteredProducts.map((p) => (
                    <label
                      key={p.slug}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-all hover:bg-[#f3fbf8] ${
                        selectedSlugs.includes(p.slug) ? "bg-[#ecf8f3]/80" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSlugs.includes(p.slug)}
                        onChange={() => toggleProduct(p.slug)}
                        className="h-4 w-4 shrink-0 rounded border-[#d6d9dc] text-brand-primary focus:ring-brand-primary/20 accent-brand-primary"
                      />
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#e1e3e5] bg-white">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[8px] font-bold text-[#b5b5b5] bg-[#f6f6f7]">
                            IMG
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-bold text-[#202223]">{p.title}</p>
                        <p className="truncate text-[10px] text-[#8c9196] mt-0.5">/{p.slug}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collections list / Grid Layout */}
      {collections.length === 0 ? (
        <div className="rounded-xl border border-[#e1e3e5] bg-white py-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f6f6f7] text-[#c9cccf] mb-4">
            <LayoutGrid className="h-7 w-7" />
          </div>
          <h3 className="text-[15px] font-bold text-[#202223]">No collections yet</h3>
          <p className="mt-1 text-[13px] text-[#6d7175] max-w-sm mx-auto px-4">
            Create your first collection to group and organize products on your storefront.
          </p>
          {can("collections.create") ? <button
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-[12px] font-bold text-white shadow-sm hover:bg-brand-secondary transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Collection
          </button> : null}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <div 
              key={col.id} 
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#e1e3e5] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-[#8c9196] transition-all duration-200"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold text-[#202223] truncate group-hover:text-brand-primary transition-colors">
                      {col.name}
                    </h3>
                    <p className="mt-0.5 text-[11px] font-medium text-[#8c9196] truncate">
                      /{col.slug}
                    </p>
                  </div>
                  
                  {/* Action Buttons (Visible always on desktop in premium way, or cleaner inline design) */}
                  {(can("collections.edit") || can("collections.delete")) ? <div className="flex items-center gap-1 shrink-0">
                    {can("collections.edit") ? <Link
                      href={`/collections/${col.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6d7175] border border-[#e1e3e5] bg-white transition-all hover:bg-brand-primary/5 hover:text-brand-primary hover:border-brand-primary/20 active:scale-90"
                      title="Edit Collection"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Link> : null}
                    {can("collections.delete") ? <button
                      onClick={() => handleDelete(col.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6d7175] border border-[#e1e3e5] bg-white transition-all hover:bg-[#fdf0f0] hover:text-[#d72c0d] hover:border-[#fcd9d9] active:scale-90"
                      title="Delete Collection"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button> : null}
                  </div> : null}
                </div>

                {col.description ? (
                  <p className="mt-3.5 text-[12.5px] text-[#6d7175] line-clamp-2 leading-relaxed">
                    {col.description}
                  </p>
                ) : (
                  <p className="mt-3.5 text-[12px] italic text-[#b5b5b5]">
                    No description added
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3.5 border-t border-[#f1f2f3] flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-[10.5px] font-bold text-brand-primary border border-brand-primary/20">
                  {col.products.length} product{col.products.length !== 1 ? "s" : ""}
                </span>
                
                {can("collections.edit") ? <Link
                  href={`/collections/${col.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-primary hover:underline"
                >
                  Manage items
                  <ArrowRight className="h-3 w-3" />
                </Link> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
