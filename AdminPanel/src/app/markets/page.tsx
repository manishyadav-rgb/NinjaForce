import { Globe } from "lucide-react";

export default function MarketsPage() {
  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-xl font-semibold text-[#202223]">Markets</h2>
        <p className="mt-0.5 text-[13px] text-[#6d7175]">Manage markets and international selling</p>
      </div>
      <div className="rounded-lg border border-[#e1e3e5] bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#e3f1df] text-[#008060]">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-[#202223]">India (Primary)</h3>
            <p className="text-[13px] text-[#6d7175]">INR ₹ · English · Active</p>
          </div>
          <span className="ml-auto rounded-full bg-[#e3f1df] px-2.5 py-0.5 text-[11px] font-semibold text-[#008060]">Primary</span>
        </div>
      </div>
    </div>
  );
}
