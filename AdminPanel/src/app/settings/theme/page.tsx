"use client";

import { useState, useEffect } from "react";
import {
  Check, Palette, Sparkles, Moon, Waves, Crown, Leaf,
  Loader2, RotateCcw, Eye, ChevronDown, ChevronRight, Type, Layers, PaintBucket,
} from "lucide-react";
import {
  THEME_PRESETS, FONT_OPTIONS, resolveThemeTokens,
  type ThemeConfig, type ThemeTokens,
} from "@/lib/theme-definitions";
import { withSiteId } from "@/lib/site-context";

const ICON_MAP: Record<string, typeof Sparkles> = { Sparkles, Moon, Waves, Crown, Leaf };

const COLOR_GROUPS = [
  {
    label: "Brand Colors",
    desc: "Your store's primary identity colors",
    icon: Palette,
    gradient: "from-amber-500 to-orange-500",
    fields: [
      { key: "--color-brand-primary", label: "Primary", hint: "Buttons, links, CTA" },
      { key: "--color-brand-secondary", label: "Secondary", hint: "Hover states" },
      { key: "--color-brand-accent", label: "Accent", hint: "Highlights, badges" },
      { key: "--color-brand-ink", label: "Ink / Dark", hint: "Logo, headings" },
    ],
  },
  {
    label: "Background Colors",
    desc: "Page and component backgrounds",
    icon: Layers,
    gradient: "from-sky-500 to-blue-500",
    fields: [
      { key: "--color-bg-main", label: "Main Page", hint: "Body background" },
      { key: "--color-bg-soft", label: "Soft", hint: "Sections, bands" },
      { key: "--color-bg-muted", label: "Muted", hint: "Inactive areas" },
      { key: "--color-bg-elevated", label: "Card / Elevated", hint: "Cards, modals" },
      { key: "--color-bg-inverse", label: "Inverse", hint: "Footer, dark areas" },
    ],
  },
  {
    label: "Text Colors",
    desc: "Typography and content colors",
    icon: Type,
    gradient: "from-slate-600 to-slate-800",
    fields: [
      { key: "--color-text-main", label: "Main Text", hint: "Headings, body" },
      { key: "--color-text-muted", label: "Muted", hint: "Descriptions" },
      { key: "--color-text-soft", label: "Soft / Hint", hint: "Placeholders" },
      { key: "--color-text-inverse", label: "Inverse", hint: "On dark bg" },
    ],
  },
  {
    label: "Status & Border",
    desc: "Borders, sale tags, ratings",
    icon: PaintBucket,
    gradient: "from-emerald-500 to-teal-500",
    fields: [
      { key: "--color-border", label: "Border", hint: "Card borders" },
      { key: "--color-border-strong", label: "Strong Border", hint: "Active borders" },
      { key: "--color-sale", label: "Sale / Error", hint: "Sale badges" },
      { key: "--color-discount", label: "Discount / Success", hint: "Discount tags" },
      { key: "--color-rating", label: "Rating", hint: "Stars" },
      { key: "--color-focus", label: "Focus Ring", hint: "Accessibility" },
    ],
  },
];

const RADIUS_OPTIONS = [
  { label: "Sharp", value: "0" },
  { label: "Subtle", value: "0.25rem" },
  { label: "Small", value: "0.35rem" },
  { label: "Medium", value: "0.5rem" },
  { label: "Large", value: "0.75rem" },
  { label: "XL", value: "1rem" },
  { label: "2XL", value: "1.25rem" },
  { label: "Pill", value: "1.5rem" },
];

