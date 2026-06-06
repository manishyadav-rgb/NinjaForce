"use client";

import { useEffect, useMemo, useState } from "react";

type BannerSettings = {
  text?: string;
  bgColor?: string;
  textColor?: string;
  link?: string;
};

export function AnnouncementBar() {
  const [settings, setSettings] = useState<BannerSettings | null>(null);

  useEffect(() => {
    fetch("/api/admin/builder", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const sections = data?.schema?.pages?.home?.sections;
        if (!Array.isArray(sections)) return;
        const banner = sections.find((s: any) => s?.visible && s?.type === "BannerStrip");
        if (!banner?.settings?.text) {
          setSettings(null);
          return;
        }
        const cleanText = String(banner.settings.text)
          .replace(/â‚¹/g, "Rs. ")
          .replace(/Ã—/g, "x");
        setSettings({
          text: cleanText,
          bgColor: banner.settings.bgColor || "#008060",
          textColor: banner.settings.textColor || "#ffffff",
          link: banner.settings.link || "",
        });
      })
      .catch(() => {});
  }, []);

  if (!settings?.text) return null;

  const content = useMemo(
    () => (
      <div
        className="w-full px-3 py-2 text-center text-sm font-bold leading-none md:text-[13px]"
        style={{ backgroundColor: settings.bgColor || "#008060", color: settings.textColor || "#ffffff" }}
      >
        {settings.text}
      </div>
    ),
    [settings],
  );

  if (settings.link) {
    return (
      <a href={settings.link} className="block no-underline">
        {content}
      </a>
    );
  }

  return content;
}

