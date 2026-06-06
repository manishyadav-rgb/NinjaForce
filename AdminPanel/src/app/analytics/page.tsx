"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  Layers,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UsersRound,
  Download,
  Calendar,
  Search,
  ArrowUpRight,
  Filter,
  ChevronDown
} from "lucide-react";

type TimelinePoint = { date: string; day: string; revenue: number; orders: number; avgOrder: number };
type Segment = { label: string; value: number; revenue: number };
type TopProduct = { title: string; quantity: number; revenue: number };
type CategorySale = { label: string; quantity: number; revenue: number };
type CitySale = { city: string; orders: number; revenue: number; customers: number };
type RecentOrder = {
  orderNumber: string;
  customer: string;
  status: string;
  paymentStatus: string;
  revenue: number;
  createdAt: string;
};
type AnalyticsData = {
  summary: {
    revenue: number;
    orders: number;
    avgOrderValue: number;
    customers: number;
    discounts: number;
    shipping: number;
    revenueChange: number;
    ordersChange: number;
  };
  timeline: TimelinePoint[];
  statusBreakdown: Segment[];
  paymentBreakdown: Segment[];
  topProducts: TopProduct[];
  categorySales: CategorySale[];
  citySales: CitySale[];
  recentOrders: RecentOrder[];
  inventory: { products: number; categories: number; collections: number };
};

const palette = [
  "var(--color-brand-primary)",
  "var(--color-brand-secondary)",
  "var(--color-brand-accent)",
  "#10B981",
  "#EC4899",
  "#F59E0B",
  "#8B5CF6",
  "#06B6D4"
];

const tabs = ["Overview", "Sales", "Products", "Customers"] as const;

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function compact(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1, notation: "compact" }).format(value || 0);
}