/* ── Big visual color picker swatch ── */
function ColorSwatch({ label, hint, value, onChange, presetValue }: {
  label: string; hint: string; value: string; onChange: (v: string) => void; presetValue: string;
}) {
  const isCustom = value.toLowerCase() !== presetValue.toLowerCase();
  return (
    <div className="group relative">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-transparent bg-[#fafafa] p-3 transition-all hover:border-violet-300 hover:bg-white hover:shadow-md">
        {/* Large clickable swatch */}
        <div className="relative">
          <div
            className="h-14 w-14 rounded-2xl border-2 border-white shadow-lg ring-1 ring-black/5 transition-transform group-hover:scale-110"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          {isCustom && (
            <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-white shadow">
              <span className="text-[8px] font-bold">✎</span>
            </div>
          )}
        </div>
        {/* Label */}
        <div className="text-center">
          <p className="text-[12px] font-semibold text-[#202223]">{label}</p>
          <p className="text-[10px] text-[#999]">{hint}</p>
        </div>
      </label>
      {/* Reset button */}
      {isCustom && (
        <button
          onClick={(e) => { e.stopPropagation(); onChange(presetValue); }}
          className="absolute -right-1 -bottom-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#999] shadow-md ring-1 ring-black/10 transition-all hover:bg-red-50 hover:text-red-500"
          title="Reset to preset"
        >
          <RotateCcw className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

/* ── Collapsible section ── */
function Section({ label, desc, icon: Icon, gradient, defaultOpen, children }: {
  label: string; desc: string; icon: typeof Palette; gradient: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e1e3e5] bg-white shadow-sm">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[#fafafa]">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <span className="text-[14px] font-bold text-[#202223]">{label}</span>
          <p className="text-[11px] text-[#999]">{desc}</p>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-[#999]" /> : <ChevronRight className="h-4 w-4 text-[#999]" />}
      </button>
      {open && <div className="border-t border-[#f0f0f0] px-5 pb-5 pt-4">{children}</div>}
    </div>
  );
}

/* ══════════════════ MAIN PAGE ══════════════════ */
export default function ThemeSettingsPage() {
  const [activePreset, setActivePreset] = useState("vibrant-sunshine");
  const [customOverrides, setCustomOverrides] = useState<Partial<ThemeTokens>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);

  const presetData = THEME_PRESETS.find((p) => p.id === activePreset) || THEME_PRESETS[0];
  const resolvedTokens = resolveThemeTokens({ activePreset, customOverrides });
  const overrideCount = Object.keys(customOverrides).length;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(withSiteId("/api/theme"));
        if (res.ok) {
          const d = await res.json();
          if (d.activePreset) setActivePreset(d.activePreset);
          if (d.customOverrides) setCustomOverrides(d.customOverrides);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  function selectPreset(id: string) { setActivePreset(id); setCustomOverrides({}); }

  function changeToken(key: string, value: string) {
    setCustomOverrides((prev) => {
      const p = THEME_PRESETS.find((t) => t.id === activePreset) || THEME_PRESETS[0];
      if (p.tokens[key]?.toLowerCase() === value.toLowerCase()) {
        const next = { ...prev }; delete next[key]; return next;
      }
      return { ...prev, [key]: value };
    });
  }

  async function handleSave() {
    setSaving(true); setSaved(false);
    try {
      const res = await fetch(withSiteId("/api/theme"), {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activePreset, customOverrides }),
      });
      if (!res.ok) throw new Error("Theme save failed");
      const data = await res.json();
      if (data?.warning) throw new Error(String(data.warning));
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save theme:", err);
      alert("Theme save failed. Please retry.");
    } finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#999]" /></div>;

  return (
    <div className="grid gap-6 pb-24">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg">
            <Palette className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#202223]">Theme Editor</h2>
            <p className="text-[13px] text-[#6d7175]">Pick a preset, then click any color swatch to customize</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {overrideCount > 0 && (
            <button onClick={() => setCustomOverrides({})} className="flex items-center gap-1.5 rounded-xl border border-[#e1e3e5] bg-white px-3 py-2 text-[12px] font-semibold text-[#6d7175] shadow-sm hover:border-red-300 hover:text-red-600">
              <RotateCcw className="h-3.5 w-3.5" /> Reset {overrideCount}
            </button>
          )}
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-[#008060] px-5 py-2.5 text-[13px] font-bold text-white shadow-lg hover:bg-[#006e52] disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? "Saving..." : "Save & Apply"}
          </button>
        </div>
      </div>

      {/* ── Preset Picker ── */}
      <div>
        <p className="mb-3 text-[12px] font-bold uppercase tracking-widest text-[#999]">Choose a Preset</p>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {THEME_PRESETS.map((preset) => {
            const isActive = activePreset === preset.id;
            const Icon = ICON_MAP[preset.icon] || Sparkles;
            return (
              <button key={preset.id} onClick={() => selectPreset(preset.id)}
                className={`group relative overflow-hidden rounded-2xl border-2 bg-white text-left shadow-sm transition-all duration-200 hover:shadow-lg ${isActive ? "border-[#008060] ring-2 ring-[#008060]/20" : "border-[#e1e3e5] hover:border-[#999]"}`}>
                <div className="flex h-16 items-end gap-1 p-2" style={{ background: `linear-gradient(135deg, ${preset.tokens["--color-bg-main"]}, ${preset.tokens["--color-bg-soft"]})` }}>
                  <div className="h-8 w-1/3 rounded-lg" style={{ backgroundColor: preset.tokens["--color-brand-primary"] }} />
                  <div className="h-11 w-1/3 rounded-lg border" style={{ backgroundColor: preset.tokens["--color-bg-elevated"], borderColor: preset.tokens["--color-border"] }} />
                  <div className="h-6 w-1/3 rounded-lg" style={{ backgroundColor: preset.tokens["--color-brand-accent"], opacity: 0.85 }} />
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ background: `linear-gradient(135deg, ${preset.tokens["--color-brand-primary"]}, ${preset.tokens["--color-brand-accent"]})` }}>
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                  <p className="flex-1 truncate text-[12px] font-bold text-[#202223]">{preset.name}</p>
                  {isActive && <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#008060]"><Check className="h-3 w-3 text-white" /></div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Live Preview ── */}
      <button onClick={() => setPreviewOpen(!previewOpen)} className="flex items-center gap-2.5 rounded-2xl border border-[#e1e3e5] bg-white px-5 py-3.5 text-left shadow-sm hover:shadow-md">
        <Eye className="h-4 w-4 text-violet-500" />
        <span className="flex-1 text-[14px] font-bold text-[#202223]">Live Preview</span>
        <span className="text-[11px] text-[#999]">See how your store will look</span>
        {previewOpen ? <ChevronDown className="h-4 w-4 text-[#999]" /> : <ChevronRight className="h-4 w-4 text-[#999]" />}
      </button>
      {previewOpen && (
        <div className="overflow-hidden rounded-2xl border shadow-xl" style={{ borderColor: resolvedTokens["--color-border"] }}>
          <div className="flex items-center gap-4 px-6 py-3" style={{ backgroundColor: resolvedTokens["--color-brand-accent"] }}>
            <span className="text-[20px] font-bold" style={{ color: resolvedTokens["--color-text-main"], fontFamily: resolvedTokens["--font-display"] }}>QuirkyHome</span>
            <div className="flex-1" />
            <div className="h-8 w-32 rounded-full border" style={{ backgroundColor: resolvedTokens["--color-bg-elevated"], borderColor: resolvedTokens["--color-border"] }} />
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-3" style={{ backgroundColor: resolvedTokens["--color-bg-main"] }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border p-4" style={{ backgroundColor: resolvedTokens["--color-bg-elevated"], borderColor: resolvedTokens["--color-border"], borderRadius: resolvedTokens["--radius-xl"] }}>
                <div className="mb-3 h-20 rounded-lg" style={{ backgroundColor: resolvedTokens["--color-bg-soft"], borderRadius: resolvedTokens["--radius-lg"] }} />
                <p className="text-[14px] font-bold" style={{ color: resolvedTokens["--color-text-main"], fontFamily: resolvedTokens["--font-primary"] }}>Product {i}</p>
                <p className="mt-1 text-[12px]" style={{ color: resolvedTokens["--color-text-muted"] }}>Premium decor</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[14px] font-bold" style={{ color: resolvedTokens["--color-brand-primary"] }}>₹1,299</span>
                  <span className="text-[11px] line-through" style={{ color: resolvedTokens["--color-text-soft"] }}>₹1,999</span>
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: resolvedTokens["--color-discount"] }}>35% off</span>
                </div>
                <button className="mt-3 w-full rounded-full py-2 text-[12px] font-bold text-white" style={{ backgroundColor: resolvedTokens["--color-brand-primary"] }}>Add to Cart</button>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 text-[11px]" style={{ backgroundColor: resolvedTokens["--color-bg-inverse"], color: resolvedTokens["--color-text-inverse"] }}>© 2026 QuirkyHome — Preview</div>
        </div>
      )}

      {/* ── Color Editor ── */}
      <div>
        <p className="mb-3 text-[12px] font-bold uppercase tracking-widest text-[#999]">Customize Colors</p>
        <p className="mb-4 text-[13px] text-[#6d7175]">👆 Click any color circle to open the color picker. No typing needed!</p>
        <div className="grid gap-3">
          {COLOR_GROUPS.map((group) => (
            <Section key={group.label} label={group.label} desc={group.desc} icon={group.icon} gradient={group.gradient} defaultOpen={group.label === "Brand Colors"}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {group.fields.map((f) => (
                  <ColorSwatch
                    key={f.key}
                    label={f.label}
                    hint={f.hint}
                    value={resolvedTokens[f.key]}
                    presetValue={presetData.tokens[f.key]}
                    onChange={(v) => changeToken(f.key, v)}
                  />
                ))}
              </div>
            </Section>
          ))}
        </div>
      </div>

      {/* ── Typography ── */}
      <div>
        <p className="mb-3 text-[12px] font-bold uppercase tracking-widest text-[#999]">Typography</p>
        <div className="rounded-2xl border border-[#e1e3e5] bg-white p-6 shadow-sm">
          <div className="grid gap-6 sm:grid-cols-2">
            {([["--font-primary", "Body Font", "Used for paragraphs and UI text"], ["--font-display", "Heading Font", "Used for titles and brand name"]] as const).map(([key, label, hint]) => (
              <div key={key}>
                <label className="mb-1 block text-[13px] font-bold text-[#202223]">{label}</label>
                <p className="mb-2 text-[11px] text-[#999]">{hint}</p>
                <select value={resolvedTokens[key]} onChange={(e) => changeToken(key, e.target.value)}
                  className="w-full rounded-xl border border-[#e1e3e5] bg-[#fafafa] px-4 py-3 text-[13px] text-[#202223] outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                  {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <div className="mt-3 rounded-xl border border-dashed border-[#e1e3e5] bg-[#fafafa] p-4">
                  <p className={`${key === "--font-display" ? "text-[22px] font-bold" : "text-[15px]"}`} style={{ fontFamily: resolvedTokens[key] }}>
                    {key === "--font-display" ? "QuirkyHome Heading Style" : "The quick brown fox jumps over the lazy dog. 0123456789"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Border Radius ── */}
      <div>
        <p className="mb-3 text-[12px] font-bold uppercase tracking-widest text-[#999]">Border Radius</p>
        <div className="rounded-2xl border border-[#e1e3e5] bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {(["--radius-sm", "--radius-md", "--radius-lg", "--radius-xl", "--radius-2xl"] as const).map((key) => (
              <div key={key}>
                <label className="mb-1.5 block text-[12px] font-bold text-[#6d7175]">
                  {key.replace("--radius-", "").toUpperCase()}
                </label>
                <select value={resolvedTokens[key]} onChange={(e) => changeToken(key, e.target.value)}
                  className="w-full rounded-xl border border-[#e1e3e5] bg-[#fafafa] px-3 py-2.5 text-[12px] outline-none focus:border-violet-400">
                  {RADIUS_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label} ({r.value})</option>)}
                </select>
                <div className="mt-2 flex justify-center">
                  <div className="h-12 w-full border-2 border-violet-300 bg-gradient-to-br from-violet-50 to-fuchsia-50" style={{ borderRadius: resolvedTokens[key] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Fixed bottom save bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:left-[220px]">
        <div className="border-t border-[#e1e3e5] bg-white/95 px-6 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {["--color-brand-primary", "--color-brand-accent", "--color-bg-main", "--color-text-main", "--color-border"].map((k) => (
                  <div key={k} className="h-5 w-5 rounded-full border border-white shadow-sm ring-1 ring-black/5" style={{ backgroundColor: resolvedTokens[k] }} />
                ))}
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#202223]">{presetData.name}</p>
                {overrideCount > 0 && <p className="text-[11px] text-violet-500">{overrideCount} custom change{overrideCount > 1 ? "s" : ""}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {saved && <span className="flex items-center gap-1 text-[12px] font-semibold text-[#008060]"><Check className="h-3.5 w-3.5" /> Applied to storefront!</span>}
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-[#008060] px-5 py-2.5 text-[13px] font-bold text-white shadow-lg hover:bg-[#006e52] disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? "Saving..." : "Save & Apply"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
