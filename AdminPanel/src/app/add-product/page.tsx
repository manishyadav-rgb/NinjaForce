"use client";

import { RefreshCcw, ShieldCheck, AlertCircle, ChevronLeft, ChevronRight, Search, SlidersHorizontal, Layers, Loader2, Check, HelpCircle, PackageOpen } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { formatPrice } from "@/data/products";
import { useSiteContext, withSiteId } from "@/lib/site-context";
import { motion, AnimatePresence } from "framer-motion";

type InventoryItem = {
  source_pk: string;
  source_sk?: string;
  sku: string;
  title: string;
  slug: string;
  category: string;
  collection: string;
  description: string;
  image_url: string;
  mrp: number;
  sale_price: number;
  quantity_available: number;
  raw: Record<string, unknown>;
};

export default function AddProductPage() {
  const PAGE_SIZE = 12;
  const activeSiteId = useSiteContext((s) => s.activeSiteId);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [importingSku, setImportingSku] = useState("");
  const [publishingSelected, setPublishingSelected] = useState(false);
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [collectionOptions, setCollectionOptions] = useState<string[]>([]);
  const [readingStructure, setReadingStructure] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [existingSkus, setExistingSkus] = useState<Set<string>>(new Set());

  async function loadExistingSkus() {
    const response = await fetch(withSiteId("/api/admin/products?skus=1"));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Failed to read existing SKUs");
    const skus = Array.isArray(data.skus) ? data.skus : [];
    const skuSet = new Set<string>(skus.map((sku: string) => sku.toUpperCase()));
    setExistingSkus(skuSet);
    return skuSet;
  }

  async function loadInventory(next: string | null = null, history?: string[], skuSet?: Set<string>) {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      if (next) params.set("cursor", next);
      if (search.trim()) params.set("q", search.trim());
      if (collectionFilter !== "all") params.set("collection", collectionFilter);
      const response = await fetch(withSiteId(`/api/admin/inventory/dynamodb?${params.toString()}`));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to read DynamoDB inventory");
      const blockedSkus = skuSet ?? existingSkus;
      const filteredItems = (data.items ?? []).filter((item: InventoryItem) => !blockedSkus.has(item.sku.toUpperCase()));
      setItems(filteredItems);
      setSelectedMap({});
      setCursor(next);
      setNextCursor(data.nextCursor ?? null);
      if (history) setCursorHistory(history);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to read DynamoDB inventory");
    } finally {
      setLoading(false);
    }
  }

  async function importProduct(item: InventoryItem) {
    setImportingSku(item.sku);
    setMessage("");
    try {
      const response = await fetch(withSiteId("/api/admin/inventory/import"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to publish product");
      setMessage(`${item.title} published to PostgreSQL. DynamoDB was not modified.`);
      const skuSet = await loadExistingSkus();
      await loadInventory(cursor, undefined, skuSet);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to publish product");
    } finally {
      setImportingSku("");
    }
  }

  function itemKey(item: InventoryItem) {
    return `${item.source_pk}-${item.source_sk ?? item.sku}`;
  }

  function toggleSelect(item: InventoryItem) {
    const key = itemKey(item);
    setSelectedMap((current) => ({ ...current, [key]: !current[key] }));
  }

  const selectedCount = Object.values(selectedMap).filter(Boolean).length;
  const filteredItems = items;

  async function publishSelected() {
    const selectedItems = items.filter((item) => selectedMap[itemKey(item)]);
    if (!selectedItems.length) {
      setMessage("Select at least one product to publish.");
      return;
    }

    setPublishingSelected(true);
    setMessage("");
    try {
      for (const item of selectedItems) {
        const response = await fetch(withSiteId("/api/admin/inventory/import"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? `Failed to publish ${item.sku}`);
      }

      setMessage(`${selectedItems.length} products published to PostgreSQL. They will appear on the storefront cards.`);
      setSelectedMap({});
      const skuSet = await loadExistingSkus();
      await loadInventory(cursor, undefined, skuSet);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to publish selected products");
    } finally {
      setPublishingSelected(false);
    }
  }

  async function readTableStructure() {
    setReadingStructure(true);
    setMessage("");
    try {
      const response = await fetch(withSiteId(`/api/admin/inventory/dynamodb?limit=${PAGE_SIZE}&debug=1`));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to read table structure");
      const top = (data.structure?.topLevelKeys ?? []).slice(0, 12).map((entry: { key: string }) => entry.key).join(", ");
      setMessage(`Table: ${data.table}. Top keys found: ${top || "none"}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to read table structure");
    } finally {
      setReadingStructure(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const collectionRes = await fetch(withSiteId("/api/admin/inventory/dynamodb/collections"));
        const collectionData = await collectionRes.json();
        if (collectionRes.ok && Array.isArray(collectionData.collections)) {
          setCollectionOptions(collectionData.collections);
        }
        const skuSet = await loadExistingSkus();
        await loadInventory(null, undefined, skuSet);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load inventory");
        setLoading(false);
      }
    })();
  }, [activeSiteId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInventory(null, []);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, collectionFilter]);

  function handleNextPage() {
    if (!nextCursor) return;
    const history = [...cursorHistory, cursor ?? ""];
    loadInventory(nextCursor, history);
  }

  function handlePreviousPage() {
    if (!cursorHistory.length) return;
    const history = [...cursorHistory];
    const previous = history.pop() ?? "";
    loadInventory(previous || null, history);
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-2 py-4">
      {/* Header */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between pb-6 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-primary">
              <Layers className="h-3.5 w-3.5" />
              Database Import
            </div>
          </div>
          <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-text-main font-display">Import Inventory</h1>
          <p className="mt-1 text-xs font-semibold text-text-muted">
            Sync your DynamoDB inventory catalog into PostgreSQL storefront tables.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={readTableStructure}
            disabled={loading || readingStructure}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border bg-background-elevated px-4 text-xs font-bold text-text-main hover:bg-background-soft transition-all duration-150 disabled:opacity-50"
          >
            {readingStructure ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <HelpCircle className="h-3.5 w-3.5 text-text-soft" />}
            <span>{readingStructure ? "Reading..." : "Read Structure"}</span>
          </button>
          <button
            onClick={() => loadInventory(cursor)}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border bg-background-elevated px-4 text-xs font-bold text-text-main hover:bg-background-soft transition-all duration-150 disabled:opacity-50"
          >
            <RefreshCcw className={`h-3.5 w-3.5 text-text-soft ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Info Banners Block */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5 rounded-2xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-xs font-semibold text-text-main">
          <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-brand-primary" />
          <span>DynamoDB is read-only. Selected products are copied into PostgreSQL for the storefront.</span>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 rounded-2xl border border-border bg-background-soft px-4 py-3 text-xs font-semibold text-text-main"
          >
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-text-soft" />
            <span>{message}</span>
          </motion.div>
        )}
      </div>

      {/* Bulk actions popup display */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex items-center justify-between rounded-2xl border border-brand-primary bg-brand-primary/5 p-4 shadow-sm"
          >
            <span className="text-xs font-black text-brand-primary">
              {selectedCount} product{selectedCount > 1 ? "s" : ""} selected
            </span>
            <button
              onClick={publishSelected}
              disabled={publishingSelected}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-brand-primary px-4 text-xs font-bold text-text-inverse hover:bg-brand-secondary transition-all disabled:opacity-60 active:scale-95 duration-150"
            >
              {publishingSelected ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Publish Selected</span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + Filter Options */}
      <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
        <div className="flex items-center gap-2 rounded-full border border-border bg-background-elevated px-4 py-2 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary/20 transition-all duration-200">
          <Search className="h-4 w-4 text-text-soft shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory by title or SKU..."
            className="w-full border-none bg-transparent text-xs font-bold text-text-main placeholder-text-soft focus:outline-none focus:ring-0 p-0"
          />
        </div>

        <div className="flex items-center gap-2 rounded-full border border-border bg-background-elevated px-4 py-2.5">
          <SlidersHorizontal className="h-4 w-4 text-text-soft" />
          <select
            value={collectionFilter}
            onChange={(e) => setCollectionFilter(e.target.value)}
            className="w-full border-0 bg-transparent text-xs font-bold text-text-main cursor-pointer focus:outline-none"
          >
            <option value="all">All collections</option>
            {collectionOptions.map((collection) => (
              <option key={collection} value={collection}>
                {collection}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Catalog Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-background-elevated border border-border rounded-3xl">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="mt-3 text-xs font-bold text-text-soft uppercase tracking-wider">Loading inventory from DynamoDB...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-border bg-background-elevated py-20 text-center">
          <PackageOpen className="h-12 w-12 text-text-soft mx-auto mb-3" />
          <p className="text-sm font-bold text-text-main">No products match your filters</p>
          <p className="mt-1 text-xs text-text-muted">Try a different search term or collection.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => {
              const isSelected = Boolean(selectedMap[itemKey(item)]);
              const isImporting = importingSku === item.sku;
              
              return (
                <motion.article
                  key={itemKey(item)}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className={`overflow-hidden rounded-3xl border bg-background-elevated transition-all flex flex-col justify-between ${
                    isSelected ? "border-brand-primary shadow-md" : "border-border hover:shadow-soft"
                  }`}
                >
                  <div>
                    {/* Image + Checkbox */}
                    <div className="relative h-48 w-full border-b border-border overflow-hidden bg-background-soft">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-102"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-extrabold uppercase tracking-wide text-text-soft">
                          No image available
                        </div>
                      )}
                      
                      {/* Checkbox Trigger badge overlay */}
                      <button
                        onClick={() => toggleSelect(item)}
                        className={`absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-lg border shadow-sm transition-all duration-150 ${
                          isSelected
                            ? "bg-brand-primary border-brand-primary text-text-inverse scale-105"
                            : "bg-background-elevated border-border text-transparent hover:bg-background-soft"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Card Content details */}
                    <div className="p-5 space-y-4">
                      <h3 className="line-clamp-2 text-sm font-extrabold text-text-main min-h-[40px] leading-tight group-hover:text-brand-primary transition-colors">
                        {item.title}
                      </h3>

                      {/* Properties Grid */}
                      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-background-soft/60 p-3 text-[10px] font-bold">
                        <div>
                          <p className="uppercase text-text-muted">SKU</p>
                          <p className="mt-0.5 text-text-main font-mono truncate">{item.sku}</p>
                        </div>
                        <div>
                          <p className="uppercase text-text-muted">Collection</p>
                          <p className="mt-0.5 text-text-main truncate">{item.collection || "—"}</p>
                        </div>
                        <div>
                          <p className="uppercase text-text-muted">Stock</p>
                          <p className="mt-0.5 text-text-main">{item.quantity_available}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Publish footer */}
                  <div className="px-5 pb-5 pt-3 border-t border-border/40 bg-background-soft/30 flex items-center justify-between shrink-0">
                    <p className="text-base font-black text-text-main">
                      {formatPrice(item.sale_price || item.mrp)}
                    </p>
                    
                    <button
                      onClick={() => void importProduct(item)}
                      disabled={isImporting}
                      className="inline-flex h-8 items-center justify-center gap-1 rounded-full bg-brand-primary text-text-inverse px-4 text-xs font-bold hover:bg-brand-secondary transition-all active:scale-95 duration-150 disabled:opacity-60"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <span>Publish</span>
                      )}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination control footer bar */}
      {!loading && filteredItems.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-border bg-background-elevated px-5 py-3 shadow-soft">
          <p className="text-xs font-bold text-text-soft">Showing {PAGE_SIZE} items per page</p>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={loading || cursorHistory.length === 0}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-border bg-background-elevated px-3 text-xs font-bold text-text-main hover:bg-background-soft transition-all duration-150 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={handleNextPage}
              disabled={loading || !nextCursor}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-border bg-background-elevated px-3 text-xs font-bold text-text-main hover:bg-background-soft transition-all duration-150 disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
