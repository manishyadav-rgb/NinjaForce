"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { 
  ArrowLeft, 
  Calendar, 
  Coins, 
  Heart, 
  Mail, 
  Phone, 
  ShoppingCart, 
  Ticket, 
  Loader2,
  ShoppingBag,
  Sparkles,
  Gift,
  CheckCircle,
  Clock,
  ArrowRight,
  User
} from "lucide-react";
import { motion } from "framer-motion";

interface CartItem {
  product_slug: string;
  product_title: string;
  product_image: string | null;
  unit_price: string | null;
  quantity: number;
}

interface WishlistItem {
  product_slug: string;
  product_title: string;
  product_image: string | null;
  unit_price: string | null;
}

interface OrderItem {
  product_slug: string;
  product_title: string;
  product_image: string | null;
  unit_price: string;
  quantity: number;
  line_total: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  grand_total: string;
  created_at: string;
  items: OrderItem[];
}

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
  cart_items: CartItem[];
  wishlist_items: WishlistItem[];
}

interface RewardsSummary {
  balance: number;
  earned: number;
  redeemed: number;
  rewardCouponCount: number;
  unusedRewardCouponCount: number;
}

function badgeStyle(status: string) {
  const s = status.toLowerCase();
  if (s === "paid" || s === "success") {
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  }
  if (s === "pending" || s === "hold") {
    return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  }
  return "bg-rose-500/10 text-rose-500 border-rose-500/20";
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rewards, setRewards] = useState<RewardsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!customerId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/customers/${customerId}`);
        if (!res.ok) return;
        const data = await res.json();
        setCustomer(data.customer || null);
        setOrders(data.orders || []);
        setRewards(data.rewards || null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [customerId]);

  const orderRevenue = useMemo(
    () => orders.reduce((sum, ord) => sum + Number.parseFloat(ord.grand_total || "0"), 0),
    [orders]
  );

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-background-elevated rounded-3xl border border-border shadow-soft">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        <p className="mt-3.5 text-xs font-extrabold text-text-soft uppercase tracking-wider">Loading customer profile details...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <Link href="/customers" className="inline-flex items-center gap-2 text-xs font-extrabold text-brand-primary hover:text-brand-secondary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>
        <div className="rounded-3xl border border-border bg-background-elevated p-8 text-center shadow-soft">
          <User className="h-10 w-10 text-text-soft mx-auto mb-3" />
          <p className="text-sm font-extrabold text-text-main">Customer profile not found</p>
          <p className="mt-1 text-xs text-text-muted">The requested customer record does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const initials = getInitials(customer.full_name);
  const avatarGradient = getAvatarGradient(customer.full_name);

  return (
    <div className="space-y-6 mx-auto max-w-[1440px] px-2 py-4">
      {/* Back & Breadcrumb navigation */}
      <div className="flex flex-col gap-3">
        <Link 
          href="/customers" 
          className="inline-flex w-fit items-center gap-2 text-xs font-extrabold text-text-soft hover:text-brand-primary transition-colors duration-150"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>
        
        {/* Profile Hero Header Card */}
        <div className="rounded-3xl border border-border/80 bg-gradient-to-r from-brand-primary/10 via-background-elevated to-brand-primary/5 p-6 shadow-soft flex flex-col sm:flex-row items-center gap-5">
          <div className={`h-16 w-16 rounded-3xl bg-gradient-to-tr ${avatarGradient} font-black uppercase text-xl flex items-center justify-center shadow-soft border border-black/10 shrink-0`}>
            {initials}
          </div>
          
          <div className="min-w-0 space-y-1.5 text-center sm:text-left">
            <h1 className="text-xl font-extrabold tracking-tight text-text-main font-display">
              {customer.full_name || "Unnamed Customer"}
            </h1>
            
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs font-semibold text-text-muted">
              <span className="inline-flex items-center gap-1 text-text-main"><Phone className="h-3.5 w-3.5 text-text-soft" />{customer.phone_e164}</span>
              {customer.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-text-soft" />{customer.email}</span>}
              <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-text-soft" />Joined {new Date(customer.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Orders */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="rounded-3xl border border-border bg-background-elevated p-5 flex items-center justify-between shadow-soft hover:shadow-glow hover:border-brand-primary/30 transition-all duration-300 group"
        >
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-soft">Total Orders</p>
            <p className="mt-1 text-2xl font-black text-text-main font-display">{customer.total_orders}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary group-hover:scale-110 transition-transform">
            <ShoppingBag className="h-5 w-5" />
          </span>
        </motion.div>

        {/* Metric 2: Revenue */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="rounded-3xl border border-border bg-background-elevated p-5 flex items-center justify-between shadow-soft hover:shadow-glow hover:border-emerald-500/30 transition-all duration-300 group"
        >
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-soft">Revenue</p>
            <p className="mt-1 text-2xl font-black text-text-main font-display">Rs {orderRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
            <Coins className="h-5 w-5" />
          </span>
        </motion.div>

        {/* Metric 3: Quirky Coins */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="rounded-3xl border border-border bg-background-elevated p-5 flex items-center justify-between shadow-soft hover:shadow-glow hover:border-indigo-500/30 transition-all duration-300 group"
        >
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-soft">Quirky Coins</p>
            <p className="mt-1 text-2xl font-black text-text-main font-display">{rewards?.balance ?? 0}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </span>
        </motion.div>

        {/* Metric 4: Reward Coupons */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
          className="rounded-3xl border border-border bg-background-elevated p-5 flex items-center justify-between shadow-soft hover:shadow-glow hover:border-pink-500/30 transition-all duration-300 group"
        >
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-soft">Unused Coupons</p>
            <p className="mt-1 text-2xl font-black text-text-main font-display">{rewards?.unusedRewardCouponCount ?? 0}/{rewards?.rewardCouponCount ?? 0}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-500 group-hover:scale-110 transition-transform">
            <Ticket className="h-5 w-5" />
          </span>
        </motion.div>
      </div>

      {/* Main content columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Order History list */}
        <div className="rounded-3xl border border-border bg-background-elevated shadow-soft overflow-hidden">
          <div className="border-b border-border bg-background-soft/60 px-5 py-4 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-text-main">Order History</span>
            <span className="text-[10px] font-bold text-text-soft bg-background-soft px-2.5 py-1 rounded-full border border-border">
              {orders.length} items
            </span>
          </div>
          
          <div className="max-h-[580px] space-y-3 overflow-y-auto p-5 custom-scrollbar">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-8 w-8 text-text-soft mx-auto mb-2.5" />
                <p className="text-xs font-extrabold text-text-main">No orders placed yet</p>
                <p className="text-[10px] text-text-soft mt-1">This user account hasn't checkout any invoice orders.</p>
              </div>
            ) : (
              orders.map((ord) => (
                <div key={ord.id} className="rounded-2xl border border-border bg-background-soft/30 p-4 space-y-3 hover:border-brand-primary/25 hover:bg-background-soft/10 transition-all duration-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                    <p className="text-xs font-extrabold text-text-main">Order #{ord.order_number}</p>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${badgeStyle(ord.payment_status)}`}>
                      {ord.payment_status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] text-text-soft font-semibold">
                    <p>{new Date(ord.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                    <p className="text-text-main font-bold">Rs {Number.parseFloat(ord.grand_total || "0").toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                  </div>
                  
                  <div className="space-y-1.5 pt-1">
                    {ord.items.map((it, idx) => (
                      <div key={`${ord.id}-${idx}`} className="flex items-center justify-between text-xs font-semibold text-text-muted">
                        <span className="truncate max-w-[80%]">{it.product_title}</span>
                        <span className="shrink-0 text-[10px] font-extrabold text-text-soft bg-background-soft px-1.5 py-0.5 rounded border border-border/50">
                          x{it.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Quirky Coins + Cart + Wishlist widgets */}
        <div className="space-y-6">
          {/* Widget 1: Reward Coins statistics */}
          <div className="rounded-3xl border border-border bg-background-elevated shadow-soft overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border bg-background-soft/60 px-5 py-3.5">
              <Coins className="h-4 w-4 text-indigo-500 animate-pulse shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-text-main">Quirky Rewards Details</span>
            </div>
            
            <div className="grid gap-3 p-5 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-background-soft/30 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-soft">Available</p>
                <p className="mt-1 text-lg font-black text-text-main font-display">{rewards?.balance ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background-soft/30 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-soft">Total Earned</p>
                <p className="mt-1 text-lg font-black text-text-main font-display">{rewards?.earned ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background-soft/30 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-soft">Redeemed</p>
                <p className="mt-1 text-lg font-black text-text-main font-display">{rewards?.redeemed ?? 0}</p>
              </div>
            </div>
            
            <div className="border-t border-border/60 bg-background-soft/20 px-5 py-3 text-[10px] font-semibold text-text-soft flex items-center gap-1.5">
              <Ticket className="h-3.5 w-3.5 text-text-soft shrink-0" />
              <span>{rewards?.unusedRewardCouponCount ?? 0} active reward coupons available out of {rewards?.rewardCouponCount ?? 0} total.</span>
            </div>
          </div>

          {/* Widget 2: Live Cart Snapshot */}
          <div className="rounded-3xl border border-border bg-background-elevated shadow-soft overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border bg-background-soft/60 px-5 py-3.5">
              <ShoppingCart className="h-4 w-4 text-brand-primary shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-text-main">Active Shopping Cart</span>
            </div>
            
            <div className="max-h-[240px] overflow-y-auto p-5 space-y-2.5 custom-scrollbar">
              {customer.cart_items.length === 0 ? (
                <p className="text-xs font-semibold text-text-soft italic text-center py-4">The shopping cart is currently empty.</p>
              ) : (
                customer.cart_items.map((it, idx) => (
                  <div key={`${it.product_slug}-${idx}`} className="rounded-2xl border border-border bg-background-soft/30 p-3 flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-text-main truncate">{it.product_title}</p>
                      <p className="text-[10px] font-semibold text-text-soft mt-0.5">
                        {it.unit_price ? `Rs ${Number.parseFloat(it.unit_price).toLocaleString("en-IN", { maximumFractionDigits: 0 })} each` : "Price details missing"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-black text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full">
                      Qty {it.quantity}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Widget 3: Wishlist Snapshot */}
          <div className="rounded-3xl border border-border bg-background-elevated shadow-soft overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border bg-background-soft/60 px-5 py-3.5">
              <Heart className="h-4 w-4 text-rose-500 shrink-0 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-text-main">Customer Wishlist</span>
            </div>
            
            <div className="max-h-[240px] overflow-y-auto p-5 space-y-2.5 custom-scrollbar">
              {customer.wishlist_items.length === 0 ? (
                <p className="text-xs font-semibold text-text-soft italic text-center py-4">The wishlist is currently empty.</p>
              ) : (
                customer.wishlist_items.map((it, idx) => (
                  <div key={`${it.product_slug}-${idx}`} className="rounded-2xl border border-border bg-background-soft/30 p-3 flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-text-main truncate">{it.product_title}</p>
                      <p className="text-[10px] font-semibold text-text-soft truncate mt-0.5">Slug: {it.product_slug}</p>
                    </div>
                    
                    <Link
                      href={`/builder?slug=${it.product_slug}`}
                      className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-xl bg-background-elevated border border-border text-text-soft hover:text-brand-primary hover:border-brand-primary/30 transition-colors shadow-soft"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
