"use client";

import Link from "next/link";
import { Settings, Store, CreditCard, Truck, Globe, Shield, Bell, Palette, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const sections = [
  { icon: Palette, label: "Theme Settings", desc: "Storefront theme and color scheme", href: "/settings/theme", highlight: true },
  { icon: Store, label: "Store details", desc: "Store name, contact, address", href: "#" },
  { icon: CreditCard, label: "Payments", desc: "Payment providers and methods", href: "#" },
  { icon: Truck, label: "Shipping", desc: "Shipping rates and zones", href: "#" },
  { icon: Globe, label: "Domains", desc: "Custom domains and URLs", href: "#" },
  { icon: Shield, label: "Policies", desc: "Return, privacy, terms policies", href: "#" },
  { icon: Bell, label: "Notifications", desc: "Email and SMS notifications", href: "#" },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-2 py-4">
      {/* Header */}
      <div className="pb-6 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-primary">
            <Settings className="h-3.5 w-3.5" />
            Configurations
          </div>
        </div>
        <h1 className="mt-2 text-xl font-extrabold tracking-tight text-text-main font-display">Settings</h1>
        <p className="mt-1 text-xs font-semibold text-text-muted">
          Manage your storefront layout configurations, payments, shipping profiles, custom domains, and policy declarations.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s, index) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
            >
              <Link
                href={s.href}
                className={`group cursor-pointer rounded-3xl border bg-background-elevated p-5 flex flex-col justify-between min-h-[140px] transition-all hover:shadow-soft duration-200 ${
                  s.highlight
                    ? "border-brand-primary/40 ring-1 ring-brand-primary/5 hover:border-brand-primary"
                    : "border-border hover:border-brand-primary/40"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon container */}
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 shrink-0 ${
                      s.highlight
                        ? "bg-brand-primary text-text-inverse shadow-md scale-105"
                        : "bg-background-soft text-text-soft group-hover:bg-brand-primary/10 group-hover:text-brand-primary"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-sm text-text-main group-hover:text-brand-primary transition-colors">
                        {s.label}
                      </span>
                      {s.highlight && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider bg-brand-primary/15 text-brand-primary">
                          Configured
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-soft font-semibold leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/30 text-[10px] font-black text-text-soft uppercase tracking-wider group-hover:text-brand-primary transition-colors">
                  <span>Manage Profile</span>
                  <ChevronRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
