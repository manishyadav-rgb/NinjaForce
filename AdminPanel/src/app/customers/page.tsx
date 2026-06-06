"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { 
  ArrowRight, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Mail, 
  Phone, 
  Search, 
  ShoppingCart, 
  Users, 
  Loader2, 
  TrendingUp, 
  UserCheck, 
  ShoppingBag,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Customer {
  id: string;
  phone_e164: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  total_orders: number;
  paid_orders_count: number;
  pending_orders_count: number;
  latest_payment_status: string | null;
  cart_items: { quantity: number }[];
  wishlist_items: unknown[];
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "buyers" | "active-carts">("all");

  const fetchCustomers = async (searchQuery = "") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) return;
      const data = await res.json();
      setCustomers(data.customers || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const totalCustomersCount = customers.length;
  const totalItemsInCarts = customers.reduce((acc, c) => acc + c.cart_items.reduce((sum, item) => sum + item.quantity, 0), 0);
  const buyersCount = customers.filter(c => c.total_orders > 0).length;

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const getAvatarGradient = (name: string | null) => {
    if (!name) return "from-slate-400 to-slate-500 text-white";
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
      "from-violet-500 to-purple-600 text-white",
      "from-sky-400 to-blue-600 text-white",
      "from-emerald-400 to-teal-600 text-white",
      "from-rose-400 to-pink-600 text-white",
      "from-amber-400 to-orange-600 text-white",
      "from-indigo-500 to-purple-700 text-white",
    ];
    return gradients[hash % gradients.length];
  };

  const filteredCustomers = customers.filter((cust) => {
    if (activeTab === "buyers") {
      return cust.total_orders > 0;
    }
    if (activeTab === "active-carts") {
      return cust.cart_items && cust.cart_items.length > 0;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 px-4 py-6">
      {/* Header */}
      <div className="pb-6 border-b border-border/60 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-primary">
              <Sparkles className="h-3 w-3 animate-pulse" />
              CRM Platform
            </div>
          </div>
          <h1 className="mt-2 text-xl font-extrabold tracking-tight text-text-main font-display">Customers Directory</h1>
          <p className="mt-1.5 text-xs font-semibold text-text-muted">
            Manage registered store users, track checkout cart items, and monitor customer lifetime value.
          </p>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-3">
        {/* Metric 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-3xl border border-border bg-background-elevated p-6 flex items-center justify-between gap-4 hover:shadow-glow hover:border-brand-primary/30 transition-all duration-300 group"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary group-hover:scale-110 transition-transform duration-200">
              <Users className="h-6 w-6" />
            </span>
            <div>
              <div className="text-2xl font-black text-text-main font-display">{totalCustomersCount}</div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-soft">Total Customers</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
            <TrendingUp className="h-3 w-3" />
            <span>Active</span>
          </div>
        </motion.div>

        {/* Metric 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-3xl border border-border bg-background-elevated p-6 flex items-center justify-between gap-4 hover:shadow-glow hover:border-indigo-500/30 transition-all duration-300 group"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform duration-200">
              <UserCheck className="h-6 w-6" />
            </span>
            <div>
              <div className="text-2xl font-black text-text-main font-display">{buyersCount}</div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-soft">Paying Customers</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full shrink-0">
            {totalCustomersCount > 0 ? `${Math.round((buyersCount / totalCustomersCount) * 100)}%` : "0%"} Conversion
          </div>
        </motion.div>

        {/* Metric 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="rounded-3xl border border-border bg-background-elevated p-6 flex items-center justify-between gap-4 hover:shadow-glow hover:border-pink-500/30 transition-all duration-300 group"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-500 group-hover:scale-110 transition-transform duration-200">
              <ShoppingCart className="h-6 w-6" />
            </span>
            <div>
              <div className="text-2xl font-black text-text-main font-display">{totalItemsInCarts}</div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-soft">Live Cart Items</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-pink-500 bg-pink-500/10 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
            <ShoppingBag className="h-3 w-3" />
            <span>Pending</span>
          </div>
        </motion.div>
      </div>

      {/* Filter and Search Layout Container */}
      <div className="flex flex-col gap-4">
        {/* Toolbar Grid: Search on left, filter tabs on right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-border bg-background-elevated p-4 shadow-soft">
          {/* Search form bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void fetchCustomers(search);
            }}
            className="flex items-center gap-2 flex-1 w-full max-w-xl"
          >
            <div className="flex items-center gap-2.5 rounded-full border border-border bg-background-soft px-4 py-2.5 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15 transition-all duration-200 flex-1">
              <Search className="h-4 w-4 text-text-soft shrink-0" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border-none bg-transparent text-xs font-bold text-text-main placeholder-text-soft focus:outline-none focus:ring-0 p-0"
              />
            </div>
            
            <button
              type="submit"
              className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-full bg-brand-primary text-text-inverse px-5 text-xs font-bold hover:bg-brand-secondary transition-all active:scale-95 duration-150 shadow-soft shrink-0"
            >
              <span>Search</span>
            </button>
          </form>

          {/* Filter Tabs */}
          <div className="flex items-center bg-background-soft p-1 rounded-full border border-border shrink-0 self-start lg:self-auto">
            {[
              { id: "all", label: "All Users" },
              { id: "buyers", label: "Buyers" },
              { id: "active-carts", label: "Active Carts" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className="relative px-4 py-1.5 text-xs font-extrabold rounded-full transition-colors duration-200 text-text-muted hover:text-text-main"
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeCustomerTab"
                    className="absolute inset-0 bg-background-elevated rounded-full border border-border/80 shadow-soft"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Catalog List / Rows Table */}
        <div className="rounded-3xl border border-border bg-background-elevated shadow-soft overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
              <p className="mt-3.5 text-xs font-extrabold text-text-soft uppercase tracking-wider">Retrieving customers registry...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="h-14 w-14 rounded-3xl bg-background-soft border border-border flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-text-soft" />
              </div>
              <p className="text-sm font-extrabold text-text-main">No customers found</p>
              <p className="mt-1 text-xs text-text-muted max-w-md mx-auto">
                No customer matching the current filter filters. Try searching with another query or register active checkout actions.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {/* Header Titles on Desktop */}
              <div className="hidden md:grid grid-cols-12 items-center px-6 py-3.5 bg-background-soft/50 text-[10px] font-black uppercase tracking-wider text-text-soft border-b border-border/50">
                <div className="col-span-4">Customer Info</div>
                <div className="col-span-3">Contact Details</div>
                <div className="col-span-2">Order Activity</div>
                <div className="col-span-2">Latest Status</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              <AnimatePresence mode="popLayout">
                {filteredCustomers.map((cust, index) => {
                  const status = (cust.latest_payment_status || "none").toLowerCase();
                  const initials = getInitials(cust.full_name);
                  const avatarGradient = getAvatarGradient(cust.full_name);
                  
                  return (
                    <motion.div
                      key={cust.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.25, delay: index * 0.02 }}
                      className="grid gap-4 px-6 py-5 md:grid-cols-12 md:items-center hover:bg-background-soft/20 transition-all duration-200 group"
                    >
                      {/* Name + Join Date details */}
                      <div className="md:col-span-4 flex items-center gap-3.5 min-w-0">
                        {/* Initial badge / Avatar */}
                        <div className={`h-11 w-11 rounded-2xl bg-gradient-to-tr ${avatarGradient} font-black uppercase text-sm flex items-center justify-center shrink-0 shadow-soft border border-black/10 group-hover:scale-105 transition-transform duration-200`}>
                          {initials}
                        </div>
                        
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-sm font-extrabold text-text-main truncate group-hover:text-brand-primary transition-colors duration-150">
                            {cust.full_name || "Unnamed Customer"}
                          </p>
                          <p className="inline-flex items-center gap-1 text-[10px] text-text-soft font-semibold">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>Joined {new Date(cust.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </p>
                        </div>
                      </div>

                      {/* Contact fields details */}
                      <div className="space-y-1 text-xs text-text-muted font-semibold md:col-span-3 min-w-0">
                        <p className="inline-flex items-center gap-1.5 truncate w-full text-text-main">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-text-soft" />
                          <span>{cust.phone_e164}</span>
                        </p>
                        {cust.email ? (
                          <p className="inline-flex items-center gap-1.5 truncate w-full hover:text-brand-primary transition-colors">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-text-soft" />
                            <span>{cust.email}</span>
                          </p>
                        ) : (
                          <p className="text-[10px] text-text-soft italic pl-5">No email associated</p>
                        )}
                      </div>

                      {/* Orders Count statistics */}
                      <div className="md:col-span-2 space-y-0.5 shrink-0">
                        <p className="text-sm font-extrabold text-text-main">{cust.total_orders} Orders</p>
                        <p className="text-[10px] font-bold text-text-soft">
                          {cust.paid_orders_count} paid, {cust.pending_orders_count} pending
                        </p>
                      </div>

                      {/* Latest payment status badge */}
                      <div className="md:col-span-2 shrink-0">
                        {status === "paid" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500">
                            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>Paid</span>
                          </span>
                        ) : status === "pending" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>Pending</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-border bg-background-soft px-3 py-1 text-xs font-semibold text-text-soft">
                            No orders
                          </span>
                        )}
                      </div>

                      {/* Profile link button */}
                      <div className="md:col-span-1 md:text-right shrink-0">
                        <Link
                          href={`/customers/${cust.id}`}
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-border bg-background-elevated px-3.5 text-xs font-bold text-text-main hover:bg-brand-primary hover:text-text-inverse hover:border-transparent transition-all shadow-soft active:scale-95 duration-200"
                        >
                          <span>Profile</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