function titleCase(value: string) {
  return (value || "Unknown")
    .replace(/[-_]+/g, " ")
    .replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

function trendClass(value: number) {
  return value >= 0 ? "text-emerald-700 bg-emerald-500/10 border-emerald-500/10" : "text-rose-700 bg-rose-500/10 border-rose-500/10";
}

// Mini Sparkline component for Stat Cards
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const points = useMemo(() => {
    if (!data || data.length < 2) return "";
    const max = Math.max(1, ...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 100;
    const height = 30;
    const pad = 2;
    return data
      .map((val, idx) => {
        const x = pad + (idx / (data.length - 1)) * (width - pad * 2);
        const y = height - pad - ((val - min) / range) * (height - pad * 2);
        return `${x},${y}`;
      })
      .join(" ");
  }, [data]);

  if (!points) return null;

  return (
    <svg width="100" height="30" className="overflow-visible opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  change,
  sparklineData,
}: {
  label: string;
  value: string;
  hint: string;
  icon: any;
  change?: number;
  sparklineData?: number[];
}) {
  const TrendIcon = (change || 0) >= 0 ? TrendingUp : TrendingDown;
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="rounded-2xl border border-border bg-background-elevated p-5 shadow-card hover:shadow-glow transition-all duration-300 relative overflow-hidden group"
    >
      <div className="absolute right-0 top-0 -mr-6 -mt-6 h-20 w-20 rounded-full bg-brand-primary/5 blur-2xl transition-all duration-500 group-hover:scale-150" />
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-soft">{label}</p>
          <p className="mt-2 truncate text-2xl font-black text-text-main tracking-tight font-display">{value}</p>
          <p className="mt-1 text-[11px] font-semibold text-text-muted">{hint}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      
      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-2 relative z-10">
        {change !== undefined ? (
          <div className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${trendClass(change)}`}>
            <TrendIcon className="h-3 w-3" />
            {Math.abs(change)}%
          </div>
        ) : (
          <span className="text-[10px] text-text-soft">Trend range</span>
        )}
        {sparklineData && sparklineData.length > 0 && (
          <div className="shrink-0">
            <Sparkline data={sparklineData} color={change !== undefined && change < 0 ? "var(--color-brand-accent)" : "var(--color-brand-primary)"} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Fully Interactive Custom SVG Revenue Line Chart
function RevenueLineChart({ data }: { data: TimelinePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = 720;
  const height = 250;
  const pad = 28;
  
  const orderedData = useMemo(() => [...data].sort((a, b) => a.date.localeCompare(b.date)), [data]);
  const maxRevenue = useMemo(() => Math.max(1, ...orderedData.map((d) => d.revenue)), [orderedData]);
  const labelEvery = useMemo(() => Math.max(1, Math.ceil(orderedData.length / 6)), [orderedData]);

  const points = useMemo(() => {
    return orderedData.map((point, index) => {
      const x = pad + (index / Math.max(1, orderedData.length - 1)) * (width - pad * 2);
      const y = height - pad - (point.revenue / maxRevenue) * (height - pad * 2);
      return { x, y, ...point };
    });
  }, [orderedData, maxRevenue]);

  const line = useMemo(() => points.map((p) => `${p.x},${p.y}`).join(" "), [points]);
  const area = useMemo(() => `${pad},${height - pad} ${line} ${width - pad},${height - pad}`, [line]);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Map screen X back to SVG viewBox coordinate system
    const padScreen = pad * (rect.width / width);
    const chartWidthScreen = (width - pad * 2) * (rect.width / width);
    const pct = Math.max(0, Math.min(1, (x - padScreen) / chartWidthScreen));
    const index = Math.round(pct * (points.length - 1));
    
    if (index >= 0 && index < points.length) {
      setHoveredIndex(index);
      const pt = points[index];
      
      // Calculate SVG coordinates mapped to actual screen pixels relative to the SVG element
      const xPixel = (pt.x / width) * rect.width;
      const yPixel = (pt.y / height) * rect.height;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const svgLeftRelToContainer = rect.left - containerRect.left;
      const svgTopRelToContainer = rect.top - containerRect.top;
      
      const absoluteX = svgLeftRelToContainer + xPixel;
      const absoluteY = svgTopRelToContainer + yPixel;
      
      // Clamp X position so the tooltip (approx 170px wide) doesn't overflow card borders
      const tooltipHalfWidth = 85; 
      const minX = tooltipHalfWidth + 10;
      const maxX = containerRect.width - tooltipHalfWidth - 10;
      const clampedX = Math.max(minX, Math.min(maxX, absoluteX));
      
      // Clamp Y position so it doesn't float into the header or overlap other cards
      const clampedY = Math.max(85, absoluteY - 12);
      
      setTooltipPos({ x: clampedX, y: clampedY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div ref={containerRef} className="relative rounded-2xl border border-border bg-background-elevated p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-black text-text-main tracking-tight font-display">Revenue Performance</h3>
          <p className="text-xs text-text-muted">Daily sales performance across the selected period.</p>
        </div>
        <BarChart3 className="h-5 w-5 text-brand-primary" />
      </div>

      <div className="relative mt-5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="h-[250px] w-full cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand-primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-brand-primary)" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 1, 2, 3].map((tick) => {
            const y = pad + tick * ((height - pad * 2) / 3);
            return (
              <line
                key={tick}
                x1={pad}
                x2={width - pad}
                y1={y}
                y2={y}
                stroke="var(--color-border)"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.4"
              />
            );
          })}

          {/* Area & Line */}
          <motion.polygon
            points={area}
            fill="url(#revenueAreaGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.polyline
            points={line}
            fill="none"
            stroke="var(--color-brand-primary)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* Markers */}
          {points.map((p, index) => (
            <g key={`${p.day}-${index}`}>
              {index === 0 || index === points.length - 1 || index % labelEvery === 0 ? (
                <text x={p.x} y={height - 6} textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-text-soft)">
                  {p.day}
                </text>
              ) : null}
            </g>
          ))}

          {/* Interactive Guide Cursor & Overlay Dot */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                x2={activePoint.x}
                y1={pad}
                y2={height - pad}
                stroke="var(--color-brand-secondary)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle cx={activePoint.x} cy={activePoint.y} r="8" fill="var(--color-brand-primary)" opacity="0.3" />
              <circle cx={activePoint.x} cy={activePoint.y} r="4.5" fill="var(--color-brand-primary)" stroke="white" strokeWidth="2" />
            </g>
          )}
        </svg>

        {/* HTML Tooltip Box */}
        <AnimatePresence>
          {activePoint && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute pointer-events-none rounded-xl border border-border bg-background-elevated/95 backdrop-blur-md p-3.5 shadow-dropdown z-30 text-xs text-text-main flex flex-col gap-1.5 transition-all duration-100"
              style={{
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="font-extrabold text-[11px] text-text-muted uppercase border-b border-border pb-1 mb-1">
                {activePoint.day} ({activePoint.date})
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-text-soft">Revenue:</span>
                <span className="font-black text-brand-primary">{money(activePoint.revenue)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-text-soft">Orders:</span>
                <span className="font-bold">{activePoint.orders} orders</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-text-soft">Avg Order:</span>
                <span className="font-semibold">{money(activePoint.avgOrder)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Interactive Bar Chart with tooltips
function OrdersBarChart({ data }: { data: TimelinePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const orderedData = useMemo(() => [...data].sort((a, b) => a.date.localeCompare(b.date)), [data]);
  const maxOrders = useMemo(() => Math.max(1, ...orderedData.map((d) => d.orders)), [orderedData]);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const activeBar = hoveredBarIndex !== null ? orderedData[hoveredBarIndex] : null;

  return (
    <div ref={containerRef} className="rounded-2xl border border-border bg-background-elevated p-5 shadow-card relative">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-black text-text-main tracking-tight font-display">Order Volumes</h3>
          <p className="text-xs text-text-muted">Daily transaction frequencies.</p>
        </div>
        <ShoppingBag className="h-5 w-5 text-emerald-500" />
      </div>

      <div className="mt-5 flex h-48 items-end gap-1.5 relative">
        {orderedData.map((point, index) => {
          const barHeight = (point.orders / maxOrders) * 160;
          return (
            <div
              key={`${point.day}-${index}`}
              className="group flex flex-1 flex-col items-center justify-end h-full relative cursor-pointer"
              onMouseEnter={(e) => {
                setHoveredBarIndex(index);
                if (!containerRef.current) return;
                const containerRect = containerRef.current.getBoundingClientRect();
                const barRect = e.currentTarget.getBoundingClientRect();
                
                // Calculate position relative to container
                const xPos = (barRect.left - containerRect.left) + barRect.width / 2;
                const yPos = (barRect.top - containerRect.top);
                
                // Clamp X (tooltip width is ~140px, half is 70px)
                const tooltipHalfWidth = 70;
                const minX = tooltipHalfWidth + 10;
                const maxX = containerRect.width - tooltipHalfWidth - 10;
                const clampedX = Math.max(minX, Math.min(maxX, xPos));
                
                // Clamp Y
                const clampedY = Math.max(85, yPos - 8);
                
                setTooltipPos({ x: clampedX, y: clampedY });
              }}
              onMouseLeave={() => setHoveredBarIndex(null)}
            >
              <div className="relative w-full rounded-t-md bg-brand-primary/10 overflow-hidden h-full flex items-end">
                <motion.div
                  className="min-h-[4px] w-full rounded-t-md bg-brand-primary group-hover:bg-brand-secondary transition-all"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, barHeight)}px` }}
                  transition={{ duration: 0.6, delay: index * 0.015 }}
                />
              </div>
            </div>
          );
        })}

        {/* Hover bar tooltips */}
        <AnimatePresence>
          {activeBar && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute pointer-events-none rounded-xl border border-border bg-background-elevated/95 backdrop-blur-md px-3.5 py-2 shadow-dropdown z-30 text-xs text-text-main text-center flex flex-col gap-0.5"
              style={{
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <span className="font-extrabold text-[10px] text-text-soft uppercase">{activeBar.day}</span>
              <span className="font-black text-brand-primary text-sm">{activeBar.orders} Orders</span>
              <span className="text-[10px] text-text-muted font-medium">{money(activeBar.revenue)} revenue</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Donut Chart with hover interactions
function DonutChart({ title, data }: { title: string; data: Segment[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  // If only 1 category has orders, we shouldn't draw any gaps. Otherwise, draw a clean 4-unit gap.
  const nonZeroCount = data.filter((d) => d.value > 0).length;
  const gap = nonZeroCount > 1 ? 4 : 0;

  // Computes accumulated offsets for dash positioning, adjusting for the gap size
  const offsets = useMemo(() => {
    let offsetAcc = 25; // start at top center
    return data.map((item) => {
      const length = total > 0 ? (item.value / total) * circumference : 0;
      const current = offsetAcc;
      offsetAcc += length;
      return current;
    });
  }, [data, total, circumference]);

  const activeSegment = hoveredSlice !== null ? data[hoveredSlice] : null;

  return (
    <div className="rounded-2xl border border-border bg-background-elevated p-5 shadow-card">
      <h3 className="text-[15px] font-black text-text-main tracking-tight font-display">{title}</h3>
      <div className="mt-5 grid gap-5 sm:grid-cols-[150px,1fr] sm:items-center">
        <div className="relative mx-auto h-36 w-36">
          <svg viewBox="0 0 100 100" className="-rotate-90 overflow-visible">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-bg-soft)" strokeWidth="8" />
            {data.map((item, index) => {
              const length = total > 0 ? (item.value / total) * circumference : 0;
              const strokeLength = Math.max(0, length - gap);
              const isHovered = hoveredSlice === index;
              return (
                <motion.circle
                  key={item.label}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={palette[index % palette.length]}
                  strokeWidth={isHovered ? "10" : "8"}
                  strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: -offsets[index] }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ transformOrigin: "50px 50px" }}
                  className="transition-all duration-200 cursor-pointer origin-center"
                  onMouseEnter={() => setHoveredSlice(index)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  whileHover={{ scale: 1.05 }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
              {activeSegment ? (
                <motion.div
                  key={activeSegment.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="text-center"
                >
                  <span className="text-2xl font-black text-text-main tracking-tight font-display">
                    {activeSegment.value}
                  </span>
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-brand-primary">
                    {titleCase(activeSegment.label)}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="total"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="text-center"
                >
                  <span className="text-2xl font-black text-text-main tracking-tight font-display">
                    {total}
                  </span>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-text-soft">
                    Orders
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid gap-2">
          {data.length === 0 ? (
            <p className="text-sm text-text-soft italic py-2">No breakdowns available.</p>
          ) : (
            data.map((item, index) => {
              const share = total > 0 ? Math.round((item.value / total) * 100) : 0;
              const isHovered = hoveredSlice === index;
              return (
                <div
                  key={item.label}
                  onMouseEnter={() => setHoveredSlice(index)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 transition-all duration-200 border cursor-default ${
                    isHovered ? "bg-brand-primary/5 border-brand-primary/30 shadow-soft scale-[1.02]" : "bg-background-soft border-transparent"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: palette[index % palette.length] }} />
                    <span className="truncate text-xs font-bold text-text-main">{titleCase(item.label)}</span>
                  </span>
                  <div className="flex items-center gap-2 text-right shrink-0">
                    <span className="text-xs font-bold text-text-main">{item.value}</span>
                    <span className="text-[10px] font-bold text-text-soft bg-border/40 px-1.5 py-0.5 rounded-md">{share}%</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Progressive Ranked List Component
function RankedList({ title, items }: { title: string; items: Array<{ label: string; value: number; sub: string }> }) {
  const max = useMemo(() => Math.max(1, ...items.map((item) => item.value)), [items]);
  return (
    <div className="rounded-2xl border border-border bg-background-elevated p-5 shadow-card min-w-0">
      <h3 className="text-[15px] font-black text-text-main tracking-tight font-display">{title}</h3>
      <div className="mt-4 grid gap-3.5 min-w-0">
        {items.length === 0 ? (
          <p className="rounded-xl bg-background-soft p-5 text-sm text-text-soft italic text-center border border-dashed border-border">
            No rankings available.
          </p>
        ) : (
          items.map((item, index) => (
            <div key={`${item.label}-${index}`} className="group min-w-0">
              <div className="flex items-center justify-between gap-3 text-xs mb-1 min-w-0">
                <span className="truncate min-w-0 font-bold text-text-main group-hover:text-brand-primary transition-colors">{item.label}</span>
                <span className="shrink-0 text-right font-semibold text-text-muted">{item.sub}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-background-soft overflow-hidden border border-border/20">
                <motion.div
                  className="h-full rounded-full bg-brand-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Status Badges mapping to main order panel
function getPaymentStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "paid":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-500/20">
          Paid
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-500/20">
          Pending
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800 border border-rose-500/20">
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-background-soft px-2.5 py-0.5 text-[11px] font-semibold text-text-muted border border-border">
          {status || "Unknown"}
        </span>
      );
  }
}

function getOrderStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "completed":
    case "delivered":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-500/20">
          Fulfilled
        </span>
      );
    case "accepted":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800 border border-blue-500/20">
          Accepted
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800 border border-rose-500/20">
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-500/20">
          {status || "Processing"}
        </span>
      );
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Custom date states
  const [days, setDays] = useState(30);
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");

  // Export menu trigger
  const [exportOpen, setExportOpen] = useState(false);

  // Search filter for recent orders
  const [orderQuery, setOrderQuery] = useState("");

  async function loadAnalytics(targetDays = days, startD = startDate, endD = endDate, custom = useCustomRange) {
    setLoading(true);
    try {
      let url = `/api/admin/analytics?`;
      if (custom && startD && endD) {
        url += `startDate=${startD}&endDate=${endD}`;
      } else {
        url += `days=${targetDays}`;
      }
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics(days, startDate, endDate, useCustomRange);
  }, [days, useCustomRange]);

  // Derived rank summaries
  const productRankings = useMemo(
    () =>
      (data?.topProducts || []).map((item) => ({
        label: item.title,
        value: item.revenue,
        sub: `${item.quantity} sold | ${money(item.revenue)}`,
      })),
    [data],
  );
  
  const categoryRankings = useMemo(
    () =>
      (data?.categorySales || []).map((item) => ({
        label: titleCase(item.label),
        value: item.revenue,
        sub: `${item.quantity} units | ${money(item.revenue)}`,
      })),
    [data],
  );

  const cityRankings = useMemo(
    () =>
      (data?.citySales || []).map((item) => ({
        label: titleCase(item.city),
        value: item.revenue,
        sub: `${item.orders} orders | ${money(item.revenue)}`,
      })),
    [data],
  );

  // Filtered recent orders
  const filteredRecentOrders = useMemo(() => {
    if (!data?.recentOrders) return [];
    if (!orderQuery.trim()) return data.recentOrders;
    const q = orderQuery.toLowerCase();
    return data.recentOrders.filter(
      (ord) =>
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.customer.toLowerCase().includes(q) ||
        ord.status.toLowerCase().includes(q) ||
        ord.paymentStatus.toLowerCase().includes(q)
    );
  }, [data, orderQuery]);

  // Sparkline data extractions
  const revenueSparkData = useMemo(() => data?.timeline.map((t) => t.revenue) || [], [data]);
  const ordersSparkData = useMemo(() => data?.timeline.map((t) => t.orders) || [], [data]);
  const aovSparkData = useMemo(() => data?.timeline.map((t) => t.avgOrder) || [], [data]);

  // Exporters
  function exportCSV() {
    if (!data) return;
    const csvRows = [
      ["Date", "Label", "Revenue (INR)", "OrdersCount", "AverageOrderValue (INR)"],
      ...data.timeline.map((t) => [t.date, t.day, t.revenue, t.orders, t.avgOrder]),
    ];
    const content = csvRows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_sales_report_${useCustomRange ? `${startDate}_to_${endDate}` : `${days}d`}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  }

  function exportJSON() {
    if (!data) return;
    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_full_report_${useCustomRange ? `${startDate}_to_${endDate}` : `${days}d`}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      {/* Page Header (Clean, Flat, Spacious) */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-brand-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Advanced analytics
            </div>
          </div>
          <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-text-main font-display">Sales Dashboard</h1>
          <p className="mt-1 text-xs font-semibold text-text-muted">
            Analyze real transaction values, order metrics, geography performance, and categories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Range Preset selector */}
          <div className="flex items-center rounded-full bg-background-soft p-1 border border-border shadow-soft relative">
            {[7, 30, 90, 180].map((option) => {
              const isActive = !useCustomRange && days === option;
              return (
                <button
                  key={option}
                  disabled={useCustomRange}
                  onClick={() => {
                    setUseCustomRange(false);
                    setDays(option);
                  }}
                  className={`relative z-10 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-300 ${
                    isActive ? "text-text-inverse" : "text-text-muted hover:text-text-main disabled:opacity-50"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeRangeCapsule"
                      className="absolute inset-0 bg-brand-primary rounded-full -z-10 shadow-sm"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {option}D
                </button>
              );
            })}
            <button
              onClick={() => setUseCustomRange(!useCustomRange)}
              className={`relative z-10 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                useCustomRange ? "text-text-inverse" : "text-text-muted hover:text-text-main"
              }`}
            >
              {useCustomRange && (
                <motion.div
                  layoutId="activeRangeCapsule"
                  className="absolute inset-0 bg-brand-primary rounded-full -z-10 shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Calendar className="h-3.5 w-3.5" />
              Custom
            </button>
          </div>

          {/* Custom Dates Inputs Expandable Form */}
          {useCustomRange && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 border border-border bg-background-elevated px-3 py-1.5 rounded-full shadow-soft"
            >
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-text-main cursor-pointer"
              />
              <span className="text-[10px] text-text-soft font-bold uppercase">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-text-main cursor-pointer"
              />
              <button
                onClick={() => loadAnalytics(days, startDate, endDate, true)}
                disabled={!startDate || !endDate}
                className="bg-brand-primary hover:bg-brand-secondary text-text-inverse p-1.5 rounded-full text-xs font-black transition-all flex items-center justify-center disabled:opacity-50"
                title="Apply custom range"
              >
                <Filter className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}

          {/* Export action */}
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border bg-background-elevated px-4 text-xs font-bold text-text-main hover:bg-background-soft hover:border-brand-primary/20 transition-all shadow-soft active:scale-95 duration-200"
            >
              <Download className="h-3.5 w-3.5 text-brand-primary" />
              Export
              <ChevronDown className="h-3 w-3 text-text-soft" />
            </button>
            
            <AnimatePresence>
              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-48 rounded-2xl border border-border bg-background-elevated p-2 shadow-dropdown z-50 flex flex-col gap-1"
                  >
                    <button
                      onClick={exportCSV}
                      className="w-full text-left text-xs font-bold text-text-main hover:bg-background-soft px-3 py-2 rounded-xl transition-colors"
                    >
                      Export CSV (Timeline)
                    </button>
                    <button
                      onClick={exportJSON}
                      className="w-full text-left text-xs font-bold text-text-main hover:bg-background-soft px-3 py-2 rounded-xl transition-colors"
                    >
                      Export JSON (Raw)
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Tabs navigation bar (Clean, Underlined slider) */}
      <div className="relative flex border-b border-border/40 gap-6 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-3.5 text-xs font-extrabold uppercase tracking-wider transition-all ${
                isActive ? "text-brand-primary font-black" : "text-text-soft hover:text-text-main"
              }`}
            >
              {tab}
              {isActive && (
                <motion.div
                  layoutId="activeTabBorder"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-primary rounded-full"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {loading || !data ? (
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-border bg-background-elevated shadow-card">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-9 w-9 animate-spin text-brand-primary" />
            <p className="text-xs font-extrabold text-text-soft uppercase tracking-wider">Loading analytics data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Dashboard Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Net revenue"
              value={money(data.summary.revenue)}
              hint={useCustomRange ? "Active custom period" : `${days} day total`}
              icon={CircleDollarSign}
              change={data.summary.revenueChange}
              sparklineData={revenueSparkData}
            />
            <StatCard
              label="Orders Count"
              value={String(data.summary.orders)}
              hint={`${money(data.summary.avgOrderValue)} Avg Order`}
              icon={ShoppingBag}
              change={data.summary.ordersChange}
              sparklineData={ordersSparkData}
            />
            <StatCard
              label="Unique Buyers"
              value={String(data.summary.customers)}
              hint="Active customers in range"
              icon={UsersRound}
              sparklineData={ordersSparkData} // proxy
            />
            <StatCard
              label="Discounts & Shipments"
              value={money(data.summary.discounts)}
              hint={`${money(data.summary.shipping)} Shipping fees`}
              icon={CreditCard}
              sparklineData={aovSparkData}
            />
          </div>

          {/* Tab 1: Overview */}
          {activeTab === "Overview" ? (
            <div className="grid gap-5 xl:grid-cols-[1.5fr,1fr]">
              <div className="xl:col-span-1">
                <RevenueLineChart data={data.timeline} />
              </div>
              <div>
                <OrdersBarChart data={data.timeline} />
              </div>
              <DonutChart title="Orders breakdown" data={data.statusBreakdown} />
              <RankedList title="City Distribution" items={cityRankings} />
            </div>
          ) : null}

          {/* Tab 2: Sales */}
          {activeTab === "Sales" ? (
            <div className="grid gap-5 xl:grid-cols-[1.5fr,1fr]">
              <RevenueLineChart data={data.timeline} />
              <RankedList title="City Distribution" items={cityRankings} />
              <DonutChart title="Payment status mix" data={data.paymentBreakdown} />
              
              {/* Recent Orders table */}
              <div className="rounded-2xl border border-border bg-background-elevated p-5 xl:col-span-2 shadow-card">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4.5">
                  <div>
                    <h3 className="text-[15px] font-black text-text-main tracking-tight font-display">Recent transactions</h3>
                    <p className="text-xs text-text-muted">Click an order to navigate to the order manager.</p>
                  </div>
                  
                  {/* Local search filter */}
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-background-soft px-3 py-1.5 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary/20 transition-all duration-200 max-w-xs w-full">
                    <Search className="h-3.5 w-3.5 text-text-soft shrink-0" />
                    <input
                      type="text"
                      placeholder="Search recent..."
                      value={orderQuery}
                      onChange={(e) => setOrderQuery(e.target.value)}
                      className="w-full border-none bg-transparent text-xs font-bold text-text-main placeholder-text-soft focus:outline-none focus:ring-0 p-0"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-xs border-collapse">
                    <thead className="text-[11px] uppercase tracking-wider text-text-soft bg-background-soft border-b border-border">
                      <tr>
                        <th className="py-3 px-4 font-bold">Order #</th>
                        <th className="py-3 px-4 font-bold">Customer Name</th>
                        <th className="py-3 px-4 font-bold">Order Status</th>
                        <th className="py-3 px-4 font-bold">Payment Status</th>
                        <th className="py-3 px-4 font-bold text-right">Total Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredRecentOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-text-soft italic bg-background-soft/20 rounded-xl">
                            No recent transactions found.
                          </td>
                        </tr>
                      ) : (
                        filteredRecentOrders.map((order) => (
                          <tr
                            key={order.orderNumber}
                            onClick={() => (window.location.href = `/orders`)}
                            className="hover:bg-background-soft/80 cursor-pointer transition-all duration-200 group"
                            title="Click to view details in Orders page"
                          >
                            <td className="py-3.5 px-4 font-bold text-brand-primary group-hover:underline">
                              <span className="flex items-center gap-1.5">
                                #{order.orderNumber}
                                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-text-muted">{order.customer}</td>
                            <td className="py-3.5 px-4">{getOrderStatusBadge(order.status)}</td>
                            <td className="py-3.5 px-4">{getPaymentStatusBadge(order.paymentStatus)}</td>
                            <td className="py-3.5 px-4 text-right font-black text-brand-primary tracking-tight">
                              {money(order.revenue)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {/* Tab 3: Products */}
          {activeTab === "Products" ? (
            <div className="grid gap-5 xl:grid-cols-2">
              <RankedList title="Top Selling Products by Revenue" items={productRankings} />
              <RankedList title="Sales distribution by Category" items={categoryRankings} />
              
              {/* Product catalog summaries */}
              <div className="grid gap-4 sm:grid-cols-3 xl:col-span-2">
                <div className="rounded-2xl border border-border bg-background-elevated p-5 flex items-center gap-4 shadow-card">
                  <div className="h-12 w-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-soft">Catalog Products</h4>
                    <p className="text-xl font-black text-text-main font-display mt-0.5">{compact(data.inventory.products)}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background-elevated p-5 flex items-center gap-4 shadow-card">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Boxes className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-soft">Active Categories</h4>
                    <p className="text-xl font-black text-text-main font-display mt-0.5">{compact(data.inventory.categories)}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background-elevated p-5 flex items-center gap-4 shadow-card">
                  <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                    <Layers className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-soft">Curated Collections</h4>
                    <p className="text-xl font-black text-text-main font-display mt-0.5">{compact(data.inventory.collections)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Tab 4: Customers */}
          {activeTab === "Customers" ? (
            <div className="grid gap-5 xl:grid-cols-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background-elevated p-5 shadow-card flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-soft">Unique customers</h4>
                      <p className="text-2xl font-black text-text-main font-display mt-2">{data.summary.customers}</p>
                    </div>
                    <UsersRound className="h-5 w-5 text-brand-primary" />
                  </div>
                  <p className="text-[11px] font-semibold text-text-muted mt-5">Purchasers over selected bounds.</p>
                </div>

                <div className="rounded-2xl border border-border bg-background-elevated p-5 shadow-card flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-soft">Avg Order value (AOV)</h4>
                      <p className="text-2xl font-black text-text-main font-display mt-2">{money(data.summary.avgOrderValue)}</p>
                    </div>
                    <CalendarDays className="h-5 w-5 text-brand-primary" />
                  </div>
                  <p className="text-[11px] font-semibold text-text-muted mt-5">Aggregate cart ticket sizes.</p>
                </div>

                <div className="rounded-2xl border border-border bg-background-elevated p-5 shadow-card flex flex-col justify-between sm:col-span-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-soft">Top Buying region</h4>
                      <p className="text-xl font-black text-text-main font-display mt-2">{cityRankings[0]?.label || "No orders"}</p>
                    </div>
                    <MapPin className="h-5 w-5 text-brand-primary" />
                  </div>
                  <p className="text-[11px] font-semibold text-text-muted mt-5">{cityRankings[0]?.sub || "Geography will appear after orders"}</p>
                </div>
              </div>
              
              <RankedList title="Customer Category Preferences" items={categoryRankings} />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
