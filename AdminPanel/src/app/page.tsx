"use client";

import { ArrowUpRight, Boxes, Heart, Package, ShoppingBag, Users, Layers, Sparkles, CheckCircle2, ChevronRight, Settings, Loader2, Plus } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useSiteContext, withSiteId } from "@/lib/site-context";
import { useAdminPermissions } from "@/lib/use-admin-permissions";
import { motion } from "framer-motion";

type Stats = {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalCarts: number;
  totalWishlists: number;
};

const iconMap: Record<string, React.ElementType> = {
  Products: Package,
  Users: Users,
  Orders: ShoppingBag,
  Carts: Boxes,
  Wishlists: Heart,
};

const colorMap: Record<string, string> = {
  Products: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  Users: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  Orders: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  Carts: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
  Wishlists: "text-rose-500 bg-rose-500/10 border-rose-500/20",
};

export default function AdminDashboardPage() {
  const { can } = useAdminPermissions();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const activeSiteId = useSiteContext((s) => s.activeSiteId);

  useEffect(() => {
    fetch(withSiteId("/api/admin/stats", activeSiteId))
      .then((response) => response.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setStats(null);
        setLoading(false);
      });
  }, [activeSiteId]);

  const cards = useMemo(() => [
    { label: "Products", value: stats?.totalProducts ?? 0 },
    { label: "Users", value: stats?.totalUsers ?? 0 },
    { label: "Orders", value: stats?.totalOrders ?? 0 },
    { label: "Carts", value: stats?.totalCarts ?? 0 },
    { label: "Wishlists", value: stats?.totalWishlists ?? 0 },
  ], [stats]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const completedStepsCount = useMemo(() => {
    const steps = [
      (stats?.totalProducts ?? 0) > 0,
      true, // categories
      false, // payments
      false, // shipping
    ];
    return steps.filter(Boolean).length;
  }, [stats]);
  const progressPercent = (completedStepsCount / 4) * 100;

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 px-2 py-4">
      {/* Header section (greeting + action) */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between pb-6 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Store Overview
            </div>
          </div>
          <h1 className="mt-2 text-xl font-extrabold tracking-tight text-text-main font-display">
            {greeting}, Admin
          </h1>
          <p className="mt-1 text-xs font-semibold text-text-muted">
            Here's a snapshot of what's happening with your store today.
          </p>
        </div>

        {can("products.create") && (
          <a
            href="/add-product"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand-primary text-text-inverse px-5 py-2.5 text-xs font-bold transition-all shadow-md hover:bg-brand-secondary active:scale-95 duration-200"
          >
            <Plus className="h-4 w-4" />
            Add product
          </a>
        )}
      </div>

      {/* Metrics Card Grid */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card, index) => {
          const Icon = iconMap[card.label] || Package;
          const colorClasses = colorMap[card.label] || "text-brand-primary bg-brand-primary/10 border-brand-primary/20";
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              className="group rounded-3xl border border-border bg-background-elevated p-5 flex flex-col justify-between min-h-[130px] hover:shadow-soft transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${colorClasses}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-text-soft opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              
              <div className="mt-4">
                {loading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-background-soft" />
                ) : (
                  <p className="text-2xl font-black text-text-main font-display">{card.value}</p>
                )}
                <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-text-soft">{card.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {can("products.view") && (
          <a
            href="/products"
            className="group rounded-3xl border border-border bg-background-elevated p-5 flex flex-col justify-between min-h-[100px] transition-all hover:border-brand-primary/40 hover:shadow-soft duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background-soft text-text-soft transition-colors group-hover:bg-brand-primary/10 group-hover:text-brand-primary border border-transparent group-hover:border-brand-primary/10">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-text-main group-hover:text-brand-primary transition-colors">Manage Products</p>
                <p className="text-xs text-text-soft font-semibold mt-0.5">View, edit, and catalog inventory.</p>
              </div>
            </div>
          </a>
        )}

        {can("orders.view") && (
          <a
            href="/orders"
            className="group rounded-3xl border border-border bg-background-elevated p-5 flex flex-col justify-between min-h-[100px] transition-all hover:border-brand-secondary/40 hover:shadow-soft duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background-soft text-text-soft transition-colors group-hover:bg-brand-secondary/10 group-hover:text-brand-secondary border border-transparent group-hover:border-brand-secondary/10">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-text-main group-hover:text-brand-secondary transition-colors">View Orders</p>
                <p className="text-xs text-text-soft font-semibold mt-0.5">Track storefront sales and deliveries.</p>
              </div>
            </div>
          </a>
        )}

        {can("customers.view") && (
          <a
            href="/customers"
            className="group rounded-3xl border border-border bg-background-elevated p-5 flex flex-col justify-between min-h-[100px] transition-all hover:border-purple-500/40 hover:shadow-soft duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background-soft text-text-soft transition-colors group-hover:bg-purple-500/10 group-hover:text-purple-500 border border-transparent group-hover:border-purple-500/10">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-text-main group-hover:text-purple-500 transition-colors">Customers</p>
                <p className="text-xs text-text-soft font-semibold mt-0.5">Manage users and check registrations.</p>
              </div>
            </div>
          </a>
        )}
      </div>

      {/* Getting Started Onboarding Progress Checklist */}
      <div className="rounded-3xl border border-border bg-background-elevated overflow-hidden shadow-sm">
        {/* Header with Progress Bar */}
        <div className="border-b border-border bg-background-soft px-6 py-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-black text-text-main font-display">Setup Guide</h3>
              <p className="text-xs text-text-muted mt-0.5">Complete these steps to prepare your store for customers.</p>
            </div>
            <span className="text-xs font-black text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
              {completedStepsCount}/4 Done
            </span>
          </div>
          {/* Progress bar line */}
          <div className="w-full h-2 bg-background-muted rounded-full overflow-hidden border border-border/40 mt-3 relative">
            <motion.div
              className="h-full bg-brand-primary rounded-full absolute left-0 top-0"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
        
        {/* Checklist Rows */}
        <div className="divide-y divide-border/60">
          {[
            {
              title: "Add your first product to the store",
              desc: "Add details, pricing, and images for your inventory items.",
              done: (stats?.totalProducts ?? 0) > 0,
              href: can("products.create") ? "/add-product" : "/products",
              actionLabel: "Add Product"
            },
            {
              title: "Set up your store categories",
              desc: "Organize products into bedding, bath, and furnishing groups.",
              done: true,
              href: "/categories",
              actionLabel: "Manage"
            },
            {
              title: "Configure payment methods",
              desc: "Select payment providers to accept customer transactions.",
              done: false,
              href: "/settings",
              actionLabel: "Setup Payments"
            },
            {
              title: "Set up shipping zones",
              desc: "Define where you deliver and setup standard shipping fees.",
              done: false,
              href: "/settings",
              actionLabel: "Configure"
            },
          ].map((step, idx) => {
            return (
              <a
                key={step.title}
                href={step.href}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4.5 transition-colors hover:bg-background-soft/30 group"
              >
                <div className="flex items-start gap-4">
                  {/* Status Indicator circle */}
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-black transition-all mt-0.5 ${
                      step.done
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-border bg-background-soft text-text-soft group-hover:border-brand-primary/40 group-hover:text-brand-primary"
                    }`}
                  >
                    {step.done ? (
                      <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  
                  {/* Text details */}
                  <div className="space-y-0.5 min-w-0">
                    <p className={`text-xs font-extrabold ${
                      step.done ? "text-text-soft line-through" : "text-text-main group-hover:text-brand-primary transition-colors"
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-[11px] text-text-soft font-semibold leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>

                {/* Right Action button */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {step.done ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-border bg-background-elevated px-3 text-[10px] font-black text-text-main group-hover:bg-brand-primary group-hover:text-text-inverse group-hover:border-brand-primary transition-all duration-150">
                      <span>{step.actionLabel}</span>
                      <ChevronRight className="h-3 w-3 transform group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
