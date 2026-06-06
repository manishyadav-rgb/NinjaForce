/**
 * Builder Top Bar — Shopify-style with device preview, page switcher, save
 */

"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, Eye, Loader2, Monitor, Plus, Redo2, Save, Smartphone, Tablet, Trash2, Undo2 } from "lucide-react";
import { useBuilderStore } from "@/lib/builder/store";
import { useSiteContext } from "@/lib/site-context";

export function BuilderTopBar() {
  const schema = useBuilderStore((s) => s.schema);
  const activePage = useBuilderStore((s) => s.activePage);
  const setActivePage = useBuilderStore((s) => s.setActivePage);
  const addPage = useBuilderStore((s) => s.addPage);
  const removePage = useBuilderStore((s) => s.removePage);
  const isDirty = useBuilderStore((s) => s.isDirty);
  const markClean = useBuilderStore((s) => s.markClean);
  const deviceMode = useBuilderStore((s) => s.deviceMode);
  const setDeviceMode = useBuilderStore((s) => s.setDeviceMode);
  const activeSiteId = useSiteContext((s) => s.activeSiteId);
  const sites = useSiteContext((s) => s.sites);
  const activeSite = sites.find((s) => s.id === activeSiteId) || sites[0];

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pageDropdown, setPageDropdown] = useState(false);
  const [newPageName, setNewPageName] = useState("");

  async function handleSave() {
    setSaving(true);
    try {
      const nextSchema: any = structuredClone(schema);
      const page = nextSchema?.pages?.[activePage];
      if (page) {
        page.lastPublishedBuilder = "legacy";
        page.lastPublishedAt = new Date().toISOString();
      }
      const res = await fetch("/api/admin/builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: nextSchema, site_id: activeSiteId }),
      });
      if (res.ok) {
        markClean();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleAddPage() {
    if (!newPageName.trim()) return;
    const slug = newPageName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) return;
    if (schema.pages[slug]) return;
    addPage(slug, newPageName);
    setNewPageName("");
    setPageDropdown(false);
  }

  function handleDeletePage(pageId: string, pageName: string) {
    if (pageId === "home") return;
    if (!confirm(`Delete page "${pageName}"? This action cannot be undone.`)) return;
    removePage(pageId);
  }

  const pages = Object.entries(schema.pages);
  const currentPage = schema.pages[activePage];
  const storefrontBaseUrl = (process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3001").replace(/\/+$/, "");
  const viewHref = currentPage?.slug === "home"
    ? `${storefrontBaseUrl}/`
    : `${storefrontBaseUrl}/${currentPage?.slug || ""}`;

  return (
    <div className="flex h-[56px] items-center justify-between border-b border-[#333] bg-[#1a1a1a] px-4">
      {/* Left — Back + Page Switcher */}
      <div className="flex items-center gap-3">
        <a
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[11px] font-bold text-white transition-colors hover:bg-[#333]"
          style={{ backgroundColor: activeSite?.color || "#008060" }}
          title="Back to admin"
        >
          {activeSite?.logo || "QH"}
        </a>

        {/* Page Dropdown */}
        <div className="relative">
          <button
            onClick={() => setPageDropdown(!pageDropdown)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-white/90 transition-colors hover:bg-[#333] hover:text-white"
          >
            <span>{currentPage?.name || "Select page"}</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#a6acb2]" />
          </button>

          {pageDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPageDropdown(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-xl border border-[#333] bg-[#1a1a1a] shadow-2xl">
                <div className="border-b border-[#333] px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#888]">Pages ({pages.length})</p>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {pages.map(([id, page]) => (
                    <div
                      key={id}
                      className={`group flex items-center gap-2 px-3 py-2.5 text-[13px] transition-colors hover:bg-[#333] ${id === activePage ? "bg-[#2a2a2a] font-semibold text-white" : "text-[#aaa]"}`}
                    >
                      <button
                        onClick={() => { setActivePage(id); setPageDropdown(false); }}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <Monitor className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{page.name}</span>
                      </button>
                      {id !== "home" && (
                        <button
                          onClick={() => handleDeletePage(id, page.name)}
                          className="rounded-md p-1 text-[#777] opacity-0 transition hover:bg-[#402727] hover:text-[#ff9f9f] group-hover:opacity-100"
                          title={`Delete ${page.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#333] px-3 py-2.5">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#888]">Add Page</div>
                  <div className="flex gap-1.5">
                    <input
                      type="text" value={newPageName} onChange={(e) => setNewPageName(e.target.value)}
                      placeholder="New page name"
                      className="flex-1 rounded-lg border border-[#444] bg-[#2a2a2a] px-2.5 py-1.5 text-[12px] text-white placeholder:text-[#666] focus:border-[#5c6ac4] focus:outline-none"
                      onKeyDown={(e) => e.key === "Enter" && handleAddPage()}
                    />
                    <button
                      onClick={handleAddPage}
                      disabled={!newPageName.trim()}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#5c6ac4] px-2.5 py-1.5 text-[12px] font-semibold text-white hover:bg-[#4959b3] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center — Device Preview */}
      <div className="flex items-center gap-1 rounded-lg bg-[#2a2a2a] p-1">
        {([
          { mode: "desktop" as const, icon: Monitor, label: "Desktop" },
          { mode: "tablet" as const, icon: Tablet, label: "Tablet" },
          { mode: "mobile" as const, icon: Smartphone, label: "Mobile" },
        ]).map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setDeviceMode(mode)}
            className={`rounded-md p-2 transition-all ${deviceMode === mode ? "bg-[#5c6ac4] text-white shadow-md" : "text-[#888] hover:text-white"}`}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {/* Right — Status + Save */}
      <div className="flex items-center gap-3">
        <a
          href={viewHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-[#333] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#333]"
          title="View page in storefront"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View
        </a>
        {isDirty && (
          <span className="rounded-full bg-[#ffd79d]/20 px-3 py-1 text-[11px] font-semibold text-[#ffd79d]">
            Unsaved changes
          </span>
        )}
        {saved && (
          <span className="rounded-full bg-[#36b37e]/20 px-3 py-1 text-[11px] font-semibold text-[#36b37e]">
            ✓ Published
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="flex items-center gap-2 rounded-lg bg-[#5c6ac4] px-5 py-2 text-[13px] font-semibold text-white shadow-lg transition-all hover:bg-[#4959b3] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Publishing..." : "Save"}
        </button>
      </div>
    </div>
  );
}
