"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  MapPin,
  User,
  Package,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useAdminPermissions } from "@/lib/use-admin-permissions";

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
  subtotal: string;
  discount_total?: string;
  discount_percent?: string | null;
  coupon_code?: string | null;
  shipping_total: string;
  grand_total: string;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_pincode: string | null;
  notes: string | null;
  placed_at: string | null;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  items: OrderItem[] | null;
}

interface Metrics {
  today: { count: number; revenue: number };
  yesterday: { count: number; revenue: number };
}

interface Pagination {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminOrdersPage() {
  const { can } = useAdminPermissions();
  const [orders, setOrders] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    today: { count: 0, revenue: 0 },
    yesterday: { count: 0, revenue: 0 },
  });
  const [pagination, setPagination] = useState<Pagination>({
    totalCount: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchText, setSearchText] = useState("");

  // Default date bounds: last 7 days to today
  const getPastDateString = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0];
  };

  const [startDate, setStartDate] = useState(getPastDateString(7));
  const [endDate, setEndDate] = useState(getPastDateString(0));
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Memoized client-side search logic
  const filteredOrders = useMemo(() => {
    if (!searchText.trim()) return orders;
    const q = searchText.toLowerCase().trim();
    return orders.filter((ord) => {
      const orderNumber = ord.order_number?.toLowerCase() || "";
      const customerName = ord.customer_name?.toLowerCase() || "";
      const shippingName = ord.shipping_name?.toLowerCase() || "";
      const customerPhone = ord.customer_phone?.toLowerCase() || "";
      const customerEmail = ord.customer_email?.toLowerCase() || "";
      const shippingPhone = ord.shipping_phone?.toLowerCase() || "";
      return (
        orderNumber.includes(q) ||
        customerName.includes(q) ||
        shippingName.includes(q) ||
        customerPhone.includes(q) ||
        customerEmail.includes(q) ||
        shippingPhone.includes(q)
      );
    });
  }, [orders, searchText]);

  // Fetch orders from API
  const fetchOrders = async (targetPage = page) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        page: targetPage.toString(),
        limit: limit.toString(),
      });
      const res = await fetch(`/api/admin/orders?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
    setPage(1);
  }, [startDate, endDate, limit]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
      fetchOrders(newPage);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const acceptOrder = async (orderId: string) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: "accepted" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || String(data?.order?.status || "").toLowerCase() !== "accepted") {
        throw new Error(data?.error || "Failed to accept order");
      }
      await fetchOrders(page);
    } catch (err) {
      console.error(err);
      alert("Could not accept order. Please try again.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleResetFilters = () => {
    setStartDate(getPastDateString(7));
    setEndDate(getPastDateString(0));
    setSearchText("");
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-750 border border-emerald-500/20">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Paid
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-500/20">
            <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" /> Pending
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-755 border border-rose-500/20">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            {status || "Unknown"}
          </span>
        );
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-750 border border-emerald-500/20">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Fulfilled
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-750 border border-blue-500/20">
            <Package className="h-3.5 w-3.5 text-blue-600" /> Accepted
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-755 border border-rose-500/20">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-500/20">
            <Clock className="h-3.5 w-3.5 text-amber-600" /> {status || "Processing"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Refresh */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-primary/10 bg-gradient-to-r from-brand-primary/[0.03] via-background-elevated to-brand-secondary/[0.03] p-6 shadow-sm">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-primary/5 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-brand-secondary/5 blur-3xl" />
        
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                <ShoppingBag className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-2xl font-bold text-text-main tracking-tight font-display">Customer Orders</h2>
            </div>
            <p className="text-sm text-text-muted">
              Overview your storefront orders, monitor real-time sales performance, and track shipments.
            </p>
          </div>
          
          <button
            onClick={() => fetchOrders(page)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background-elevated px-4 text-xs font-semibold text-text-main hover:bg-background-soft hover:border-brand-primary/30 transition-all shadow-sm active:scale-95 duration-200"
          >
            <RefreshCw className={`h-4 w-4 text-brand-primary ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* IST Performance Metric Cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Today Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-brand-primary/10 bg-background-elevated p-6 shadow-card transition-all duration-350 hover:-translate-y-1 hover:shadow-glow">
          {/* Backdrop Glow */}
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-emerald-500/20" />
          
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-soft flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Today's Transactions
              </span>
              <h3 className="text-3xl font-bold text-text-main tracking-tight">
                ₹{metrics.today.revenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 transition-transform duration-300 group-hover:scale-110">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>
          
          <div className="relative mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-text-muted">
            <div className="flex items-center justify-center rounded-md bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700">
              {metrics.today.count} orders
            </div>
            <span>placed today (IST)</span>
          </div>
        </div>

        {/* Yesterday Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-brand-primary/10 bg-background-elevated p-6 shadow-card transition-all duration-355 hover:-translate-y-1 hover:shadow-glow">
          {/* Backdrop Glow */}
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-brand-primary/10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-brand-primary/20" />
          
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-soft flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-primary/40" />
                Yesterday's Transactions
              </span>
              <h3 className="text-3xl font-bold text-text-main tracking-tight">
                ₹{metrics.yesterday.revenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary transition-transform duration-300 group-hover:scale-110">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          
          <div className="relative mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-text-muted">
            <div className="flex items-center justify-center rounded-md bg-brand-primary/5 px-2.5 py-0.5 font-bold text-brand-primary">
              {metrics.yesterday.count} orders
            </div>
            <span>placed yesterday (IST)</span>
          </div>
        </div>
      </div>

      {/* Filters and Table Grid */}
      <div className="rounded-2xl border border-border bg-background-elevated shadow-card overflow-hidden">
        
        {/* Advanced Filters Header */}
        <div className="border-b border-border bg-background-soft p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Local Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-text-soft" />
            </div>
            <input
              type="text"
              placeholder="Search by order #, customer name, email, or phone..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-border bg-background-elevated font-medium text-text-main placeholder-text-soft focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all duration-200"
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-text-soft hover:text-brand-primary"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-text-soft" />
                <span className="text-xs font-semibold text-text-main">Date Range:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl border border-border bg-background-elevated px-3 py-1.5 text-xs font-bold text-text-main focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10"
                />
                <span className="text-xs text-text-soft font-medium">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl border border-border bg-background-elevated px-3 py-1.5 text-xs font-bold text-text-main focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10"
                />
              </div>
              
              {(startDate !== getPastDateString(7) || endDate !== getPastDateString(0) || searchText !== "") && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-brand-primary hover:text-brand-secondary underline decoration-dotted underline-offset-4 transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="h-5 w-[1px] bg-border hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-soft font-bold uppercase tracking-wider">Show:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                className="rounded-xl border border-border bg-background-elevated px-3 py-1.5 text-xs font-bold text-text-main focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 cursor-pointer"
              >
                <option value={10}>10 rows</option>
                <option value={20}>20 rows</option>
                <option value={50}>50 rows</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Container */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-background-elevated">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand-primary" />
            <span className="mt-4 text-xs font-semibold text-text-soft">Loading orders data...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-background-elevated">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background-soft">
              <ShoppingBag className="h-7 w-7 text-text-soft" />
            </div>
            <h3 className="mt-4 text-[15px] font-bold text-text-main">No orders found</h3>
            <p className="mt-1 max-w-xs text-center text-xs text-text-soft">
              No transactions matched this date range. Try choosing broader filter bounds.
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-background-elevated">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background-soft">
              <Search className="h-7 w-7 text-text-soft" />
            </div>
            <h3 className="mt-4 text-[15px] font-bold text-text-main">No matching orders</h3>
            <p className="mt-1 max-w-xs text-center text-xs text-text-soft">
              No orders matched your search query "{searchText}". Try searching for another keyword or clear the search.
            </p>
            <button
              onClick={() => setSearchText("")}
              className="mt-4 rounded-xl bg-brand-primary/10 border border-brand-primary/20 px-4 py-2 text-xs font-bold text-brand-primary hover:bg-brand-primary/20 transition-all"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Desktop Table Header */}
            <div className="hidden grid-cols-12 bg-background-soft px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-soft border-b border-border md:grid">
              <div className="col-span-2">Order</div>
              <div className="col-span-3">Customer</div>
              <div className="col-span-2 text-center">Items Count</div>
              <div className="col-span-2 text-right">Total (INR)</div>
              <div className="col-span-2 text-center">Statuses</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            {/* Orders Rows */}
            {filteredOrders.map((ord) => {
              const isExpanded = expandedOrderId === ord.id;
              const formattedDate = new Date(ord.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "numeric",
              });

              const itemsCount = ord.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

              return (
                <div key={ord.id} className={`transition-all duration-200 border-l-4 ${isExpanded ? "border-brand-primary bg-brand-primary/[0.01]" : "border-transparent hover:bg-background-soft/30 hover:border-brand-primary/20"}`}>
                  {/* Summary Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-12 items-center px-6 py-4.5 gap-4 md:gap-0">
                    
                    {/* Order Identifier */}
                    <div className="md:col-span-2 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-text-main text-[14px]">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-primary/5 text-brand-primary">
                          <Package className="h-3.5 w-3.5" />
                        </div>
                        <span>#{ord.order_number}</span>
                      </div>
                      <p className="text-[11px] text-text-soft font-medium">{formattedDate}</p>
                    </div>

                    {/* Customer identity */}
                    <div className="md:col-span-3 space-y-1.5 text-[13px] text-text-main">
                      <div className="flex items-center gap-1.5 font-bold">
                        <User className="h-3.5 w-3.5 text-text-soft" />
                        <span>{ord.shipping_name || ord.customer_name || "Guest User"}</span>
                      </div>
                      <div className="flex flex-col gap-1 text-[11px] text-text-soft font-medium">
                        {ord.customer_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-text-soft" />
                            {ord.customer_phone}
                          </span>
                        )}
                        {ord.customer_email && (
                          <span className="truncate max-w-[180px] flex items-center gap-1">
                            <Mail className="h-3 w-3 text-text-soft" />
                            {ord.customer_email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Items count summary */}
                    <div className="md:col-span-2 flex flex-col md:items-center text-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-background-soft px-3 py-1 text-xs font-bold text-text-main border border-border">
                        <ShoppingBag className="h-3.5 w-3.5 text-brand-primary" />
                        {itemsCount} {itemsCount === 1 ? "item" : "items"}
                      </span>
                    </div>

                    {/* Grand Total Financial values */}
                    <div className="md:col-span-2 text-right flex flex-col pr-4">
                      <span className="text-[15px] font-bold text-text-main">
                        ₹{parseFloat(ord.grand_total).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[11px] text-text-soft font-medium">
                        Sub: ₹{parseFloat(ord.subtotal).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    {/* Transaction & Order Status badges / Accept Button */}
                    <div className="md:col-span-2 flex items-center justify-start md:justify-center">
                      {can("orders.status.update") &&
                      ord.status?.toLowerCase() !== "accepted" &&
                      ord.status?.toLowerCase() !== "completed" &&
                      ord.status?.toLowerCase() !== "cancelled" ? (
                        <button
                          onClick={() => acceptOrder(ord.id)}
                          disabled={updatingOrderId === ord.id}
                          className="inline-flex h-7 items-center justify-center gap-1.5 rounded-xl border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary hover:bg-brand-primary hover:text-text-inverse disabled:opacity-60 transition-all active:scale-95 shadow-sm"
                        >
                          {updatingOrderId === ord.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            "Accept Order"
                          )}
                        </button>
                      ) : (
                        getOrderStatusBadge(ord.status)
                      )}
                    </div>

                    {/* Expand Detail Drawer */}
                    <div className="md:col-span-1 flex justify-end">
                      <button
                        onClick={() => toggleExpand(ord.id)}
                        className={`inline-flex h-8 items-center gap-1 rounded-xl border px-3 text-xs font-bold transition-all shadow-sm active:scale-95 ${
                          isExpanded
                            ? "bg-brand-primary border-brand-primary text-text-inverse hover:bg-brand-secondary"
                            : "bg-background-elevated border-border text-text-main hover:bg-background-soft"
                        }`}
                      >
                        Details
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expand Tray details Drawer */}
                  {isExpanded && (
                    <div className="bg-background-soft/40 border-t border-b border-border px-6 py-6 transition-all duration-300">
                      <div className="grid gap-6 md:grid-cols-12">
                        
                        {/* Left column: Receipt itemization */}
                        <div className="md:col-span-7 rounded-2xl border border-border bg-white p-6 shadow-sm relative overflow-hidden">
                          {/* Receipt top decorative holes / edge */}
                          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-b from-border/20 to-transparent" />
                          <div className="flex items-center justify-between mb-6 border-b border-dashed border-border pb-4">
                            <div>
                              <h4 className="text-sm font-bold text-text-main">
                                Itemized Receipt
                              </h4>
                              <p className="text-[10px] text-text-soft">Order ID: {ord.id}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getPaymentStatusBadge(ord.payment_status)}
                              <span className="text-[11px] font-bold uppercase tracking-wider text-text-soft bg-background-soft px-2.5 py-1 rounded-lg">
                                Invoice
                              </span>
                            </div>
                          </div>
                          
                          {(!ord.items || ord.items.length === 0) ? (
                            <p className="text-xs text-text-soft italic py-4 text-center">No items aggregated in database order items table.</p>
                          ) : (
                            <div className="space-y-4">
                              <div className="max-h-[320px] overflow-y-auto pr-1 space-y-3">
                                {ord.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-3.5 rounded-xl border border-border/40 bg-background-soft/30 p-3 hover:bg-background-soft transition-colors duration-200">
                                    <div className="h-14 w-14 shrink-0 rounded-lg border border-border bg-white overflow-hidden flex items-center justify-center shadow-sm">
                                      {item.product_image ? (
                                        <img src={item.product_image} alt="" className="h-full w-full object-cover" />
                                      ) : (
                                        <span className="text-[9px] text-text-soft font-semibold text-center">No Image</span>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h5 className="truncate text-xs font-bold text-text-main">{item.product_title}</h5>
                                      <p className="mt-0.5 text-[10px] text-text-soft font-mono">Slug: {item.product_slug}</p>
                                    </div>
                                    <div className="text-right shrink-0 space-y-0.5">
                                      <span className="text-xs font-bold text-text-main">
                                        ₹{parseFloat(item.line_total).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                      </span>
                                      <p className="text-[10px] text-text-soft font-medium">
                                        ₹{parseFloat(item.unit_price).toLocaleString("en-IN", { maximumFractionDigits: 0 })} × {item.quantity}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Dashed financial receipt calculation */}
                              <div className="border-t-2 border-dashed border-border pt-4 mt-4 text-xs text-text-muted space-y-2 max-w-sm ml-auto">
                                <div className="flex justify-between">
                                  <span>Subtotal</span>
                                  <span className="font-semibold text-text-main">₹{parseFloat(ord.subtotal).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                                </div>
                                {(ord.coupon_code || Number(ord.discount_total || 0) > 0) && (
                                  <div className="flex justify-between">
                                    <span className="flex items-center gap-1">
                                      Coupon: <span className="font-mono bg-brand-primary/5 text-brand-primary px-1.5 py-0.2 rounded font-bold text-[10px]">{ord.coupon_code || "-"}</span>
                                    </span>
                                    <span className="font-semibold text-brand-secondary">
                                      {ord.discount_percent
                                        ? `(${parseFloat(ord.discount_percent).toLocaleString("en-IN", { maximumFractionDigits: 2 })}% OFF)`
                                        : ""}
                                    </span>
                                  </div>
                                )}
                                {Number(ord.discount_total || 0) > 0 && (
                                  <div className="flex justify-between text-emerald-750">
                                    <span>Discount Applied</span>
                                    <span className="font-semibold">
                                      -₹{parseFloat(ord.discount_total || "0").toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span>Shipping Fee</span>
                                  <span className="font-semibold text-text-main">₹{parseFloat(ord.shipping_total).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="flex justify-between border-t border-dashed border-border pt-2.5 text-sm text-text-main">
                                  <span className="font-bold">Grand Total</span>
                                  <span className="font-black text-brand-primary text-base">₹{parseFloat(ord.grand_total).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right column: Delivery Shipping Label details */}
                        <div className="md:col-span-5 rounded-2xl border-2 border-dashed border-slate-350 bg-background-elevated p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                          {/* Shipping Label Badge */}
                          <div className="absolute right-4 top-4 border-2 border-slate-800 text-slate-800 text-[10px] font-black uppercase px-2 py-0.5 tracking-wider rounded rotate-6 select-none opacity-80">
                            Priority Post
                          </div>
                          
                          <div>
                            <h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-slate-800 border-b-2 border-slate-900 pb-3 flex items-center gap-1.5 font-display">
                              <MapPin className="h-4.5 w-4.5 text-brand-primary" />
                              Shipping Label
                            </h4>

                            <div className="space-y-4 text-xs text-text-main">
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Ship To (Recipient)</p>
                                <p className="font-extrabold text-[14px] text-slate-900">{ord.shipping_name || "N/A"}</p>
                              </div>

                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Delivery Phone</p>
                                <p className="font-semibold text-slate-900 flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5 text-text-soft" />
                                  {ord.shipping_phone || "N/A"}
                                </p>
                              </div>

                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Mailing Address</p>
                                <p className="leading-relaxed font-medium text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-border/80">
                                  {ord.shipping_address || "N/A"}
                                </p>
                                <p className="font-bold mt-1 text-slate-900 text-xs">
                                  {ord.shipping_city ? `${ord.shipping_city}, ` : ""}
                                  {ord.shipping_state ? `${ord.shipping_state} ` : ""}
                                  {ord.shipping_pincode ? `- ${ord.shipping_pincode}` : ""}
                                </p>
                              </div>

                              {ord.notes && (
                                <div className="rounded-xl bg-amber-50 border border-amber-250 p-3 mt-3">
                                  <div className="flex items-center gap-1.5 text-amber-800">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    <p className="text-[9px] font-bold uppercase tracking-wider">Special Instructions</p>
                                  </div>
                                  <p className="mt-1 font-medium text-amber-900 text-[11px] leading-relaxed italic">"{ord.notes}"</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Barcode details */}
                          <div className="mt-6 border-t border-slate-200 pt-4 flex flex-col items-center">
                            {/* CSS Barcode */}
                            <div className="flex h-10 items-end gap-[1px] justify-center bg-white px-3 py-1 border border-slate-200 rounded opacity-90 w-full max-w-xs">
                              <div className="h-full w-[2px] bg-black" />
                              <div className="h-full w-[1px] bg-black" />
                              <div className="h-full w-[3px] bg-black" />
                              <div className="h-full w-[1px] bg-black" />
                              <div className="h-full w-[2px] bg-black" />
                              <div className="h-full w-[4px] bg-black" />
                              <div className="h-full w-[1px] bg-black" />
                              <div className="h-full w-[2px] bg-black" />
                              <div className="h-full w-[3px] bg-black" />
                              <div className="h-full w-[1px] bg-black" />
                              <div className="h-full w-[2px] bg-black" />
                              <div className="h-full w-[4px] bg-black" />
                              <div className="h-full w-[1px] bg-black" />
                              <div className="h-full w-[2px] bg-black" />
                              <div className="h-full w-[3px] bg-black" />
                              <div className="h-full w-[2px] bg-black" />
                              <div className="h-full w-[1px] bg-black" />
                              <div className="h-full w-[4px] bg-black" />
                              <div className="h-full w-[2px] bg-black" />
                            </div>
                            <span className="text-[9px] text-text-soft font-mono tracking-widest mt-1">ORDER-{ord.order_number}</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Pagination Controls */}
        {!loading && pagination.totalPages > 1 && (
          <div className="border-t border-border bg-background-soft px-6 py-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">
              Showing {filteredOrders.length} of {orders.length} orders on this page (Page {page} of {pagination.totalPages})
            </span>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background-elevated text-text-main hover:bg-background-soft disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="text-xs font-bold text-text-main px-1">
                {page} / {pagination.totalPages}
              </span>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background-elevated text-text-main hover:bg-background-soft disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
