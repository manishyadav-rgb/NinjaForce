"use client";

import { Percent, Plus, Trash2, Tag, Coins, Calendar, Check, Copy, AlertCircle, CheckCircle2, Ticket, ArrowRight, ChevronDown } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useSiteContext, withSiteId } from "@/lib/site-context";
import { useAdminPermissions } from "@/lib/use-admin-permissions";

type Coupon = {
  id: string;
  code: string;
  discount_type: "percent" | "flat";
  discount_value: string;
  min_order_amount: string | null;
  max_discount_amount: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

export default function DiscountsPage() {
  const activeSiteId = useSiteContext((s) => s.activeSiteId);
  const { can } = useAdminPermissions();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"all" | "active" | "scheduled" | "expired" | "inactive">("all");

  const copyToClipboard = (c: string) => {
    navigator.clipboard.writeText(c).catch(() => {});
    setCopiedCode(c);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  async function loadCoupons() {
    setLoading(true);
    try {
      const res = await fetch(withSiteId("/api/admin/discounts", activeSiteId));
      const data = await res.json();
      setCoupons(data.coupons ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCoupons();
  }, [activeSiteId]);

  async function createCoupon() {
    if (!code.trim()) {
      setMessage("Coupon code is required.");
      return;
    }
    if (!Number(discountValue) || Number(discountValue) <= 0) {
      setMessage("Discount value must be greater than 0.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(withSiteId("/api/admin/discounts", activeSiteId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: activeSiteId,
          code,
          discount_type: discountType,
          discount_value: Number(discountValue),
          min_order_amount: minOrderAmount ? Number(minOrderAmount) : null,
          max_discount_amount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
          starts_at: startsAt || null,
          ends_at: endsAt || null,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save coupon");

      setCode("");
      setDiscountValue("");
      setMinOrderAmount("");
      setMaxDiscountAmount("");
      setStartsAt("");
      setEndsAt("");
      setIsActive(true);
      setMessage("Coupon saved successfully.");
      await loadCoupons();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCoupon(id: string) {
    if (!confirm("Delete this coupon?")) return;
    await fetch(withSiteId(`/api/admin/discounts?id=${id}`, activeSiteId), { method: "DELETE" });
    await loadCoupons();
  }

  const now = useMemo(() => new Date(), [coupons]);

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) return "inactive";
    const start = coupon.starts_at ? new Date(coupon.starts_at) : null;
    const end = coupon.ends_at ? new Date(coupon.ends_at) : null;
    
    if (start && start > now) return "scheduled";
    if (end && end < now) return "expired";
    return "active";
  };

  const stats = useMemo(() => {
    let active = 0;
    let scheduled = 0;
    let expired = 0;
    let inactive = 0;

    coupons.forEach((c) => {
      const status = getCouponStatus(c);
      if (status === "active") active++;
      else if (status === "scheduled") scheduled++;
      else if (status === "expired") expired++;
      else if (status === "inactive") inactive++;
    });

    return {
      total: coupons.length,
      active,
      scheduled,
      expiredInactive: expired + inactive,
    };
  }, [coupons, now]);

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      if (filterTab === "all") return true;
      return getCouponStatus(c) === filterTab;
    });
  }, [coupons, filterTab, now]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-text-main">Discount Coupons</h2>
          <p className="mt-1 text-xs text-text-soft">Create, manage, and monitor coupon codes for checkout discounts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left Side: Stats and Coupon Tickets List */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Stats widgets */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Total Coupons */}
            <div className="rounded-2xl border border-[#e1e3e5] bg-white p-4 shadow-soft flex flex-col justify-between h-[102px] hover:shadow-card transition-all">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold text-text-soft uppercase tracking-wider leading-snug">Total Coupons</span>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                  <Ticket className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-text-main leading-none mt-2">{stats.total}</p>
            </div>

            {/* Card 2: Active & Live */}
            <div className="rounded-2xl border border-[#e1e3e5] bg-white p-4 shadow-soft flex flex-col justify-between h-[102px] hover:shadow-card transition-all">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold text-text-soft uppercase tracking-wider leading-snug">Active & Live</span>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-text-main leading-none mt-2">{stats.active}</p>
            </div>

            {/* Card 3: Scheduled */}
            <div className="rounded-2xl border border-[#e1e3e5] bg-white p-4 shadow-soft flex flex-col justify-between h-[102px] hover:shadow-card transition-all">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold text-text-soft uppercase tracking-wider leading-snug">Scheduled</span>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-text-main leading-none mt-2">{stats.scheduled}</p>
            </div>

            {/* Card 4: Expired / Inactive */}
            <div className="rounded-2xl border border-[#e1e3e5] bg-white p-4 shadow-soft flex flex-col justify-between h-[102px] hover:shadow-card transition-all">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold text-text-soft uppercase tracking-wider leading-snug">Expired / Inactive</span>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                  <AlertCircle className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-text-main leading-none mt-2">{stats.expiredInactive}</p>
            </div>
          </div>

          {/* Coupon Ticket Panel */}
          <div className="rounded-2xl border border-[#e1e3e5] bg-white shadow-soft overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Saved Coupons</h3>
              
              {/* Tab Filters */}
              <div className="flex items-center gap-1.5 border-b border-[#e1e3e5] pb-px overflow-x-auto scrollbar-none">
                {(["all", "active", "scheduled", "expired", "inactive"] as const).map((tab) => {
                  const labels: Record<string, string> = {
                    all: "All Coupons",
                    active: "Active & Live",
                    scheduled: "Scheduled",
                    expired: "Expired",
                    inactive: "Inactive",
                  };
                  const active = filterTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setFilterTab(tab)}
                      className={`px-3 py-2 text-xs font-bold transition-all relative border-b-2 -mb-px whitespace-nowrap ${
                        active
                          ? "border-brand-primary text-brand-primary font-black"
                          : "border-transparent text-text-soft hover:text-text-main"
                      }`}
                    >
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List Body */}
            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-primary" />
                  <p className="text-xs text-text-soft">Loading coupons...</p>
                </div>
              ) : filteredCoupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50"><Percent className="h-7 w-7 text-gray-400" /></div>
                  <h4 className="mt-4 text-sm font-bold text-text-main">No coupons found</h4>
                  <p className="mt-1 text-xs text-text-soft max-w-xs">There are no coupons matching the selected filter tab.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5">
                  {filteredCoupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className={`relative flex rounded-2xl border bg-white shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group border-[#e1e3e5] ${
                        coupon.is_active ? "border-l-4 border-l-brand-primary" : "border-l-4 border-l-gray-300"
                      }`}
                    >
                      {/* Ticket Stub (Left side) */}
                      <div className={`flex flex-col items-center justify-center px-5 py-5 border-r border-dashed border-[#e1e3e5] min-w-[125px] text-center relative select-none ${
                        coupon.is_active ? "bg-brand-primary/[0.02]" : "bg-gray-50/50"
                      }`}>
                        {/* Physical ticket visual notched cutouts */}
                        <div className="absolute -top-[8px] -right-[8px] w-4 h-4 rounded-full bg-[#f6f6f7] border border-[#e1e3e5] z-10" />
                        <div className="absolute -bottom-[8px] -right-[8px] w-4 h-4 rounded-full bg-[#f6f6f7] border border-[#e1e3e5] z-10" />
                        
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full mb-2 ${
                          coupon.is_active ? "bg-brand-primary/10 text-brand-primary" : "bg-gray-200 text-gray-500"
                        }`}>
                          {coupon.discount_type === "percent" ? <Percent className="h-4 w-4" /> : <Coins className="h-4 w-4" />}
                        </div>
                        <span className={`text-2xl font-black tracking-tight leading-none ${
                          coupon.is_active ? "text-brand-primary" : "text-gray-500"
                        }`}>
                          {coupon.discount_type === "percent" ? `${Number(coupon.discount_value)}%` : `₹${Number(coupon.discount_value)}`}
                        </span>
                        <span className={`text-[8px] font-extrabold uppercase tracking-widest mt-1 ${
                          coupon.is_active ? "text-brand-primary/60" : "text-gray-400"
                        }`}>OFF</span>
                      </div>

                      {/* Ticket Main Details (Right side) */}
                      <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Coupon code label (interactive click-to-copy) */}
                              <button
                                onClick={() => copyToClipboard(coupon.code)}
                                className="group/code flex items-center gap-1.5 rounded-lg border border-brand-primary/20 bg-brand-primary/[0.04] px-2.5 py-1 text-xs font-bold text-brand-primary transition-all hover:bg-brand-primary/[0.08]"
                                title="Click to copy coupon code"
                              >
                                <span className="font-mono tracking-wider">{coupon.code}</span>
                                {copiedCode === coupon.code ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3 text-brand-primary/50 opacity-0 group-hover/code:opacity-100 transition-opacity" />
                                )}
                              </button>

                              {/* Validity status badge */}
                              {(() => {
                                const status = getCouponStatus(coupon);
                                if (status === "active") {
                                  return (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                                      <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                      Live
                                    </span>
                                  );
                                }
                                if (status === "scheduled") {
                                  return (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[9px] font-bold text-blue-700 border border-blue-200">
                                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                      Scheduled
                                    </span>
                                  );
                                }
                                if (status === "expired") {
                                  return (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[9px] font-bold text-rose-700 border border-rose-200">
                                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                      Expired
                                    </span>
                                  );
                                }
                                return (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-0.5 text-[9px] font-bold text-gray-600 border border-gray-200">
                                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                    Inactive
                                  </span>
                                );
                              })()}
                            </div>

                            {/* Terms and Restrictions */}
                            <div className="mt-3 flex flex-wrap gap-2">
                              {coupon.min_order_amount && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-[11px] text-text-muted">
                                  <span className="font-semibold text-text-main">Min Spend:</span> ₹{Number(coupon.min_order_amount).toLocaleString('en-IN')}
                                </span>
                              )}
                              {coupon.max_discount_amount && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-[11px] text-text-muted">
                                  <span className="font-semibold text-text-main">Max Discount:</span> ₹{Number(coupon.max_discount_amount).toLocaleString('en-IN')}
                                </span>
                              )}
                              {!coupon.min_order_amount && !coupon.max_discount_amount && (
                                <span className="text-[11px] text-text-soft italic">No restrictions on order amount</span>
                              )}
                            </div>
                          </div>

                          {/* Delete Action button (always visible and user-friendly) */}
                          {can("discounts.delete") && (
                            <button
                              onClick={() => deleteCoupon(coupon.id)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-100 bg-rose-50/50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors"
                              title="Delete coupon"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Dates validity details */}
                        <div className="mt-4 pt-3 border-t border-gray-100/60 flex items-center justify-between text-[11px] text-text-soft">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-text-soft" />
                            {coupon.starts_at || coupon.ends_at ? (
                              <div className="flex items-center gap-1">
                                <span>{coupon.starts_at ? new Date(coupon.starts_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "Always"}</span>
                                <ArrowRight className="h-3 w-3 text-text-soft" />
                                <span>{coupon.ends_at ? new Date(coupon.ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "No expiry"}</span>
                              </div>
                            ) : (
                              <span>Permanent (No dates specified)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Form (Sticky control panel) */}
        {can("discounts.create") && (
          <div className="xl:sticky xl:top-6 rounded-2xl border border-[#e1e3e5] bg-white p-6 shadow-soft space-y-5">
            <div>
              <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Create Coupon</h3>
              <p className="text-xs text-text-soft mt-0.5">Define discount rules and date limitations.</p>
            </div>

            <div className="space-y-4">
              {/* Coupon Code input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Coupon Code</label>
                <div className="relative rounded-xl border border-[#c9cccf] bg-white transition-all focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SAVE20"
                    className="h-11 w-full pl-[42px] pr-3 text-[13px] bg-transparent outline-none border-none font-mono uppercase tracking-wider placeholder:font-sans placeholder:tracking-normal"
                  />
                </div>
              </div>

              {/* Discount Type selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Discount Type</label>
                <div className="relative rounded-xl border border-[#c9cccf] bg-white transition-all focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary">
                  <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "percent" | "flat")}
                    className="h-11 w-full pl-[42px] pr-10 text-[13px] bg-transparent outline-none border-none cursor-pointer appearance-none"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (INR)</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Discount Value input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Discount Value</label>
                <div className="relative rounded-xl border border-[#c9cccf] bg-white transition-all focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary">
                  {discountType === "percent" ? (
                    <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  ) : (
                    <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  )}
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "percent" ? "e.g. 15" : "e.g. 250"}
                    className="h-11 w-full pl-[42px] pr-3 text-[13px] bg-transparent outline-none border-none"
                  />
                </div>
              </div>

              {/* Min Order input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Min Order Amount (Optional)</label>
                <div className="relative rounded-xl border border-[#c9cccf] bg-white transition-all focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary">
                  <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="number"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    placeholder="e.g. 999"
                    className="h-11 w-full pl-[42px] pr-3 text-[13px] bg-transparent outline-none border-none"
                  />
                </div>
              </div>

              {/* Max Discount input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Max Discount Amount (Optional)</label>
                <div className="relative rounded-xl border border-[#c9cccf] bg-white transition-all focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary">
                  <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="number"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="h-11 w-full pl-[42px] pr-3 text-[13px] bg-transparent outline-none border-none"
                  />
                </div>
              </div>

              {/* Starts At input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Starts At (Optional)</label>
                <div className="relative rounded-xl border border-[#c9cccf] bg-white transition-all focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="h-11 w-full pl-[42px] pr-3 text-[13px] bg-transparent outline-none border-none text-text-muted"
                  />
                </div>
              </div>

              {/* Ends At input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Ends At (Optional)</label>
                <div className="relative rounded-xl border border-[#c9cccf] bg-white transition-all focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="h-11 w-full pl-[42px] pr-3 text-[13px] bg-transparent outline-none border-none text-text-muted"
                  />
                </div>
              </div>

              {/* Toggle switch for Active status */}
              <div className="flex items-center justify-between py-2 border-t border-b border-gray-100/60">
                <div>
                  <label className="text-[12px] font-bold text-text-main block">Active Status</label>
                  <span className="text-[10px] text-text-soft block mt-0.5">Toggle to enable or disable usage.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? 'bg-[#008060]' : 'bg-gray-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Validation Message and Action Button */}
            <div className="space-y-3 pt-2">
              {message && (
                <div className={`p-3 rounded-xl flex items-start gap-2 text-xs border ${
                  message.toLowerCase().includes("success") || message.toLowerCase().includes("saved")
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}>
                  {message.toLowerCase().includes("success") || message.toLowerCase().includes("saved") ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{message}</span>
                </div>
              )}

              <button
                onClick={createCoupon}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-brand-primary text-sm font-bold text-white hover:bg-brand-secondary transition-all active:scale-[.98] disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Save Coupon</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
