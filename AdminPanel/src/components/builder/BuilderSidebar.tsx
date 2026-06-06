/**
 * Builder Sidebar — Shopify-style Section Management & Theme Settings
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Copy, Eye, EyeOff,
  Grip, Plus, Trash2, X, Palette, Layout, Search, Check,
} from "lucide-react";
import { useBuilderStore } from "@/lib/builder/store";
import { sectionRegistry, getSectionDef } from "@/lib/builder/registry";
import type { FieldSchema, Section } from "@/lib/builder/types";
import { withSiteId } from "@/lib/site-context";

/* ─── Field Renderer ───────────────────────────────────────── */

function FieldInput({ field, value, onChange }: { field: FieldSchema; value: any; onChange: (val: any) => void }) {
  const base = "w-full rounded-lg border border-[#c9cccf] bg-white px-3 py-2 text-[13px] text-[#202223] transition-colors focus:border-[#5c6ac4] focus:outline-none focus:ring-2 focus:ring-[#5c6ac4]/20";
  const isoToDateTimeLocal = (isoValue: any) => {
    if (!isoValue) return "";
    const d = new Date(String(isoValue));
    if (Number.isNaN(d.getTime())) return "";
    const offsetMs = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
  };
  const dateTimeLocalToIso = (localValue: string) => {
    if (!localValue) return "";
    const d = new Date(localValue);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString();
  };

  switch (field.type) {
    case "text":
    case "url":
      return <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder || (field.type === "url" ? "https://..." : "")} className={base} />;
    case "datetime":
      return (
        <input
          type="datetime-local"
          value={isoToDateTimeLocal(value)}
          onChange={(e) => onChange(dateTimeLocalToIso(e.target.value))}
          className={base}
        />
      );
    case "textarea":
    case "richtext":
      if (field.key === "accessoryDataJson" || field.key === "furnitureDataJson") {
        return <NewArrivalJsonEditor value={value ?? ""} onChange={onChange} />;
      }
      return <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={field.type === "richtext" ? 5 : 3} className={base + " resize-y"} />;
    case "number":
      return <input type="number" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} className={base} min={field.min} max={field.max} step={field.step} />;
    case "range":
      return (
        <div className="flex items-center gap-3">
          <input type="range" value={value ?? field.defaultValue ?? 50} onChange={(e) => onChange(Number(e.target.value))} min={field.min ?? 0} max={field.max ?? 100} step={field.step ?? 1} className="flex-1 accent-[#5c6ac4]" />
          <span className="w-10 text-right text-[12px] font-medium text-[#6d7175]">{value ?? field.defaultValue}%</span>
        </div>
      );
    case "color":
      return (
        <div className="flex items-center gap-2">
          <input type="color" value={value ?? "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-[#c9cccf] p-0.5" />
          <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={base + " flex-1 font-mono"} />
        </div>
      );
    case "select":
      return (
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={base}>
          {field.options?.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      );
    case "image":
      return (
        <div>
          <div className="flex gap-2 mb-2">
            <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="https://... image URL" className={base + " flex-1"} />
            <label className="cursor-pointer flex items-center justify-center rounded-lg bg-[#f4f5f7] border border-[#c9cccf] px-3 text-[12px] font-semibold text-[#202223] hover:bg-[#e1e3e5]">
              Upload
              <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const formData = new FormData();
                formData.append("file", file);
                try {
                  const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
                  const data = await res.json();
                  if (data.url) onChange(data.url);
                } catch (err) {
                  console.error(err);
                }
              }} />
            </label>
          </div>
          {value && <img src={value} alt="" className="h-24 w-full rounded-lg border border-[#e1e3e5] object-cover" />}
        </div>
      );
    case "toggle":
      return (
        <button type="button" onClick={() => onChange(!value)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? "bg-[#5c6ac4]" : "bg-[#c9cccf]"}`}>
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      );
    case "product-list":
      return <ProductListPicker value={value || []} onChange={onChange} />;
    case "collection-select":
      return <CollectionSelectPicker value={value ?? ""} onChange={onChange} />;
    case "alignment":
      return <AlignmentPicker value={value ?? "center"} onChange={onChange} />;
    case "spacing":
      return <SpacingControl value={value ?? { top: 0, bottom: 0, left: 0, right: 0 }} onChange={onChange} />;
    case "media-array":
      return <MediaArrayPicker value={value || []} onChange={onChange} />;
    default:
      return null;
  }
}

type NewArrivalItem = { icon: string; label: string };
type NewArrivalGroup = { tab: string; items: NewArrivalItem[] };

function NewArrivalJsonEditor({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const parse = (raw: string): NewArrivalGroup[] => {
    try {
      const parsed = JSON.parse(String(raw || "[]"));
      if (!Array.isArray(parsed)) return [];
      return parsed.map((group: any) => ({
        tab: String(group?.tab || ""),
        items: Array.isArray(group?.items)
          ? group.items.map((item: any) => ({
              icon: String(item?.icon || ""),
              label: String(item?.label || ""),
            }))
          : [],
      }));
    } catch {
      return [];
    }
  };

  const [groups, setGroups] = useState<NewArrivalGroup[]>(parse(value));

  useEffect(() => {
    setGroups(parse(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const sync = (next: NewArrivalGroup[]) => {
    setGroups(next);
    onChange(JSON.stringify(next));
  };

  return (
    <div className="rounded-lg border border-[#c9cccf] bg-white p-2.5">
      <div className="mb-2 text-[11px] text-[#6d7175]">Simple editor (JSON auto-generated)</div>
      <div className="grid gap-2">
        {groups.map((group, gi) => (
          <div key={gi} className="rounded-md border border-[#e1e3e5] p-2">
            <div className="mb-2 flex items-center gap-2">
              <input
                value={group.tab}
                onChange={(e) => {
                  const next = [...groups];
                  next[gi] = { ...group, tab: e.target.value };
                  sync(next);
                }}
                placeholder="Tab name (e.g. Wall Decor)"
                className="flex-1 rounded border border-[#c9cccf] px-2 py-1.5 text-[12px] focus:border-[#5c6ac4] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => sync(groups.filter((_, i) => i !== gi))}
                className="rounded border border-[#ffd2d2] bg-[#fff6f6] px-2 py-1.5 text-[11px] font-semibold text-[#d72c0d]"
              >
                Remove Tab
              </button>
            </div>

            <div className="grid gap-1.5">
              {group.items.map((item, ii) => (
                <div key={ii} className="flex items-center gap-1.5">
                  <input
                    value={item.icon}
                    onChange={(e) => {
                      const next = [...groups];
                      next[gi].items[ii] = { ...item, icon: e.target.value };
                      sync(next);
                    }}
                    placeholder="🛋️"
                    className="w-14 rounded border border-[#c9cccf] px-2 py-1.5 text-center text-[12px] focus:border-[#5c6ac4] focus:outline-none"
                  />
                  <input
                    value={item.label}
                    onChange={(e) => {
                      const next = [...groups];
                      next[gi].items[ii] = { ...item, label: e.target.value };
                      sync(next);
                    }}
                    placeholder="Item label"
                    className="flex-1 rounded border border-[#c9cccf] px-2 py-1.5 text-[12px] focus:border-[#5c6ac4] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...groups];
                      next[gi] = { ...group, items: group.items.filter((_, i) => i !== ii) };
                      sync(next);
                    }}
                    className="rounded border border-[#ffd2d2] bg-[#fff6f6] px-2 py-1.5 text-[11px] font-semibold text-[#d72c0d]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                const next = [...groups];
                next[gi] = { ...group, items: [...group.items, { icon: "", label: "" }] };
                sync(next);
              }}
              className="mt-2 rounded border border-[#c9cccf] bg-[#f9fafb] px-2 py-1.5 text-[11px] font-semibold text-[#202223]"
            >
              + Add Item
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => sync([...groups, { tab: "", items: [{ icon: "", label: "" }] }])}
        className="mt-2 rounded bg-[#5c6ac4] px-3 py-1.5 text-[11px] font-semibold text-white"
      >
        + Add Tab
      </button>
    </div>
  );
}

/* ─── Alignment Picker (9-position grid) ───────────────────── */
function AlignmentPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const positions = [
    "top-left", "top-center", "top-right",
    "center-left", "center", "center-right",
    "bottom-left", "bottom-center", "bottom-right",
  ];
  return (
    <div className="inline-grid grid-cols-3 gap-1 rounded-lg border border-[#c9cccf] bg-[#f9fafb] p-1.5">
      {positions.map((pos) => (
        <button key={pos} type="button" onClick={() => onChange(pos)}
          className={`h-6 w-6 rounded transition-all ${value === pos ? "bg-[#5c6ac4] shadow-sm" : "bg-white border border-[#e1e3e5] hover:border-[#5c6ac4]"}`}
        >
          <span className={`block h-1.5 w-1.5 rounded-full mx-auto ${value === pos ? "bg-white" : "bg-[#8c9196]"}`} />
        </button>
      ))}
    </div>
  );
}

/* ─── Spacing Control (4-side) ─────────────────────────────── */
function SpacingControl({ value, onChange }: { value: Record<string, number>; onChange: (v: Record<string, number>) => void }) {
  const sides = [
    { key: "top", label: "T" },
    { key: "right", label: "R" },
    { key: "bottom", label: "B" },
    { key: "left", label: "L" },
  ];
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {sides.map((s) => (
        <div key={s.key} className="text-center">
          <label className="block text-[10px] font-semibold text-[#8c9196] mb-0.5">{s.label}</label>
          <input type="number" value={value[s.key] ?? 0} min={0} max={200} step={4}
            onChange={(e) => onChange({ ...value, [s.key]: Number(e.target.value) })}
            className="w-full rounded border border-[#c9cccf] bg-white px-1 py-1 text-center text-[12px] text-[#202223] focus:border-[#5c6ac4] focus:outline-none"
          />
        </div>
      ))}
    </div>
  );
}

/* ─── Media Array (multi-image) ────────────────────────────── */
function MediaArrayPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const addImage = (url: string) => { if (url) onChange([...value, url]); };
  const removeImage = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const [uploading, setUploading] = useState(false);

  return (
    <div className="rounded-lg border border-[#c9cccf] bg-white overflow-hidden">
      <div className="grid grid-cols-3 gap-1.5 p-2">
        {value.map((url, idx) => (
          <div key={idx} className="group relative aspect-square rounded-md overflow-hidden border border-[#e1e3e5]">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button onClick={() => removeImage(idx)}
              className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            ><X className="h-3 w-3" /></button>
            <span className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[9px] px-1 rounded">{idx + 1}</span>
          </div>
        ))}
        <label className={`aspect-square rounded-md border-2 border-dashed border-[#c9cccf] flex flex-col items-center justify-center cursor-pointer hover:border-[#5c6ac4] hover:bg-[#f4f6f8] transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <Plus className="h-4 w-4 text-[#8c9196]" />
          <span className="text-[9px] text-[#8c9196] mt-0.5">{uploading ? "..." : "Add"}</span>
          <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            setUploading(true);
            const fd = new FormData(); fd.append("file", file);
            try {
              const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
              const data = await res.json();
              if (data.url) addImage(data.url);
            } catch (err) { console.error(err); }
            finally { setUploading(false); }
          }} />
        </label>
      </div>
      <div className="px-2 py-1.5 bg-[#f9fafb] border-t border-[#e1e3e5] text-[10px] text-[#6d7175]">
        {value.length}/10 images • Click + to upload via Cloudinary
      </div>
    </div>
  );
}

