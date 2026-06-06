"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckSquare,
  Loader2,
  Minus,
  Save,
  Search,
  Square,
  X,
  Layers,
  Image as ImageIcon,
  ImagePlus,
  Eye,
  Sliders,
  Sparkles,
  ClipboardList
} from "lucide-react";
import { useEffect, useState } from "react";
import { withSiteId } from "@/lib/site-context";
import { useAdminPermissions } from "@/lib/use-admin-permissions";

type StoreProduct = {
  slug: string;
  title: string;
  image_url: string | null;
  sale_price?: string | null;
};

type CollectionDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  products: string[];
};

export default function CollectionEditPage() {
  const { can } = useAdminPermissions();
  const { id } = useParams<{ id: string }>();

  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Product assignment
  const [allProducts, setAllProducts] = useState<StoreProduct[]>([]);
  const [assignedSlugs, setAssignedSlugs] = useState<string[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");

  async function loadCollection() {
    setLoading(true);
    try {
      const res = await fetch(withSiteId(`/api/admin/collections?id=${id}`));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setCollection(data);
      setName(data.name || "");
      setDescription(data.description || "");
      setImageUrl(data.image_url || "");
      setIsActive(data.is_active ?? true);
      setAssignedSlugs(data.products || []);
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to load collection",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const res = await fetch(withSiteId("/api/admin/products"));
      const data = await res.json();
      setAllProducts(
        Array.isArray(data)
          ? data.map((p: StoreProduct) => ({
              slug: p.slug,
              title: p.title,
              image_url: p.image_url,
              sale_price: (p as any).sale_price,
            }))
          : [],
      );
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    loadCollection();
    loadProducts();
  }, [id]);

  function removeProduct(slug: string) {
    setAssignedSlugs((prev) => prev.filter((s) => s !== slug));
    setSelectedToAdd((prev) => prev.filter((s) => s !== slug));
  }

  function toggleSelectToAdd(slug: string) {
    setSelectedToAdd((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  function addSelectedProducts() {
    if (selectedToAdd.length === 0) return;
    setAssignedSlugs((prev) => Array.from(new Set([...prev, ...selectedToAdd])));
    setSelectedToAdd([]);
  }

  function selectAllMatching() {
    const allMatching = unassignedProducts.map((p) => p.slug);
    setSelectedToAdd(allMatching);
  }

  function clearSelectedMatching() {
    setSelectedToAdd([]);
  }

  const assignedProducts = allProducts.filter((p) => assignedSlugs.includes(p.slug));
  const unassignedProducts = allProducts.filter(
    (p) =>
      !assignedSlugs.includes(p.slug) &&
      (p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.slug.toLowerCase().includes(productSearch.toLowerCase())),
  );

  async function handleSave() {
    if (!name.trim()) {
      setMessage({ text: "Collection name is required", type: "error" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(withSiteId("/api/admin/collections"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: name.trim(),
          description: description.trim() || null,
          image_url: imageUrl.trim() || null,
          is_active: isActive,
          products: assignedSlugs,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save collection");
      setMessage({ text: "Collection updated successfully!", type: "success" });
      await loadCollection();
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
          <p className="text-[13px] text-[#6d7175]">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-[15px] font-medium text-[#6d7175]">Collection not found</p>
        <Link
          href="/collections"
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-secondary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Collections
        </Link>
      </div>
    );
  }

  const allMatchingSelected = unassignedProducts.length > 0 && unassignedProducts.every((p) => selectedToAdd.includes(p.slug));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 w-full overflow-hidden">
      {/* Back & Title Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            href="/collections"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#d6d9dc] bg-white text-[#6d7175] transition-all hover:bg-[#f6f6f7] hover:text-[#202223]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-[#202223] truncate">{name || collection.name}</h2>
            <p className="mt-0.5 text-[12px] text-[#8c9196] truncate">
              /{collection.slug}
              {` · ID: ${collection.id}`}
              {` · ${assignedSlugs.length} Product${assignedSlugs.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        {can("collections.edit") ? <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.2)] transition-all hover:bg-brand-secondary disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button> : null}
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`mb-5 flex items-center gap-2 rounded-lg border px-4 py-3 text-[13px] font-medium w-full ${
            message.type === "success"
              ? "border-[#b6d3b2] bg-[#e3f1df] text-[#1a5e1a]"
              : "border-[#e0b3b3] bg-[#fdf0f0] text-[#d72c0d]"
          }`}
        >
          {message.type === "success" ? (
            <Check className="h-4 w-4 shrink-0" />
          ) : (
            <X className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid Layout with w-full and responsive width limits */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px] w-full items-start">
        
        {/* ── LEFT COLUMN: Collection Info & Products Assignment ── */}
        <div className="min-w-0 w-full grid gap-6">
          
          {/* Collection Details Card */}
          <div className="rounded-xl border border-[#e1e3e5] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="border-b border-[#e1e3e5] px-5 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-primary shrink-0" />
                <h3 className="text-[15px] font-semibold text-[#202223]">Collection Details</h3>
              </div>
            </div>
            <div className="p-5 space-y-4 w-full">
              <div>
                <label className="text-[12px] font-medium text-[#6d7175]">Collection Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#d6d9dc] px-3 py-2 text-[13px] text-[#202223] focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors"
                  placeholder="e.g. Cozy Bedroom"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#6d7175]">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-[#d6d9dc] px-3 py-2 text-[13px] text-[#202223] focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors resize-none"
                  placeholder="Describe this collection..."
                />
              </div>
            </div>
          </div>

          {/* Collection Cover Image Card */}
          <div className="rounded-xl border border-[#e1e3e5] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="border-b border-[#e1e3e5] px-5 py-4">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-5 w-5 text-brand-primary shrink-0" />
                <h3 className="text-[15px] font-semibold text-[#202223]">Collection Cover Image</h3>
              </div>
            </div>
            <div className="p-5 space-y-4 w-full">
              <div>
                <label className="text-[12px] font-medium text-[#6d7175]">Image URL</label>
                <div className="mt-1 flex items-center gap-2 w-full">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste cover image URL here..."
                    className="flex-1 rounded-lg border border-[#d6d9dc] px-3 py-2 text-[13px] text-[#202223] focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors min-w-0"
                  />
                  {imageUrl.trim() && (
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#8c9196] border border-[#e1e3e5] hover:bg-[#fdf0f0] hover:text-[#d72c0d] transition-colors"
                      title="Clear image URL"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {imageUrl.trim() ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[#e1e3e5] bg-[#fafbfc] group shadow-sm">
                  <Image
                    src={imageUrl}
                    alt="Collection Cover Preview"
                    fill
                    sizes="(max-width: 768px) 100vw, 800px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/95 text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-md text-[#202223] flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-brand-primary" />
                      Cover Image Preview
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#c9cccf] bg-white text-[#6d7175] transition-all p-6">
                  <ImageIcon className="h-8 w-8 mb-2 text-[#8c9196] shrink-0" />
                  <span className="text-[12px] font-medium text-[#8c9196] text-center">No cover image provided. Paste a URL to see a preview.</span>
                </div>
              )}
            </div>
          </div>

          {/* Products Assignment Card */}
          <div className="rounded-xl border border-[#e1e3e5] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="border-b border-[#e1e3e5] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="h-5 w-5 text-brand-primary shrink-0" />
                <h3 className="text-[15px] font-semibold text-[#202223] truncate">Products in Collection</h3>
                <span className="ml-2 shrink-0 rounded-full bg-[#f3f5f7] px-2.5 py-0.5 text-[11px] font-semibold text-[#6d7175]">
                  {assignedSlugs.length}
                </span>
              </div>
            </div>
            <div className="p-5 space-y-6 w-full">
              {/* Search & Add Section */}
              {can("collections.edit") ? <div className="space-y-3 w-full">
                <span className="text-[12px] font-semibold text-[#6d7175] block">Search & Add Products</span>
                
                <div className="flex items-center gap-2 rounded-lg border border-[#d6d9dc] bg-[#f6f6f7] px-3 py-2 transition-colors focus-within:border-brand-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-primary/20 w-full">
                  <Search className="h-4 w-4 text-[#8c9196] shrink-0" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products by title or slug..."
                    className="flex-1 bg-transparent border-none text-[13px] text-[#202223] placeholder:text-[#8c9196] focus:outline-none w-full min-w-0"
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch("")}
                      className="text-[#8c9196] hover:text-[#202223] p-0.5 rounded-full shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={allMatchingSelected ? clearSelectedMatching : selectAllMatching}
                    disabled={unassignedProducts.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#d6d9dc] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#6d7175] hover:bg-[#f6f6f7] transition-all hover:text-[#202223] active:scale-95 disabled:opacity-50"
                  >
                    {allMatchingSelected ? <CheckSquare className="h-3.5 w-3.5 text-brand-primary shrink-0" /> : <Square className="h-3.5 w-3.5 shrink-0" />}
                    {allMatchingSelected ? "Deselect All" : "Select All Matching"}
                  </button>
                  <button
                    type="button"
                    onClick={addSelectedProducts}
                    disabled={selectedToAdd.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-secondary transition-all active:scale-95 disabled:opacity-50"
                  >
                    Add Selected ({selectedToAdd.length})
                  </button>
                </div>

                {/* Catalog scroll area */}
                <div className="max-h-60 overflow-y-auto rounded-xl border border-[#e1e3e5] divide-y divide-[#f1f2f3] bg-[#fafbfc] w-full">
                  {unassignedProducts.length === 0 ? (
                    <div className="px-4 py-8 text-center text-[12px] font-medium text-[#8c9196]">
                      {productSearch
                        ? "No matching products found in catalog"
                        : "All store products are already assigned to this collection"}
                    </div>
                  ) : (
                    unassignedProducts.map((p) => (
                      <label
                        key={p.slug}
                        className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-[#f3fbf8] ${
                          selectedToAdd.includes(p.slug) ? "bg-[#ecf8f3]/80" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedToAdd.includes(p.slug)}
                          onChange={() => toggleSelectToAdd(p.slug)}
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
                          <p className="truncate text-[12px] font-bold text-[#202223]">
                            {p.title}
                          </p>
                          <p className="truncate text-[10px] text-[#8c9196] mt-0.5">/{p.slug}</p>
                        </div>
                        {p.sale_price && (
                          <span className="text-[11px] font-bold text-[#202223] bg-[#f1f2f3] px-2 py-0.5 rounded border border-[#e1e3e5] shrink-0">
                            ₹{p.sale_price}
                          </span>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </div> : null}

              {/* Assigned products list */}
              {assignedProducts.length > 0 && (
                <div className="space-y-3 pt-5 border-t border-[#f1f2f3] w-full">
                  <span className="text-[12px] font-semibold text-[#6d7175] block">Currently Assigned Products ({assignedProducts.length})</span>
                  
                  <div className="divide-y divide-[#f1f2f3] rounded-xl border border-[#e1e3e5] max-h-96 overflow-y-auto bg-[#fafbfc] w-full">
                    {assignedProducts.map((p, idx) => (
                      <div
                        key={p.slug}
                        className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white"
                      >
                        <span className="w-5 text-center text-[10px] font-bold text-[#8c9196] shrink-0">
                          {idx + 1}
                        </span>
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#e1e3e5] bg-white">
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[8px] font-bold text-[#b5b5b5] bg-[#f6f6f7]">
                              IMG
                            </div>
                          )}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-bold text-[#202223]">
                            {p.title}
                          </p>
                          <p className="truncate text-[10px] text-[#8c9196] mt-0.5">/{p.slug}</p>
                        </div>
                        
                        {p.sale_price && (
                          <span className="text-[11.5px] font-bold text-brand-primary mr-2 shrink-0">
                            ₹{p.sale_price}
                          </span>
                        )}
                        
                        {can("collections.edit") ? <button
                          type="button"
                          onClick={() => removeProduct(p.slug)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8c9196] border border-[#e1e3e5] bg-white transition-all hover:bg-[#fdf0f0] hover:text-[#d72c0d] hover:border-[#fcd9d9] active:scale-90"
                          title="Remove from collection"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button> : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN: Sidebar controls (Status, Summary, Quick Actions) ── */}
        <div className="min-w-0 w-full grid gap-6 self-start">
          
          {/* Collection Status Card */}
          <div className="rounded-xl border border-[#e1e3e5] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[#6d7175]">
              Status
            </h3>
            
            <div className="mt-4 flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isActive ? "bg-brand-primary" : "bg-amber-500"
                }`}
              />
              <span className="text-[14px] font-medium text-[#202223]">
                {isActive ? "Active" : "Draft"}
              </span>
            </div>
            
            <label className="mt-3.5 inline-flex items-center gap-2 text-[13px] text-[#202223] cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-[#c9cccf] text-brand-primary focus:ring-brand-primary/20 accent-brand-primary"
              />
              Collection Active
            </label>
            
            <p className="mt-2 text-[11.5px] text-[#8c9196] leading-snug">
              Active collections are visible to customers on the online storefront. Draft collections are hidden in customer navigation.
            </p>
          </div>

          {/* Collection Summary Card */}
          <div className="rounded-xl border border-[#e1e3e5] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[#6d7175]">
              Summary
            </h3>
            
            <div className="mt-3 divide-y divide-[#f1f2f3] text-[13px] w-full">
              <div className="flex justify-between py-2.5 first:pt-0 w-full">
                <span className="text-[#6d7175]">Products Assigned</span>
                <span className="font-semibold text-[#202223] bg-[#f3f5f7] px-2 py-0.5 rounded text-[12px] shrink-0">
                  {assignedSlugs.length}
                </span>
              </div>
              <div className="flex justify-between py-2.5 last:pb-0 w-full">
                <span className="text-[#6d7175]">Storefront Visibility</span>
                <span
                  className={`font-semibold text-[12px] shrink-0 ${
                    isActive ? "text-brand-primary" : "text-amber-600"
                  }`}
                >
                  {isActive ? "Visible" : "Hidden"}
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar Actions Card */}
          <div className="rounded-xl border border-[#e1e3e5] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="grid gap-2.5 w-full">
              {can("collections.edit") ? <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.08)] transition-all hover:bg-brand-secondary active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shrink-0"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving Changes..." : "Save Collection"}
              </button> : null}
              
              <Link
                href="/collections"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#d6d9dc] bg-white px-4 py-2.5 text-center text-[13px] font-semibold text-[#202223] shadow-sm transition-all hover:bg-[#f6f6f7] active:scale-[0.98]"
              >
                Cancel
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
