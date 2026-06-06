"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderTree, Pencil, Plus, Save, Search, Trash2, Upload, X } from "lucide-react";
import { useSiteContext, withSiteId } from "@/lib/site-context";
import { useAdminPermissions } from "@/lib/use-admin-permissions";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function CategoriesPage() {
  const activeSiteId = useSiteContext((s) => s.activeSiteId);
  const { can } = useAdminPermissions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  async function loadCategories() {
    const res = await fetch(withSiteId("/api/admin/categories", activeSiteId));
    const data = await res.json();
    setCategories(Array.isArray(data.categories) ? data.categories : []);
  }

  useEffect(() => {
    setLoading(true);
    loadCategories().finally(() => setLoading(false));
  }, [activeSiteId]);

  function resetForm() {
    setName("");
    setSlug("");
    setDescription("");
    setImageUrl("");
    setIsActive(true);
    setEditing(null);
    setShowCreate(false);
  }

  function startEdit(category: Category) {
    setEditing(category);
    setShowCreate(false);
    setName(category.name || "");
    setSlug(category.slug || "");
    setDescription(category.description || "");
    setImageUrl(category.image_url || "");
    setIsActive(category.is_active !== false);
  }

  async function createCategory() {
    if (!name.trim()) return setMessage({ text: "Category name is required", type: "error" });
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(withSiteId("/api/admin/categories", activeSiteId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slugify(slug || name),
          description: description.trim() || null,
          image_url: imageUrl.trim() || null,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create category");
      setMessage({ text: `Category "${name.trim()}" saved.`, type: "success" });
      await loadCategories();
      resetForm();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to create category", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function updateCategory() {
    if (!editing) return;
    if (!name.trim()) return setMessage({ text: "Category name is required", type: "error" });
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(withSiteId("/api/admin/categories", activeSiteId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          name: name.trim(),
          slug: slugify(slug || name),
          description: description.trim() || null,
          image_url: imageUrl.trim() || null,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update category");
      setMessage({ text: `Category "${name.trim()}" updated.`, type: "success" });
      await loadCategories();
      resetForm();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to update category", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function removeCategory(id: string) {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(withSiteId(`/api/admin/categories?id=${encodeURIComponent(id)}`, activeSiteId), { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return setMessage({ text: data.error || "Failed to delete category", type: "error" });
    if (editing?.id === id) resetForm();
    setMessage({ text: "Category deleted.", type: "success" });
    await loadCategories();
  }

  async function uploadCategoryImage(file: File | null) {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data.error || "Image upload failed");
      setImageUrl(data.url);
      setMessage({ text: "Image uploaded. Save the category to publish it.", type: "success" });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Image upload failed", type: "error" });
    } finally {
      setUploading(false);
    }
  }

  const filtered = useMemo(
    () =>
      categories.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.slug.toLowerCase().includes(search.toLowerCase()),
      ),
    [categories, search],
  );

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#202223]">Categories</h2>
          <p className="mt-0.5 text-[13px] text-[#6d7175]">{categories.length} categories in your store</p>
        </div>
        {can("categories.create") ? <button
          onClick={() => {
            resetForm();
            setShowCreate(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.2)] transition-colors hover:bg-brand-secondary"
        >
          <Plus className="h-4 w-4" />
          Add category
        </button> : null}
      </div>

      {message && (
        <div className={`rounded-md border px-4 py-2.5 text-[13px] font-medium ${message.type === "success" ? "border-[#b6d3b2] bg-[#e3f1df] text-[#1a5e1a]" : "border-[#e0b3b3] bg-[#fdf0f0] text-[#d72c0d]"}`}>
          {message.text}
        </div>
      )}

      {((showCreate && can("categories.create")) || (editing && can("categories.edit"))) && (
        <div className="rounded-lg border border-[#e1e3e5] bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#202223]">{editing ? "Edit category" : "Create category"}</h3>
            <button onClick={resetForm} className="text-[#6d7175] hover:text-[#202223]">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#202223]">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-[#c9cccf] px-3 py-2 text-[14px] focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#202223]">Slug</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-from-name" className="w-full rounded-md border border-[#c9cccf] px-3 py-2 text-[14px] focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[13px] font-medium text-[#202223]">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-md border border-[#c9cccf] px-3 py-2 text-[14px] focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[13px] font-medium text-[#202223]">Image URL</label>
              <div className="grid gap-3 sm:grid-cols-[1fr,auto]">
                <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Paste image URL or upload below" className="w-full rounded-md border border-[#c9cccf] px-3 py-2 text-[14px] focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                {can("products.images.upload") ? <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[#c9cccf] bg-white px-3 py-2 text-[13px] font-semibold text-[#202223] hover:bg-[#f6f6f7]">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      uploadCategoryImage(file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label> : null}
              </div>
              {imageUrl ? (
                <div className="mt-3 flex items-center gap-3 rounded-md border border-[#e1e3e5] bg-[#f9fafb] p-3">
                  <img src={imageUrl} alt={name || "Category preview"} className="h-16 w-16 rounded-md object-cover ring-1 ring-[#e1e3e5]" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#202223]">Menu preview image</p>
                    <p className="truncate text-[12px] text-[#6d7175]">{imageUrl}</p>
                  </div>
                </div>
              ) : null}
            </div>
            <label className="inline-flex items-center gap-2 text-[13px] text-[#202223]">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-brand-primary" />
              Active category
            </label>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button onClick={editing ? updateCategory : createCategory} disabled={saving} className="inline-flex items-center gap-1.5 rounded-md bg-brand-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-secondary disabled:opacity-60">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : editing ? "Save changes" : "Create category"}
            </button>
            <button onClick={resetForm} className="rounded-md border border-[#d6d9dc] bg-white px-3 py-2 text-[13px] font-semibold text-[#202223] hover:bg-[#f6f6f7]">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-[#e1e3e5] bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="border-b border-[#e1e3e5] px-4 py-3">
          <div className="flex items-center gap-2 rounded-md border border-[#c9cccf] bg-[#f6f6f7] px-3 py-1.5 focus-within:border-brand-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-primary/20">
            <Search className="h-4 w-4 text-[#8c9196]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories..." className="w-full border-0 bg-transparent text-[13px] text-[#202223] placeholder:text-[#b5b5b5] focus:outline-none" />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e1e3e5] border-t-brand-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FolderTree className="mx-auto h-10 w-10 text-[#c9cccf]" />
            <p className="mt-3 text-[14px] font-medium text-[#6d7175]">No categories found</p>
          </div>
        ) : (
          <div className="divide-y divide-[#e1e3e5]">
            {filtered.map((category) => (
              <div key={category.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f9fafb]">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#e1e3e5] bg-[#f6f6f7]">
                  {category.image_url ? (
                    <img src={category.image_url} alt={category.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#8c9196]">
                      <FolderTree className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[#202223]">{category.name}</p>
                  <p className="truncate text-[12px] text-[#8c9196]">Storefront: /{category.slug}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${category.is_active ? "bg-brand-primary/10 text-brand-primary" : "bg-[#f4f6f8] text-[#6d7175]"}`}>
                  {category.is_active ? "Active" : "Inactive"}
                </span>
                {can("categories.edit") ? <button onClick={() => startEdit(category)} className="rounded-md p-1.5 text-[#6d7175] hover:bg-[#f1f3f5] hover:text-[#202223]">
                  <Pencil className="h-4 w-4" />
                </button> : null}
                {can("categories.delete") ? <button onClick={() => removeCategory(category.id)} className="rounded-md p-1.5 text-[#8c9196] hover:bg-[#fff4f4] hover:text-[#d72c0d]">
                  <Trash2 className="h-4 w-4" />
                </button> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