function ProductListPicker({ value, onChange }: { value: string[]; onChange: (val: string[]) => void }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(withSiteId("/api/admin/products"));
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleProduct = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const selectedProducts = products.filter(p => value.includes(p.id));
  const filtered = products.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-lg border border-[#c9cccf] bg-white overflow-hidden">
      {/* Selected products summary */}
      {selectedProducts.length > 0 && (
        <div className="p-2 border-b border-[#e1e3e5] bg-[#eef0ff]">
          <p className="text-[10px] font-semibold text-[#5c6ac4] mb-1.5">{selectedProducts.length} Selected</p>
          <div className="flex flex-wrap gap-1.5">
            {selectedProducts.map(p => (
              <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-white border border-[#5c6ac4]/30 px-2 py-0.5 text-[10px] font-medium text-[#202223]">
                {p.image_url && <img src={p.image_url} className="h-4 w-4 rounded-full object-cover" alt="" />}
                <span className="truncate max-w-[80px]">{p.title}</span>
                <button onClick={() => toggleProduct(p.id)} className="text-[#8c9196] hover:text-[#d72c0d]">×</button>
              </span>
            ))}
          </div>
        </div>
      )}
      {/* Search */}
      <div className="p-2 border-b border-[#e1e3e5] bg-[#f9fafb]">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8c9196]" />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 bg-white border border-[#c9cccf] rounded-md text-[12px] focus:outline-none focus:border-[#5c6ac4]"
          />
        </div>
      </div>
      {/* Product list */}
      <div className="max-h-[280px] overflow-y-auto divide-y divide-[#e1e3e5]" style={{ scrollbarWidth: "thin" }}>
        {loading && <div className="p-4 text-center text-[12px] text-[#8c9196]">Loading...</div>}
        {filtered.map(p => (
          <div 
            key={p.id} 
            onClick={() => toggleProduct(p.id)}
            className={`flex items-center gap-2.5 px-2.5 py-2 cursor-pointer transition-colors ${value.includes(p.id) ? "bg-[#f0f1ff]" : "hover:bg-[#f4f6f8]"}`}
          >
            <div className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${value.includes(p.id) ? "bg-[#5c6ac4] border-[#5c6ac4]" : "bg-white border-[#c9cccf]"}`}>
              {value.includes(p.id) && <Check className="h-3 w-3 text-white" />}
            </div>
            <div className="h-9 w-9 shrink-0 rounded overflow-hidden border border-[#e1e3e5] bg-[#f6f6f7]">
              {p.image_url ? <img src={p.image_url} className="h-full w-full object-cover" alt="" /> : <div className="h-full w-full flex items-center justify-center text-[8px] text-[#b5b5b5]">N/A</div>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[#202223] truncate">{p.title}</p>
              <p className="text-[10px] text-[#8c9196]">{p.sale_price ? `₹${Number(p.sale_price).toLocaleString()}` : ""} {p.sku ? `• ${p.sku}` : ""}</p>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="p-4 text-center text-[12px] text-[#8c9196]">No products found</div>
        )}
      </div>
    </div>
  );
}

function CollectionSelectPicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [collections, setCollections] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(withSiteId("/api/admin/collections"));
        const data = await res.json();
        setCollections(Array.isArray(data.collections) ? data.collections : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const base = "w-full rounded-lg border border-[#c9cccf] bg-white px-3 py-2 text-[13px] text-[#202223] transition-colors focus:border-[#5c6ac4] focus:outline-none focus:ring-2 focus:ring-[#5c6ac4]/20";

  if (loading) return <div className="text-[12px] text-[#8c9196] py-1">Loading collections...</div>;

  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={base}>
      <option value="">-- Select Collection --</option>
      {collections.map((col: any) => (
        <option key={col.id} value={col.slug}>
          {col.name} ({col.slug})
        </option>
      ))}
    </select>
  );
}

/* ─── Section Editor ───────────────────────────────────────── */

function SectionEditor({ section }: { section: Section }) {
  const updateSection = useBuilderStore((s) => s.updateSection);
  const setActiveSection = useBuilderStore((s) => s.setActiveSection);
  const def = getSectionDef(section.type);
  const [openGroup, setOpenGroup] = useState<string | null>("content");
  if (!def) return null;

  // Group fields by their group property
  const groups: Record<string, typeof def.fields> = {};
  for (const field of def.fields) {
    const g = field.group || "content";
    if (!groups[g]) groups[g] = [];
    groups[g].push(field);
  }

  const groupLabels: Record<string, { label: string; emoji: string }> = {
    content: { label: "Content", emoji: "📝" },
    layout: { label: "Layout", emoji: "📐" },
    spacing: { label: "Spacing", emoji: "↕️" },
    style: { label: "Style", emoji: "🎨" },
    products: { label: "Products", emoji: "🛍️" },
    media: { label: "Media", emoji: "🖼️" },
  };

  return (
    <div className="flex flex-col">
      <button onClick={() => setActiveSection(null)} className="mb-4 flex items-center gap-1.5 text-[13px] font-medium text-[#5c6ac4] hover:underline">
        <ChevronLeft className="h-3.5 w-3.5" /> Back to sections
      </button>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f4f5f7] text-[14px] text-[#6d7175]">
          {def.icon.slice(0, 2)}
        </div>
        <div>
          <h3 className="text-[14px] font-semibold text-[#202223]">{def.label}</h3>
          <p className="text-[11px] text-[#8c9196]">{def.description}</p>
        </div>
      </div>
      <div className="grid gap-2">
        {Object.entries(groups).map(([groupId, fields]) => {
          const meta = groupLabels[groupId] || { label: groupId, emoji: "⚙️" };
          return (
            <div key={groupId} className="rounded-lg border border-[#e1e3e5] bg-white overflow-hidden">
              <button
                onClick={() => setOpenGroup(openGroup === groupId ? null : groupId)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-[#f9fafb]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[13px]">{meta.emoji}</span>
                  <span className="text-[12px] font-semibold text-[#202223]">{meta.label}</span>
                  <span className="text-[10px] text-[#8c9196]">{fields.length}</span>
                </div>
                <ChevronRight className={`h-3.5 w-3.5 text-[#8c9196] transition-transform ${openGroup === groupId ? "rotate-90" : ""}`} />
              </button>
              {openGroup === groupId && (
                <div className="border-t border-[#e1e3e5] px-3 py-3 grid gap-3.5">
                  {fields.map((field) => (
                    <div key={field.key}>
                      <label className="mb-1.5 block text-[12px] font-semibold text-[#6d7175]">{field.label}</label>
                      <FieldInput field={field} value={section.settings[field.key]} onChange={(val) => updateSection(section.id, field.key, val)} />
                      {field.helpText && <p className="mt-1 text-[11px] text-[#8c9196]">{field.helpText}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Theme Editor ─────────────────────────────────────────── */

function ThemeEditor() {
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border-2 border-dashed border-violet-200 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/80 p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg">
          <Palette className="h-7 w-7" />
        </div>
        <h3 className="text-[15px] font-bold text-[#202223]">Theme Editor</h3>
        <p className="mt-2 text-[12px] leading-relaxed text-[#6d7175]">
          Theme colors, typography and border radius are controlled from the dedicated Theme Settings page. Changes apply to the entire storefront.
        </p>
        <a
          href="/settings/theme"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110"
        >
          <Palette className="h-4 w-4" />
          Open Theme Settings
        </a>
      </div>
      <div className="rounded-lg border border-[#e1e3e5] bg-[#f9fafb] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8c9196]">How it works</p>
        <ul className="mt-2 grid gap-1.5 text-[12px] text-[#6d7175]">
          <li className="flex items-start gap-2"><span className="mt-0.5 text-violet-400">●</span> Pick a preset theme (5 options)</li>
          <li className="flex items-start gap-2"><span className="mt-0.5 text-violet-400">●</span> Customize any color with the swatch picker</li>
          <li className="flex items-start gap-2"><span className="mt-0.5 text-violet-400">●</span> Change fonts and border radius</li>
          <li className="flex items-start gap-2"><span className="mt-0.5 text-violet-400">●</span> Click "Save & Apply" — storefront updates instantly</li>
        </ul>
      </div>
    </div>
  );
}

/* ─── Section List ─────────────────────────────────────────── */

function SectionList() {
  const schema = useBuilderStore((s) => s.schema);
  const activePage = useBuilderStore((s) => s.activePage);
  const activeSection = useBuilderStore((s) => s.activeSection);
  const setActiveSection = useBuilderStore((s) => s.setActiveSection);
  const removeSection = useBuilderStore((s) => s.removeSection);
  const reorderSection = useBuilderStore((s) => s.reorderSection);
  const toggleVis = useBuilderStore((s) => s.toggleSectionVisibility);
  const duplicateSection = useBuilderStore((s) => s.duplicateSection);
  const setAddSectionOpen = useBuilderStore((s) => s.setAddSectionOpen);

  const page = schema.pages[activePage];
  if (!page) return null;

  const editingSection = page.sections.find((s) => s.id === activeSection);
  if (editingSection) return <SectionEditor section={editingSection} />;

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[#202223]">Sections</h3>
        <button onClick={() => setAddSectionOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-[#5c6ac4] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#4959b3]">
          <Plus className="h-3.5 w-3.5" /> Add section
        </button>
      </div>
      {page.sections.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[#c9cccf] py-12 text-center">
          <Layout className="mx-auto h-8 w-8 text-[#c9cccf]" />
          <p className="mt-3 text-[13px] text-[#8c9196]">No sections yet</p>
          <button onClick={() => setAddSectionOpen(true)} className="mt-3 rounded-lg bg-[#5c6ac4] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#4959b3]">
            Add your first section
          </button>
        </div>
      ) : (
        <div className="grid gap-1">
          {page.sections.map((section, idx) => {
            const def = getSectionDef(section.type);
            return (
              <div
                key={section.id}
                className={`group flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-all cursor-pointer ${
                  section.id === activeSection ? "border-[#5c6ac4] bg-[#f4f5f7] shadow-sm" : "border-[#e1e3e5] bg-white hover:border-[#c9cccf] hover:bg-[#f9fafb]"
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                <Grip className="h-3.5 w-3.5 shrink-0 text-[#c9cccf] cursor-grab" />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[13px] font-medium ${section.visible ? "text-[#202223]" : "text-[#8c9196] line-through"}`}>
                    {def?.label || section.type}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={(e) => { e.stopPropagation(); reorderSection(section.id, "up"); }} className="rounded p-1 text-[#6d7175] hover:bg-[#e1e3e5]" title="Move up" disabled={idx === 0}>
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); reorderSection(section.id, "down"); }} className="rounded p-1 text-[#6d7175] hover:bg-[#e1e3e5]" title="Move down" disabled={idx === page.sections.length - 1}>
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); toggleVis(section.id); }} className="rounded p-1 text-[#6d7175] hover:bg-[#e1e3e5]" title="Toggle">
                    {section.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); duplicateSection(section.id); }} className="rounded p-1 text-[#6d7175] hover:bg-[#e1e3e5]" title="Duplicate">
                    <Copy className="h-3 w-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); removeSection(section.id); }} className="rounded p-1 text-[#d72c0d] hover:bg-[#fff4f4]" title="Delete">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Add Section Modal (Shopify-style categorized) ────────── */

function AddSectionPanel() {
  const addSection = useBuilderStore((s) => s.addSection);
  const setAddSectionOpen = useBuilderStore((s) => s.setAddSectionOpen);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = [
    { id: "hero", label: "Hero & Banners", emoji: "🎯" },
    { id: "content", label: "Content", emoji: "📝" },
    { id: "product", label: "Products", emoji: "🛍️" },
    { id: "media", label: "Media", emoji: "🎬" },
    { id: "trust", label: "Trust & Social", emoji: "⭐" },
    { id: "form", label: "Forms", emoji: "📧" },
    { id: "utility", label: "Utility", emoji: "⚙️" },
  ];

  const filtered = sectionRegistry.filter((def) => {
    if (search && !def.label.toLowerCase().includes(search.toLowerCase()) && !def.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeCategory && def.category !== activeCategory) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl" style={{ maxHeight: "85vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e1e3e5] px-6 py-4">
          <h3 className="text-[16px] font-semibold text-[#202223]">Add section</h3>
          <button onClick={() => setAddSectionOpen(false)} className="rounded-lg p-1.5 text-[#6d7175] hover:bg-[#f4f6f8]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-[#e1e3e5] px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c9196]" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sections..."
              className="w-full rounded-lg border border-[#c9cccf] bg-[#f9fafb] py-2.5 pl-10 pr-4 text-[13px] focus:border-[#5c6ac4] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Category sidebar */}
          <div className="w-44 shrink-0 border-r border-[#e1e3e5] bg-[#f9fafb] py-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] transition-colors ${!activeCategory ? "bg-white font-semibold text-[#202223] shadow-sm" : "text-[#6d7175] hover:bg-white"}`}
            >
              All sections
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] transition-colors ${activeCategory === cat.id ? "bg-white font-semibold text-[#202223] shadow-sm" : "text-[#6d7175] hover:bg-white"}`}
              >
                <span className="text-[14px]">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Section grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid gap-2">
              {filtered.map((def) => (
                <button
                  key={def.type}
                  onClick={() => addSection(def.type)}
                  className="flex items-center gap-3 rounded-xl border border-[#e1e3e5] px-4 py-3 text-left transition-all hover:border-[#5c6ac4] hover:bg-[#f4f5f7] hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f4f6f8] text-[14px] text-[#6d7175]">
                    {def.icon.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#202223]">{def.label}</p>
                    <p className="text-[11px] text-[#8c9196] truncate">{def.description}</p>
                  </div>
                  <Plus className="h-4 w-4 shrink-0 text-[#8c9196]" />
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="py-8 text-center text-[13px] text-[#8c9196]">No sections match your search</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Sidebar ─────────────────────────────────────────── */

export function BuilderSidebar() {
  const sidebarTab = useBuilderStore((s) => s.sidebarTab);
  const setSidebarTab = useBuilderStore((s) => s.setSidebarTab);
  const addSectionOpen = useBuilderStore((s) => s.addSectionOpen);
  const activeSection = useBuilderStore((s) => s.activeSection);

  return (
    <>
      <div className="flex h-full w-[320px] shrink-0 flex-col border-r border-[#e1e3e5] bg-white">
        {/* Tabs */}
        {!activeSection && (
          <div className="flex border-b border-[#e1e3e5]">
            {([
              { id: "sections" as const, icon: Layout, label: "Sections" },
              { id: "theme" as const, icon: Palette, label: "Theme" },
            ]).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setSidebarTab(id)}
                className={`flex flex-1 items-center justify-center gap-2 py-3.5 text-[13px] font-semibold transition-colors ${
                  sidebarTab === id ? "border-b-2 border-[#5c6ac4] text-[#202223]" : "text-[#6d7175] hover:text-[#202223]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>
          {sidebarTab === "sections" ? <SectionList /> : <ThemeEditor />}
        </div>
      </div>

      {addSectionOpen && <AddSectionPanel />}
    </>
  );
}
