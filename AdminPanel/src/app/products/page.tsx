"use client";

import Image from "next/image";
import Link from "next/link";
import { 
  AlertCircle, 
  Edit3, 
  Search, 
  Trash2, 
  X, 
  ShoppingBag, 
  CheckCircle, 
  AlertTriangle,
  Sparkles,
  PackageOpen,
  Plus,
  Clock
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatPrice } from "@/data/products";
import { useSiteContext, withSiteId } from "@/lib/site-context";
import { useAdminPermissions } from "@/lib/use-admin-permissions";
import { motion, AnimatePresence } from "framer-motion";

type AdminProduct = {
  id: string;
  title: string;
  slug: string;
  sku: string | null;
  collection: string | null;
  sale_price: string | null;
  mrp: string | null;
  quantity_available: number | null;
  image_url: string | null;
  category: string | null;
  is_active: boolean;
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
      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110" 
    />
  );
};

export default function AdminProductsPage() {
  const activeSiteId = useSiteContext((s) => s.activeSiteId);
  const { can } = useAdminPermissions();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadProducts() {
    setLoading(true);
    const response = await fetch(withSiteId("/api/admin/products"));
    const data = await response.json();
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product from PostgreSQL?")) return;
    setMessage("");
    const response = await fetch(withSiteId(`/api/admin/products?id=${encodeURIComponent(id)}`), { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Failed to delete product");
      return;
    }
    setMessage("Product deleted from PostgreSQL. DynamoDB was not touched.");
    await loadProducts();
  }

  async function clearAllProducts() {
    if (!confirm("Are you sure you want to clear ALL products? This action cannot be undone.")) return;
    setMessage("");
    const response = await fetch(withSiteId("/api/admin/products?clearAll=1"), { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Failed to clear products");
      return;
    }
    setMessage("All PostgreSQL products cleared. Import fresh products from DynamoDB.");
    await loadProducts();
  }

  useEffect(() => {
    loadProducts();
  }, [activeSiteId]);

  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const outOfStockProducts = products.filter(p => (p.quantity_available ?? 0) === 0).length;

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 px-4 py-6">
      {/* Header and Actions banner */}
      <div className="pb-6 border-b border-border/60 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-primary">
              <Sparkles className="h-3 w-3 animate-pulse" />
              Store Inventory
            </div>
          </div>
          <h1 className="mt-2 text-xl font-extrabold tracking-tight text-text-main font-display">Products</h1>
          <p className="mt-1.5 text-xs font-semibold text-text-muted">
            Manage your store items, publish layouts, edit inventory parameters, and clear Postgres sync logs.
          </p>
        </div>

        <div className="flex gap-2">
          {can("products.delete") && products.length > 0 ? (
            <button 
              onClick={clearAllProducts} 
              className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/5 text-rose-500 px-4 text-xs font-extrabold hover:bg-rose-500 hover:text-text-inverse hover:border-transparent transition-all shadow-soft active:scale-95 duration-200"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear PostgreSQL</span>
            </button>
          ) : null}
          
          {can("products.create") ? (
            <Link 
              href="/add-product" 
              className="inline-flex h-[38px] items-center justify-center gap-1 rounded-full bg-brand-primary text-text-inverse px-5 text-xs font-extrabold hover:bg-brand-secondary transition-all active:scale-95 duration-200 shadow-soft"
            >
              <Plus className="h-4 w-4 mr-0.5" />
              <span>Add Product</span>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Dynamic System Alert Banner */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3.5 text-xs font-bold text-emerald-600 shadow-soft"
          >
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="flex-1">{message}</span>
            <button onClick={() => setMessage("")} className="hover:opacity-75 transition-opacity pl-2">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Row Grid */}
      <div className="grid gap-5 sm:grid-cols-3">
        {/* Metric 1: Total */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-3xl border border-border bg-background-elevated p-6 flex items-center justify-between gap-4 hover:shadow-glow hover:border-brand-primary/30 transition-all duration-300 group"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary group-hover:scale-110 transition-transform duration-200">
              <ShoppingBag className="h-6 w-6" />
            </span>
            <div>
              <div className="text-2xl font-black text-text-main font-display">{totalProducts}</div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-soft">Total Products</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-text-soft bg-background-soft border border-border/80 px-2.5 py-1 rounded-full shrink-0">
            Postgres
          </div>
        </motion.div>

        {/* Metric 2: Active */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-3xl border border-border bg-background-elevated p-6 flex items-center justify-between gap-4 hover:shadow-glow hover:border-emerald-500/30 transition-all duration-300 group"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform duration-200">
              <CheckCircle className="h-6 w-6" />
            </span>
            <div>
              <div className="text-2xl font-black text-text-main font-display">{activeProducts}</div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-soft">Active Catalog</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full shrink-0">
            {totalProducts > 0 ? `${Math.round((activeProducts / totalProducts) * 100)}%` : "0%"} Live
          </div>
        </motion.div>

        {/* Metric 3: Out of Stock */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="rounded-3xl border border-border bg-background-elevated p-6 flex items-center justify-between gap-4 hover:shadow-glow hover:border-rose-500/30 transition-all duration-300 group"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform duration-200">
              <PackageOpen className="h-6 w-6" />
            </span>
            <div>
              <div className="text-2xl font-black text-text-main font-display">{outOfStockProducts}</div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-soft">Out of Stock</div>
            </div>
          </div>
          {outOfStockProducts > 0 ? (
            <div className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span>Attention</span>
            </div>
          ) : (
            <div className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full shrink-0">
              Healthy
            </div>
          )}
        </motion.div>
      </div>

      {/* Catalog Search & Layout Section */}
      <div className="flex flex-col gap-4">
        {/* Search Toolbar Panel */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-border bg-background-elevated p-4 shadow-soft">
          {/* Search Input Container */}
          <div className="flex items-center gap-2.5 rounded-full border border-border bg-background-soft px-4.5 py-2.5 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15 transition-all duration-200 w-full max-w-md">
            <Search className="h-4 w-4 text-text-soft shrink-0" />
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search products by title, SKU, slug..." 
              className="w-full border-none bg-transparent text-xs font-bold text-text-main placeholder-text-soft focus:outline-none focus:ring-0 p-0" 
            />
          </div>

          <div className="text-xs font-extrabold text-text-soft px-3 shrink-0 self-start lg:self-auto">
            Showing {filtered.length} of {products.length} products
          </div>
        </div>

        {/* Catalog List stack */}
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-background-elevated rounded-3xl border border-border shadow-soft">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand-primary" />
              <p className="mt-3.5 text-xs font-extrabold text-text-soft uppercase tracking-wider">Syncing products catalog...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center px-6 bg-background-elevated rounded-3xl border border-border shadow-soft">
              <div className="h-14 w-14 rounded-3xl bg-background-soft border border-border flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-6 w-6 text-text-soft" />
              </div>
              <p className="text-sm font-extrabold text-text-main">
                {search ? "No products match your query" : "Inventory catalog is empty"}
              </p>
              <p className="mt-1 text-xs text-text-muted max-w-md mx-auto">
                {search ? "Try searching for a different product name, SKU code, or collection layout slug." : "Import fresh products from DynamoDB or click Add Product above."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header Titles on Desktop */}
              <div className="hidden md:grid grid-cols-12 items-center px-6 py-2 text-[10px] font-black uppercase tracking-wider text-text-soft">
                <div className="col-span-1" />
                <div className="col-span-4">Product Info</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Inventory</div>
                <div className="col-span-1">Category</div>
                <div className="col-span-1 text-right">Price</div>
                <div className="col-span-2 text-right" />
              </div>

              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filtered.map((product, index) => {
                    const stock = product.quantity_available ?? 0;
                    const isLow = stock > 0 && stock <= 5;
                    const isOut = stock === 0;
                    
                    return (
                      <motion.div 
                        key={product.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.25, delay: index * 0.02 }}
                        className="group grid grid-cols-[3.5rem_1fr_auto] items-center gap-4 px-4 py-4 md:grid-cols-12 md:gap-4 md:px-6 md:py-4.5 rounded-3xl border border-border/60 bg-background-elevated shadow-soft hover:shadow-glow hover:border-brand-primary/30 hover:-translate-y-[1px] transition-all duration-300"
                      >
                        {/* Column 1: Image Thumbnail */}
                        <div className="col-span-1 relative h-14 w-14 overflow-hidden rounded-2xl border border-border bg-background-soft shrink-0 shadow-soft group-hover:border-brand-primary/30 group-hover:shadow-glow transition-all duration-300 flex items-center justify-center">
                          <ProductImage src={product.image_url} />
                        </div>

                        {/* Column 2: Product Titles & Identifiers */}
                        <div className="col-span-1 md:col-span-4 min-w-0 pr-2 space-y-0.5">
                          <p className="truncate text-sm font-extrabold text-text-main group-hover:text-brand-primary transition-colors tracking-tight font-display">
                            {product.title}
                          </p>
                          <p className="truncate text-[10px] font-bold text-text-soft flex items-center gap-1.5">
                            {product.sku && <span>SKU: {product.sku}</span>}
                            {product.sku && <span>•</span>}
                            <span>/{product.slug}</span>
                          </p>
                        </div>
                        
                        {/* Column 3: Status Pill Badge */}
                        <div className="col-span-1 hidden md:block">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                            product.is_active 
                              ? "bg-brand-primary/10 text-brand-primary border-brand-primary/15" 
                              : "bg-background-soft text-text-soft border-border"
                          }`}>
                            {product.is_active ? "Active" : "Draft"}
                          </span>
                        </div>

                        {/* Column 4: Stock Quantity Available */}
                        <div className="col-span-2 hidden items-center md:flex">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-rose-500">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span>Out of stock</span>
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-500">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>Low Stock ({stock})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-500">
                              <CheckCircle className="h-3 w-3 shrink-0" />
                              <span>{stock} In Stock</span>
                            </span>
                          )}
                        </div>

                        {/* Column 5: Category Classification */}
                        <p className="col-span-1 hidden truncate text-xs font-semibold text-text-muted md:block">
                          {product.category || product.collection || "—"}
                        </p>

                        {/* Column 6: Sale / MRP Pricing */}
                        <p className="col-span-1 hidden text-right text-xs md:text-sm font-extrabold text-text-main md:block">
                          {formatPrice(Number(product.sale_price ?? product.mrp ?? 0))}
                        </p>

                        {/* Column 7: Actions */}
                        <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-2 shrink-0">
                          {can("products.edit") ? (
                            <Link
                              href={`/products/${product.id}`}
                              className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-border bg-background-elevated px-3.5 text-xs font-bold text-text-main hover:bg-brand-primary hover:text-text-inverse hover:border-transparent transition-all shadow-soft active:scale-95 duration-200"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </Link>
                          ) : null}
                          
                          {can("products.delete") ? (
                            <button 
                              onClick={() => deleteProduct(product.id)} 
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-text-soft hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-90" 
                              title="Delete product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
