/**
 * BuilderLayout — Main Page Builder Interface
 * 
 * Split-screen layout: TopBar + Sidebar + Canvas.
 * Loads saved schema from API on mount, filtered by active site_id.
 */

"use client";

import { useEffect, useState } from "react";
import { BuilderTopBar } from "./BuilderTopBar";
import { BuilderSidebar } from "./BuilderSidebar";
import { BuilderCanvas } from "./BuilderCanvas";
import { useBuilderStore } from "@/lib/builder/store";
import { useSiteContext } from "@/lib/site-context";

export function BuilderLayout() {
  const loadSchema = useBuilderStore((s) => s.loadSchema);
  const activeSiteId = useSiteContext((s) => s.activeSiteId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Load saved schema from API filtered by site_id
    fetch(`/api/admin/builder?site_id=${activeSiteId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.schema) {
          loadSchema(data.schema);
        }
      })
      .catch(() => {
        // Use defaults
      })
      .finally(() => setLoading(false));
  }, [loadSchema, activeSiteId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f6f6f7]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#e1e3e5] border-t-[#008060]" />
          <p className="mt-3 text-[13px] text-[#6d7175]">Loading builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f6f6f7]">
      <BuilderTopBar />
      <div className="flex flex-1 overflow-hidden">
        <BuilderSidebar />
        <BuilderCanvas />
      </div>
    </div>
  );
}
