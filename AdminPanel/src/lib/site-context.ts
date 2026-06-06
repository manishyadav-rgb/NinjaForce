/**
 * Multi-Tenant Site Context (Dynamic)
 * 
 * Sites are fetched from the database, not hardcoded.
 * Admin panel uses this to switch context.
 * The store auto-fetches sites on first mount.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SiteConfig {
  id: string;
  name: string;
  domain: string;
  logo: string;    // 2-letter abbreviation
  color: string;   // brand accent color
}

interface SiteContextStore {
  activeSiteId: string;
  sites: SiteConfig[];
  isLoading: boolean;
  setActiveSite: (siteId: string) => void;
  getActiveSite: () => SiteConfig;
  fetchSites: () => Promise<void>;
  addSite: (name: string, brandColor: string, domain?: string) => Promise<SiteConfig | null>;
}

const fallbackSites: SiteConfig[] = [
  {
    id: "homcot",
    name: "HOMCOT",
    domain: "homcot.in",
    logo: "HC",
    color: "#0A7A5A",
  },
  {
    id: "mybedzy",
    name: "myBEDZY",
    domain: "mybedzy.in",
    logo: "MB",
    color: "#7A4B2A",
  },
  {
    id: "quirkyhome",
    name: "QuirkyHome",
    domain: "quirkyhome.in",
    logo: "QH",
    color: "#008060",
  },
];

export const useSiteContext = create<SiteContextStore>()(
  persist(
    (set, get) => ({
      activeSiteId: "quirkyhome",
      sites: fallbackSites,
      isLoading: false,

      setActiveSite: (siteId: string) => set({ activeSiteId: siteId }),

      getActiveSite: () => {
        const { sites, activeSiteId } = get();
        return sites.find((s) => s.id === activeSiteId) || sites[0] || fallbackSites[0];
      },

      fetchSites: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/admin/sites");
          const data = await res.json();
          if (data.sites && data.sites.length > 0) {
            const mapped: SiteConfig[] = data.sites.map((s: any) => ({
              id: s.id,
              name: s.name,
              domain: s.domain || "",
              logo: s.logo_text || s.name.slice(0, 2).toUpperCase(),
              color: s.brand_color || "#008060",
            }));
            const currentActive = get().activeSiteId;
            const hasActive = mapped.some((site) => site.id === currentActive);
            set({
              sites: mapped,
              activeSiteId: hasActive ? currentActive : mapped[0].id,
            });
          }
        } catch {
          // Keep existing sites on error
        } finally {
          set({ isLoading: false });
        }
      },

      addSite: async (name: string, brandColor: string, domain?: string) => {
        try {
          const res = await fetch("/api/admin/sites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, brand_color: brandColor, domain: domain || "" }),
          });
          const data = await res.json();
          if (data.ok && data.site) {
            const newSite: SiteConfig = {
              id: data.site.id,
              name: data.site.name,
              domain: data.site.domain || "",
              logo: data.site.logo_text || name.slice(0, 2).toUpperCase(),
              color: data.site.brand_color || brandColor,
            };
            set((state) => ({ sites: [...state.sites, newSite] }));
            return newSite;
          }
          return null;
        } catch {
          return null;
        }
      },
    }),
    {
      name: "qh-admin-site-context",
      partialize: (state) => ({ activeSiteId: state.activeSiteId }),
    },
  ),
);

/** Helper to build API URL with site_id query param */
export function withSiteId(url: string, siteId?: string): string {
  const state = useSiteContext.getState();
  const id = siteId || state.getActiveSite().id;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}site_id=${id}`;
}
