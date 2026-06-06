/**
 * QuirkyHome Visual Page Builder — Zustand Store (Shopify-style)
 */

import { create } from "zustand";
import type { BuilderSchema, PageConfig, Section, ThemeSettings } from "./types";
import { sectionRegistry } from "./registry";

/* ─── Default Theme (matches tokens.css variable names) ─────── */

const defaultTheme: ThemeSettings = {
  colors: {
    primary: "#111111",
    secondary: "#5f3f00",
    accent: "#ffd86f",
    background: "#fffdf7",
    surface: "#fff4cf",
    elevated: "#ffffff",
    text: "#111111",
    textMuted: "#555555",
    border: "#e8e0d0",
  },
  typography: {
    fontFamily: "Arial, Helvetica, sans-serif",
    headingFamily: "Arial, Helvetica, sans-serif",
    baseSize: "1rem",
    headingWeight: "700",
  },
  spacing: {
    sectionPadding: "3rem",
    containerMax: "1200px",
    borderRadius: "0.5rem",
  },
};

/* ─── Default Pages ────────────────────────────────────────── */

function uid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const defaultPages: Record<string, PageConfig> = {
  home: {
    name: "Home Page",
    slug: "home",
    sections: (() => {
      const types = ["HeroBanner", "SearchBand", "CategoryGrid", "CollectionsSection", "ProductGrid", "PromisesSection", "Newsletter", "SeoArticle"];
      return types.map((type) => {
        const def = sectionRegistry.find((s) => s.type === type);
        return def ? { id: uid(), type: def.type, visible: true, settings: { ...def.defaultSettings } } : null;
      }).filter(Boolean) as Section[];
    })(),
  },
};

/* ─── Store Interface ──────────────────────────────────────── */

interface BuilderStore {
  schema: BuilderSchema;
  activePage: string;
  activeSection: string | null;
  sidebarTab: "sections" | "theme";
  addSectionOpen: boolean;
  isDirty: boolean;
  deviceMode: "desktop" | "tablet" | "mobile";

  updateTheme: (path: string, value: any) => void;
  setActivePage: (pageId: string) => void;
  addPage: (pageId: string, name: string) => void;
  removePage: (pageId: string) => void;
  setActiveSection: (sectionId: string | null) => void;
  addSection: (type: string) => void;
  updateSection: (sectionId: string, key: string, value: any) => void;
  removeSection: (sectionId: string) => void;
  reorderSection: (sectionId: string, direction: "up" | "down") => void;
  toggleSectionVisibility: (sectionId: string) => void;
  duplicateSection: (sectionId: string) => void;
  setSidebarTab: (tab: "sections" | "theme") => void;
  setAddSectionOpen: (open: boolean) => void;
  setDeviceMode: (mode: "desktop" | "tablet" | "mobile") => void;
  loadSchema: (schema: BuilderSchema) => void;
  markClean: () => void;
}

/* ─── Store Implementation ─────────────────────────────────── */

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  schema: { themeSettings: defaultTheme, pages: defaultPages },
  activePage: "home",
  activeSection: null,
  sidebarTab: "sections",
  addSectionOpen: false,
  isDirty: false,
  deviceMode: "desktop",

  updateTheme(path, value) {
    set((state) => {
      const schema = structuredClone(state.schema);
      const keys = path.split(".");
      let obj: any = schema.themeSettings;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return { schema, isDirty: true };
    });
  },

  setActivePage(pageId) { set({ activePage: pageId, activeSection: null }); },

  addPage(pageId, name) {
    set((state) => {
      const schema = structuredClone(state.schema);
      schema.pages[pageId] = { name, slug: pageId, sections: [] };
      return { schema, activePage: pageId, activeSection: null, isDirty: true };
    });
  },

  removePage(pageId) {
    set((state) => {
      if (Object.keys(state.schema.pages).length <= 1) return {};
      const schema = structuredClone(state.schema);
      delete schema.pages[pageId];
      const nextPage = Object.keys(schema.pages)[0];
      return { schema, activePage: nextPage, activeSection: null, isDirty: true };
    });
  },

  setActiveSection(sectionId) {
    set({ activeSection: sectionId, sidebarTab: sectionId ? "sections" : get().sidebarTab });
  },

  addSection(type) {
    const def = sectionRegistry.find((s) => s.type === type);
    if (!def) return;
    set((state) => {
      const schema = structuredClone(state.schema);
      const page = schema.pages[state.activePage];
      const newSection: Section = { id: uid(), type: def.type, visible: true, settings: { ...def.defaultSettings } };
      page.sections.push(newSection);
      return { schema, activeSection: newSection.id, addSectionOpen: false, isDirty: true };
    });
  },

  updateSection(sectionId, key, value) {
    set((state) => {
      const schema = structuredClone(state.schema);
      const page = schema.pages[state.activePage];
      const section = page.sections.find((s) => s.id === sectionId);
      if (section) section.settings[key] = value;
      return { schema, isDirty: true };
    });
  },

  removeSection(sectionId) {
    set((state) => {
      const schema = structuredClone(state.schema);
      const page = schema.pages[state.activePage];
      page.sections = page.sections.filter((s) => s.id !== sectionId);
      return { schema, activeSection: state.activeSection === sectionId ? null : state.activeSection, isDirty: true };
    });
  },

  reorderSection(sectionId, direction) {
    set((state) => {
      const schema = structuredClone(state.schema);
      const sections = schema.pages[state.activePage].sections;
      const idx = sections.findIndex((s) => s.id === sectionId);
      if (idx < 0) return {};
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= sections.length) return {};
      [sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]];
      return { schema, isDirty: true };
    });
  },

  toggleSectionVisibility(sectionId) {
    set((state) => {
      const schema = structuredClone(state.schema);
      const section = schema.pages[state.activePage].sections.find((s) => s.id === sectionId);
      if (section) section.visible = !section.visible;
      return { schema, isDirty: true };
    });
  },

  duplicateSection(sectionId) {
    set((state) => {
      const schema = structuredClone(state.schema);
      const page = schema.pages[state.activePage];
      const idx = page.sections.findIndex((s) => s.id === sectionId);
      if (idx < 0) return {};
      const clone: Section = { ...structuredClone(page.sections[idx]), id: uid() };
      page.sections.splice(idx + 1, 0, clone);
      return { schema, activeSection: clone.id, isDirty: true };
    });
  },

  setSidebarTab(tab) { set({ sidebarTab: tab }); },
  setAddSectionOpen(open) { set({ addSectionOpen: open }); },
  setDeviceMode(mode) { set({ deviceMode: mode }); },

  loadSchema(schema) {
    // Migrate old schemas missing 'elevated' / 'accent' fields
    const c = schema.themeSettings?.colors as any;
    if (c && !c.elevated) c.elevated = c.surface || "#ffffff";
    if (c && !c.accent) c.accent = "#ffd86f";

    // Normalize Heading section size for older schemas.
    for (const page of Object.values(schema.pages || {})) {
      for (const section of page.sections || []) {
        if (section?.type !== "Heading") continue;
        const raw = Number(section.settings?.fontSize);
        section.settings.fontSize = Number.isFinite(raw) && raw >= 22 && raw <= 48 ? raw : 22;
      }
    }

    set({ schema, isDirty: false, activePage: Object.keys(schema.pages)[0] || "home", activeSection: null });
  },
  markClean() { set({ isDirty: false }); },
}));
