"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Search,
  ShieldAlert,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { useAdminPermissions } from "@/lib/use-admin-permissions";

type ActivityLog = {
  id: string;
  actor_team_user_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  actor_role: string | null;
  module: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  status: "success" | "failed";
  message: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

type TeamMember = {
  id: string;
  full_name: string;
  email: string;
};

type ModuleCount = {
  module: string;
  count: string;
};

type Payload = {
  logs: ActivityLog[];
  members: TeamMember[];
  modules: ModuleCount[];
  summary: { total: number; success: number; failed: number; actors: number };
  pagination: { totalCount: number; page: number; limit: number; totalPages: number };
};

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  tone: "blue" | "green" | "red" | "slate";
}) {
  const toneMap = {
    blue: {
      border: "border-blue-100/80 hover:border-blue-200",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20",
      bg: "bg-gradient-to-br from-blue-50/30 to-indigo-50/10",
      badge: "bg-blue-100/60 text-blue-700"
    },
    green: {
      border: "border-emerald-100/80 hover:border-emerald-200",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20",
      bg: "bg-gradient-to-br from-emerald-50/30 to-teal-50/10",
      badge: "bg-emerald-100/60 text-emerald-700"
    },
    red: {
      border: "border-rose-100/80 hover:border-rose-200",
      iconBg: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/20",
      bg: "bg-gradient-to-br from-rose-50/30 to-red-50/10",
      badge: "bg-rose-100/60 text-rose-700"
    },
    slate: {
      border: "border-slate-200/80 hover:border-slate-300",
      iconBg: "bg-gradient-to-br from-slate-600 to-zinc-700 text-white shadow-slate-500/20",
      bg: "bg-gradient-to-br from-slate-50/50 to-zinc-50/20",
      badge: "bg-slate-100/80 text-slate-700"
    },
  } as const;

  const current = toneMap[tone];

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${current.border} ${current.bg} bg-white p-5 shadow-card transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <span className={`inline-block rounded-full ${current.badge} px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
            {label}
          </span>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${current.iconBg} shadow-md`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function ActivityLogsPage() {
  const { can, loading: permissionLoading } = useAdminPermissions();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (permissionLoading) return;
    if (!can("activity.view")) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
    });
    if (search.trim()) params.set("q", search.trim());
    if (moduleFilter) params.set("module", moduleFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (actorFilter) params.set("actorId", actorFilter);

    fetch(`/api/admin/activity-logs?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load activity logs");
        setPayload(data);
      })
      .catch((loadError) => {
        if ((loadError as Error).name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load activity logs");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [actorFilter, can, moduleFilter, page, permissionLoading, search, statusFilter]);

  const topModules = useMemo(() => (payload?.modules || []).slice(0, 6), [payload]);
  
  const maxCount = useMemo(() => {
    if (!payload?.modules || payload.modules.length === 0) return 1;
    return Math.max(...payload.modules.map(item => parseInt(item.count) || 1));
  }, [payload]);

  if (permissionLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-brand-primary" />
      </div>
    );
  }

  if (!can("activity.view")) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 px-5 py-12 text-center text-[14px] font-semibold text-rose-800 shadow-sm max-w-2xl mx-auto">
        <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        You do not have permission to view activity logs.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header section with brand-primary gradient border top */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent" />
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Activity Logs</h2>
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 w-full xl:w-auto shrink-0">
            <StatCard icon={Activity} label="Total events" value={String(payload?.summary.total || 0)} tone="blue" />
            <StatCard icon={CheckCircle2} label="Successful" value={String(payload?.summary.success || 0)} tone="green" />
            <StatCard icon={ShieldAlert} label="Failed" value={String(payload?.summary.failed || 0)} tone="red" />
            <StatCard icon={UserRound} label="Active staff" value={String(payload?.summary.actors || 0)} tone="slate" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => {
                    setPage(1);
                    setSearch(event.target.value);
                  }}
                  placeholder="Search activity..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-[13px] font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10"
                />
              </div>
              <div className="relative">
                <select
                  value={moduleFilter}
                  onChange={(event) => {
                    setPage(1);
                    setModuleFilter(event.target.value);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-[13px] font-medium text-slate-800 outline-none transition-all focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 appearance-none"
                >
                  <option value="">All Modules</option>
                  {(payload?.modules || []).map((item) => (
                    <option key={item.module} value={item.module}>
                      {titleCase(item.module)}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Filter className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setPage(1);
                    setStatusFilter(event.target.value);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-[13px] font-medium text-slate-800 outline-none transition-all focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 appearance-none"
                >
                  <option value="">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Filter className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="relative">
                <select
                  value={actorFilter}
                  onChange={(event) => {
                    setPage(1);
                    setActorFilter(event.target.value);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-[13px] font-medium text-slate-800 outline-none transition-all focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 appearance-none"
                >
                  <option value="">All Team Members</option>
                  {(payload?.members || []).map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Filter className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Activity Logs Timeline Feed */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-card overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/40 px-6 py-4.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-wider">Recent Activity Logs</h3>
                  <p className="mt-1 text-[12px] font-semibold text-slate-400">
                    {payload?.pagination.totalCount || 0} entries loaded
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Feed
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2.5 px-6 py-20 text-[13px] font-bold text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
                Loading activity logs...
              </div>
            ) : error ? (
              <div className="px-6 py-16 text-center text-[13px] font-bold text-rose-500 bg-rose-50/10 border-b border-slate-100">{error}</div>
            ) : payload?.logs.length ? (
              <div className="relative pl-6 pr-6 py-6 space-y-6 before:absolute before:inset-y-0 before:left-[33px] before:w-[2px] before:bg-slate-100">
                {payload.logs.map((log) => {
                  const isSuccess = log.status === "success";
                  const targetLabel = log.entity_type ? `${titleCase(log.entity_type)} ID` : "Target ID";
                  const displayIp = log.ip_address === "::1" ? "127.0.0.1 (Localhost)" : log.ip_address;

                  return (
                    <div key={log.id} className="group relative flex gap-4 items-start transition-all duration-300">
                      {/* Timeline Dot/Icon */}
                      <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-soft ring-4 ring-white border transition-colors duration-300 group-hover:border-slate-300">
                        <span className={`h-2.5 w-2.5 rounded-full ${isSuccess ? "bg-emerald-500" : "bg-rose-500"}`} />
                      </div>

                      {/* Content Card */}
                      <div className={`flex-1 rounded-xl border border-slate-200/60 border-l-4 ${isSuccess ? 'border-l-emerald-500/80' : 'border-l-rose-500/80'} bg-white p-3.5 shadow-tiny transition-all duration-300 hover:shadow-soft hover:border-slate-300/80 -mt-1`}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 flex items-center flex-wrap gap-2">
                            <span className="text-[13px] font-bold text-slate-800">
                              {log.actor_name || "System"}
                            </span>
                            {log.actor_role && (
                              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {log.actor_role}
                              </span>
                            )}
                            <span className="text-slate-300 text-xs">•</span>
                            <span className="text-[12px] font-semibold text-slate-500">
                              {titleCase(log.module)}: <span className="font-bold text-brand-primary">{titleCase(log.action)}</span>
                            </span>
                          </div>
                          <div className="text-[10.5px] font-semibold text-slate-400 whitespace-nowrap">
                            {formatDate(log.created_at)}
                          </div>
                        </div>

                        <p className="mt-1.5 text-[12px] text-slate-500 font-medium leading-relaxed">
                          {log.message || log.entity_label || "Action executed successfully."}
                        </p>

                        <div className="mt-2.5 flex flex-wrap gap-2 text-[10.5px] font-semibold text-slate-500">
                          {(log.entity_id || log.entity_label) && (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-200/50 px-2 py-0.5">
                              <span className="text-slate-400 font-bold">{targetLabel}:</span>
                              <span className="font-mono text-slate-600 select-all">{log.entity_id || log.entity_label}</span>
                            </span>
                          )}
                          {log.actor_email && (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-200/50 px-2 py-0.5">
                              <span className="text-slate-400 font-bold">Actor:</span>
                              <span className="text-slate-600">{log.actor_email}</span>
                            </span>
                          )}
                          {displayIp && (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-200/50 px-2 py-0.5">
                              <span className="text-slate-400 font-bold">IP:</span>
                              <span className="text-slate-600">{displayIp}</span>
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${isSuccess ? "bg-emerald-50 text-emerald-700 border border-emerald-200/30" : "bg-rose-50 text-rose-700 border border-rose-200/30"}`}>
                            {log.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-16 text-center text-[13px] font-bold text-slate-400">
                No activity logs found for the current filters.
              </div>
            )}

            {payload && payload.pagination.totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 px-6 py-4.5">
                <p className="text-[12px] font-bold text-slate-400">
                  Page {payload.pagination.page} of {payload.pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1}
                    className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(payload.pagination.totalPages, current + 1))}
                    disabled={page >= payload.pagination.totalPages}
                    className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-wider">Module Distribution</h3>
              <TrendingUp className="h-4 w-4 text-brand-primary" />
            </div>
            <div className="mt-5 space-y-4.5">
              {topModules.length ? (
                topModules.map((item) => {
                  const countVal = parseInt(item.count) || 0;
                  const pct = Math.min(100, Math.max(8, (countVal / maxCount) * 100));
                  return (
                    <div key={item.module} className="space-y-1.5 group">
                      <div className="flex items-center justify-between text-[12.5px] font-bold">
                        <span className="text-slate-700 transition-colors group-hover:text-brand-primary">{titleCase(item.module)}</span>
                        <span className="text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded-md text-[11px]">{item.count}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-500 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-[12px] font-semibold text-slate-400 py-4 text-center">No module activity yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

