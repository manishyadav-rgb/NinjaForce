/**
 * Builder Canvas — Responsive Container-Query Preview
 * 
 * Uses CSS container queries so that when device mode changes
 * (desktop → tablet → mobile), all responsive layouts inside
 * the preview actually respond to the container width,
 * not the browser viewport.
 */

"use client";

import React from "react";
import { useBuilderStore } from "@/lib/builder/store";
import { sectionComponentMap } from "./SectionPreviews";
import { getSectionDef } from "@/lib/builder/registry";

export function BuilderCanvas() {
  const schema = useBuilderStore((s) => s.schema);
  const activePage = useBuilderStore((s) => s.activePage);
  const activeSection = useBuilderStore((s) => s.activeSection);
  const setActiveSection = useBuilderStore((s) => s.setActiveSection);
  const deviceMode = useBuilderStore((s) => s.deviceMode);

  const theme = schema.themeSettings;
  const page = schema.pages[activePage];

  if (!page) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#6d7175]">
        No page selected
      </div>
    );
  }

  // Map theme settings to ACTUAL CSS custom property names from tokens.css
  const cssVars: Record<string, string> = {
    "--color-brand-primary": theme.colors.primary,
    "--color-brand-secondary": theme.colors.secondary,
    "--color-brand-accent": theme.colors.accent,
    "--color-bg-main": theme.colors.background,
    "--color-bg-soft": theme.colors.surface,
    "--color-bg-elevated": theme.colors.elevated,
    "--color-text-main": theme.colors.text,
    "--color-text-muted": theme.colors.textMuted,
    "--color-border": theme.colors.border,
    "--font-primary": theme.typography.fontFamily,
    "--font-display": theme.typography.headingFamily,
    "--font-size-base": theme.typography.baseSize,
    "--font-weight-bold": theme.typography.headingWeight,
    "--space-12": theme.spacing.sectionPadding,
    "--container-max": theme.spacing.containerMax,
    "--radius-xl": theme.spacing.borderRadius,
  };

  const deviceConfig: Record<string, { width: string; label: string }> = {
    desktop: { width: "100%", label: "Desktop" },
    tablet: { width: "768px", label: "Tablet · 768px" },
    mobile: { width: "375px", label: "Mobile · 375px" },
  };

  const { width: canvasWidth, label: deviceLabel } = deviceConfig[deviceMode] || deviceConfig.desktop;
  const visibleSections = page.sections.filter((section) => section.visible);
  const topBanner = visibleSections.find((section) => section.type === "BannerStrip");
  const mainSections = visibleSections.filter((section) => section.type !== "BannerStrip");

  return (
    <div className="flex-1 overflow-auto bg-[#e8e8e8]" onClick={() => setActiveSection(null)}>
      {/* Device label */}
      {deviceMode !== "desktop" && (
        <div className="pt-3 text-center">
          <span className="rounded-full bg-[#333] px-3 py-1 text-[11px] font-medium text-white/70">
            {deviceLabel}
          </span>
        </div>
      )}

      <div
        className="mx-auto my-4 rounded-lg shadow-xl transition-all duration-500 ease-out"
        style={{ maxWidth: canvasWidth, minHeight: "80vh" }}
      >
        {/* 
          This wrapper is a CSS CONTAINER (container-type: inline-size).
          All responsive rules inside use @container queries instead of @media,
          so they respond to THIS container's width, not the browser viewport.
        */}
        <div
          style={{
            ...cssVars,
            containerType: "inline-size",
            backgroundColor: "var(--color-bg-main)",
            color: "var(--color-text-main)",
            fontFamily: "var(--font-primary)",
            fontSize: "var(--font-size-base)",
          } as React.CSSProperties}
          className="builder-preview-container overflow-hidden rounded-lg"
        >
          {visibleSections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-sm text-gray-400">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <p className="mt-3">No sections yet — click <strong>Add section</strong> to start building</p>
            </div>
          ) : (
            <>
              {topBanner ? (
                <div
                  onClick={(e) => { e.stopPropagation(); setActiveSection(topBanner.id); }}
                  className={`group/section qh-builder-section relative cursor-pointer transition-all duration-150 ${topBanner.id === activeSection ? "" : "hover:outline hover:outline-2 hover:outline-[#5c6ac4]/30 hover:outline-offset-[-2px]"}`}
                  style={{
                    outline: topBanner.id === activeSection ? "2px solid #5c6ac4" : undefined,
                    outlineOffset: topBanner.id === activeSection ? "-2px" : undefined,
                  }}
                >
                  {(() => {
                    const BannerComponent = sectionComponentMap[topBanner.type];
                    if (!BannerComponent) return null;
                    return <BannerComponent settings={topBanner.settings} />;
                  })()}
                </div>
              ) : null}

              {mainSections.map((section) => {
              const Component = sectionComponentMap[section.type];
              if (!Component) return null;
              const isActive = section.id === activeSection;
              const def = getSectionDef(section.type);

              const s = section.settings;
              const wrapperStyle: React.CSSProperties = {
                outline: isActive ? "2px solid #5c6ac4" : undefined,
                outlineOffset: isActive ? "-2px" : undefined,
              };
              if (s.sectionPaddingTop !== undefined) wrapperStyle.paddingTop = `${s.sectionPaddingTop}px`;
              if (s.sectionPaddingBottom !== undefined) wrapperStyle.paddingBottom = `${s.sectionPaddingBottom}px`;
              if (s.sectionBgColor) wrapperStyle.backgroundColor = s.sectionBgColor;

                return (
                <div
                  key={section.id}
                  onClick={(e) => { e.stopPropagation(); setActiveSection(section.id); }}
                  className={`group/section qh-builder-section relative cursor-pointer transition-all duration-150 ${isActive ? "" : "hover:outline hover:outline-2 hover:outline-[#5c6ac4]/30 hover:outline-offset-[-2px]"}`}
                  style={wrapperStyle}
                >
                  {isActive && (
                    <div className="absolute -top-3 right-3 z-30 flex items-center gap-1 overflow-hidden rounded-md border border-[#4959b3] bg-[#5c6ac4] shadow-lg">
                      <button onClick={(e) => { e.stopPropagation(); useBuilderStore.getState().duplicateSection(section.id); }} className="p-1.5 text-white hover:bg-[#4959b3]" title="Duplicate">
                        <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      </button>
                      <div className="h-4 w-px bg-[#4959b3]" />
                      <button onClick={(e) => { e.stopPropagation(); useBuilderStore.getState().removeSection(section.id); }} className="p-1.5 text-[#ffd7d7] hover:bg-[#d72c0d] hover:text-white" title="Delete">
                        <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </button>
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute -top-0.5 left-3 z-20 flex items-center gap-1.5 rounded-b-md bg-[#5c6ac4] px-2.5 py-1 text-[11px] font-semibold text-white shadow-md">
                      <span>{def?.label || section.type}</span>
                    </div>
                  )}
                  {!isActive && (
                    <div className="absolute -top-0.5 left-3 z-20 flex items-center gap-1.5 rounded-b-md bg-[#1a1a1a]/80 px-2.5 py-1 text-[11px] font-medium text-white shadow-md opacity-0 backdrop-blur-sm transition-opacity group-hover/section:opacity-100">
                      {def?.label || section.type}
                    </div>
                  )}
                  <Component settings={section.settings} />
                </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
