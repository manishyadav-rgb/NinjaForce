"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BuilderLayout } from "@/components/builder/BuilderLayout";
import { PuckBuilderPanel } from "@/components/builder/PuckBuilderPanel";
import { ArrowLeft, Layout, Sparkles } from "lucide-react";

export default function BuilderPage() {
  const [mode, setMode] = useState<"legacy" | "puck">("legacy");
  const [loadingMode, setLoadingMode] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get("mode");
    if (requestedMode === "puck") {
      setMode("puck");
      setLoadingMode(false);
      return;
    }
    fetch("/api/admin/builder?site_id=quirkyhome", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const homePage = data?.schema?.pages?.home;
        const last = homePage?.lastPublishedBuilder;
        if (last === "advanced") setMode("puck");
        else setMode("legacy");
      })
      .finally(() => setLoadingMode(false));
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-background-muted flex flex-col">
      {/* Theme Switch Header */}
      <div className="flex items-center justify-between border-b border-border bg-background-elevated px-6 py-0 shadow-sm relative z-30 h-14 shrink-0">
        
        {/* Left Side: Back button & Title */}
        <div className="flex items-center gap-3">
          <a
            href="/online-store"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background-soft hover:bg-background-muted text-text-soft hover:text-text-main text-xs font-bold transition-all duration-200 active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Exit Builder</span>
          </a>
          <div className="h-4 w-[1px] bg-border" />
          <span className="text-sm font-black text-text-main tracking-tight font-display flex items-center gap-1.5">
            <Layout className="h-4 w-4 text-brand-primary" />
            Website Customizer
          </span>
        </div>

        {/* Center: Mode switcher tab */}
        <div className="flex items-center rounded-full bg-background-soft p-1 border border-border relative shadow-inner">
          {(["legacy", "puck"] as const).map((opt) => {
            const isActive = mode === opt;
            return (
              <button
                key={opt}
                onClick={() => setMode(opt)}
                className={`relative z-10 rounded-full px-5 py-1.5 text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                  isActive ? "text-text-inverse font-black" : "text-text-soft hover:text-text-main"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBuilderTab"
                    className="absolute inset-0 bg-brand-primary rounded-full -z-10 shadow-md"
                    transition={{ type: "spring", stiffness: 360, damping: 28 }}
                  />
                )}
                {opt === "legacy" ? (
                  <>
                    <Layout className={`h-3.5 w-3.5 ${isActive ? 'text-text-inverse' : 'text-text-soft'}`} />
                    <span>Legacy Customizer</span>
                  </>
                ) : (
                  <>
                    <Sparkles className={`h-3.5 w-3.5 ${isActive ? 'text-text-inverse animate-pulse' : 'text-text-soft'}`} />
                    <span>Visual Page Builder</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Side: Quick Site Preview Indicator */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Store
          </span>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-hidden relative">
        {loadingMode ? (
          <div className="flex h-full items-center justify-center bg-background-soft text-xs font-extrabold text-text-soft uppercase tracking-wider">
            Loading editor customizer...
          </div>
        ) : mode === "legacy" ? (
          <BuilderLayout />
        ) : (
          <PuckBuilderPanel />
        )}
      </div>
    </div>
  );
}
