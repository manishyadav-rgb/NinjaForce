import { Monitor, ExternalLink, Paintbrush } from "lucide-react";
import Link from "next/link";

export default function OnlineStorePage() {
  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-xl font-semibold text-[#202223]">Online Store</h2>
        <p className="mt-0.5 text-[13px] text-[#6d7175]">Manage your storefront</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[#e1e3e5] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <h3 className="font-semibold text-[#202223]">Theme</h3>
          <p className="mt-1 text-[13px] text-[#6d7175]">QuirkyHome Default — Active</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-full bg-[#e3f1df] px-2.5 py-0.5 text-[11px] font-semibold text-[#008060]">Live</span>
            <span className="rounded-full bg-[#f4f6f8] px-2.5 py-0.5 text-[11px] font-semibold text-[#6d7175]">v1.0</span>
          </div>
          <Link
            href="/builder"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#008060] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.2)] transition-colors hover:bg-[#006e52]"
          >
            <Paintbrush className="h-3.5 w-3.5" />
            Customize
          </Link>
        </div>
        <a href="/" target="_blank" className="group rounded-lg border border-[#e1e3e5] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-all hover:border-[#008060]">
          <h3 className="flex items-center gap-2 font-semibold text-[#202223]">
            Visit Store <ExternalLink className="h-4 w-4 text-[#6d7175] group-hover:text-[#008060]" />
          </h3>
          <p className="mt-1 text-[13px] text-[#6d7175]">quirkyhome.in</p>
        </a>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {["Pages", "Navigation", "Preferences"].map((item) => (
          <div key={item} className="rounded-lg border border-[#e1e3e5] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <h3 className="font-semibold text-[#202223]">{item}</h3>
            <p className="mt-1 text-[13px] text-[#6d7175]">Manage {item.toLowerCase()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
