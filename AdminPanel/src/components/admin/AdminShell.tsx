"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  ChevronRight,
  CircleUserRound,
  ExternalLink,
  FileText,
  FolderTree,
  Globe,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Megaphone,
  Monitor,
  PackagePlus,
  Percent,
  Settings,
  ShoppingBag,
  Smartphone,
  Store,
  Tag,
  UsersRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSiteContext } from "@/lib/site-context";
import { hasPermission, PAGE_PERMISSION_MAP, permissionForPath } from "@/lib/permissions";

const navGroups = [
  {
    label: "",
    items: [
      { href: "/", label: "Home", icon: Home, exact: true },
      { href: "/orders", label: "Orders", icon: ShoppingBag },
      { href: "/products", label: "Products", icon: Tag },
      { href: "/variants", label: "Variants", icon: Boxes },
      { href: "/collections", label: "Collections", icon: LayoutGrid },
      { href: "/categories", label: "Categories", icon: FolderTree },
      { href: "/customers", label: "Customers", icon: UsersRound },
    ],
  },
  {
    label: "",
    items: [
      { href: "/marketing", label: "Marketing", icon: Megaphone },
      { href: "/discounts", label: "Discounts", icon: Percent },
    ],
  },
  {
    label: "",
    items: [
      { href: "/content", label: "Content", icon: FileText },
      { href: "/markets", label: "Markets", icon: Globe },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/activity-logs", label: "Activity Logs", icon: ClipboardList },
    ],
  },
  {
    label: "Sales channels",
    items: [
      { href: "/online-store", label: "Online Store", icon: Monitor },
      { href: "/app", label: "App", icon: Smartphone },
    ],
  },
  {
    label: "",
    items: [
      { href: "/add-product", label: "Add Product", icon: PackagePlus },
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/users", label: "Members", icon: UsersRound },
    ],
  },
];

const pageTitleMap: Record<string, string> = {
  "/": "Home",
  "/orders": "Orders",
  "/products": "Products",
  "/variants": "Variants",
  "/collections": "Collections",
  "/categories": "Categories",
  "/customers": "Customers",
  "/marketing": "Marketing",
  "/discounts": "Discounts",
  "/content": "Content",
  "/markets": "Markets",
  "/analytics": "Analytics",
  "/activity-logs": "Activity Logs",
  "/online-store": "Online Store",
  "/app": "App",
  "/add-product": "Add Product",
  "/settings": "Settings",
  "/users": "Members",
};

function SidebarContent({
  pathname,
  onClose,
  onLogout,
  userRole,
  permissions,
  userName,
  userEmail,
}: {
  pathname: string;
  onClose?: () => void;
  onLogout: () => void;
  userRole: "admin" | "team";
  permissions: string[];
  userName: string;
  userEmail: string;
}) {
  const [siteSwitcherOpen, setSiteSwitcherOpen] = useState(false);
  const [addStoreMode, setAddStoreMode] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreColor, setNewStoreColor] = useState("#432F83");
  const [addingStore, setAddingStore] = useState(false);

  const activeSiteId = useSiteContext((s) => s.activeSiteId);
  const setActiveSite = useSiteContext((s) => s.setActiveSite);
  const sites = useSiteContext((s) => s.sites);
  const fetchSites = useSiteContext((s) => s.fetchSites);
  const addSite = useSiteContext((s) => s.addSite);
  const activeSite = sites.find((s) => s.id === activeSiteId) || sites[0];
  const canAddStore = hasPermission(userRole, permissions, "settings.edit");
  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const permission = PAGE_PERMISSION_MAP[item.href];
        return !permission || hasPermission(userRole, permissions, permission);
      }),
    }))
    .filter((group) => group.items.length > 0);

  // Fetch sites from DB on mount
  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  async function handleAddStore() {
    if (!newStoreName.trim()) return;
    setAddingStore(true);
    const site = await addSite(newStoreName.trim(), newStoreColor);
    if (site) {
      setActiveSite(site.id);
      setNewStoreName("");
      setNewStoreColor("#432F83");
      setAddStoreMode(false);
      setSiteSwitcherOpen(false);
    }
    setAddingStore(false);
  }

  return (
    <>
      {/* Brand / Site Switcher */}
      <div className="relative px-4 pb-4 pt-5">
        <button
          onClick={() => setSiteSwitcherOpen(!siteSwitcherOpen)}
          className="flex w-full items-center gap-3 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-[#f1f2f4]"
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: activeSite?.color || "#432F83" }}
          >
            {activeSite?.logo || "QH"}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-[13px] font-bold text-[#202223]">{activeSite?.name || "Store"}</p>
          </div>
          <ChevronRight className={cn("h-3.5 w-3.5 text-[#5c5f62] transition-transform", siteSwitcherOpen && "rotate-90")} />
        </button>
        {onClose && (
          <button onClick={onClose} className="absolute right-4 top-5 flex h-7 w-7 items-center justify-center rounded-md text-[#6d7175] transition-colors hover:bg-[#f1f2f4] hover:text-[#202223] lg:hidden">
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Dropdown */}
        {siteSwitcherOpen && (
          <div className="absolute left-4 right-4 z-50 mt-1 rounded-lg border border-[#e1e3e5] bg-white py-1 shadow-xl">
            {sites.map((site) => (
              <button
                key={site.id}
                onClick={() => { setActiveSite(site.id); setSiteSwitcherOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors hover:bg-[#f6f6f7]",
                  site.id === activeSiteId ? "font-semibold text-brand-primary bg-brand-primary/5" : "text-[#202223]",
                )}
              >
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                  style={{ backgroundColor: site.color }}
                >
                  {site.logo}
                </div>
                <span className="flex-1 truncate">{site.name}</span>
                {site.id === activeSiteId && <span className="text-[10px] text-brand-primary">●</span>}
              </button>
            ))}

            {/* Add Store */}
            {canAddStore ? <div className="border-t border-[#e1e3e5] mt-1 pt-1">
              {addStoreMode ? (
                <div className="px-3 py-2 space-y-2">
                  <input
                    type="text"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    placeholder="Store name"
                    className="w-full rounded-md border border-[#c9cccf] bg-white px-2.5 py-1.5 text-[12px] text-[#202223] placeholder:text-[#8c9196] focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    onKeyDown={(e) => e.key === "Enter" && handleAddStore()}
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newStoreColor}
                      onChange={(e) => setNewStoreColor(e.target.value)}
                      className="h-7 w-7 cursor-pointer rounded border border-[#c9cccf] bg-transparent"
                    />
                    <span className="text-[11px] text-[#6d7175]">Brand color</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleAddStore}
                      disabled={addingStore || !newStoreName.trim()}
                      className="flex-1 rounded-md bg-brand-primary py-1.5 text-[11px] font-semibold text-white hover:bg-brand-secondary disabled:opacity-50"
                    >
                      {addingStore ? "Creating..." : "Create Store"}
                    </button>
                    <button
                      onClick={() => { setAddStoreMode(false); setNewStoreName(""); }}
                      className="rounded-md px-3 py-1.5 text-[11px] text-[#6d7175] hover:bg-[#f6f6f7]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddStoreMode(true)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] text-brand-primary transition-colors hover:bg-[#f6f6f7]"
                >
                  <Store className="h-4 w-4" />
                  <span>Add new store</span>
                </button>
              )}
            </div> : null}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-4" style={{ scrollbarWidth: "none" }}>
        {visibleNavGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="mb-1 mt-3 px-3 text-[11px] font-semibold uppercase tracking-wide text-[#8c9196]">
                {group.label}
              </p>
            )}
            {!group.label && gi > 0 && <div className="my-2 border-t border-[#e1e3e5]" />}
            <div className="grid gap-px">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isExact = "exact" in item && item.exact;
                const active = isExact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-all duration-75",
                      active
                        ? "bg-brand-primary/10 font-bold text-brand-primary"
                        : "text-[#4a4a4a] hover:bg-[#f1f2f4] hover:text-[#1a1a1a]",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-sm bg-brand-primary" />
                    )}
                    <Icon className={cn("h-[17px] w-[17px] shrink-0", active ? "text-brand-primary" : "text-[#6d7175] group-hover:text-[#202223]")} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#e1e3e5] px-3 py-2">
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 ring-1 ring-[#e1e3e5]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <CircleUserRound className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-[#202223]">{userName || "Team member"}</p>
            <p className="truncate text-[11px] text-[#6d7175]">{userEmail}</p>
          </div>
        </div>
        <Link
          href="/"
          className="flex h-8 items-center gap-2 rounded-md px-2.5 text-[12px] font-medium text-[#6d7175] transition-colors hover:bg-[#f1f2f4] hover:text-[#202223]"
        >
          <ExternalLink className="h-3.5 w-3.5 text-[#8c9196]" />
          View Store
        </Link>
        <button
          onClick={onLogout}
          className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-[12px] font-medium text-[#6d7175] transition-colors hover:bg-[#f1f2f4] hover:text-[#202223]"
        >
          <LogOut className="h-3.5 w-3.5 text-[#8c9196]" />
          Log out
        </button>
      </div>
    </>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [safePathname, setSafePathname] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "team" | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string }>({ name: "", email: "" });

  useEffect(() => {
    const updatePath = () => {
      if (typeof window !== "undefined") setSafePathname(window.location.pathname || "");
    };
    updatePath();

    window.addEventListener("popstate", updatePath);
    window.addEventListener("hashchange", updatePath);

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    window.history.pushState = function (...args) {
      const ret = originalPushState.apply(this, args as any);
      updatePath();
      return ret;
    };
    window.history.replaceState = function (...args) {
      const ret = originalReplaceState.apply(this, args as any);
      updatePath();
      return ret;
    };

    return () => {
      window.removeEventListener("popstate", updatePath);
      window.removeEventListener("hashchange", updatePath);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  const isLoginPage = safePathname === "/login";
  const isBuilderPage = safePathname === "/builder";

  useEffect(() => {
    if (!safePathname) return;
    if (isLoginPage || isBuilderPage) {
      setAuthChecked(true);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    setAuthChecked(false);

    const loadAuth = () => {
      fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
        .then(async (response) => {
          if (!response.ok) throw new Error("Unauthenticated");
          return response.json();
        })
        .then((data) => {
          if (cancelled) return;
          const role = data?.user?.role === "admin" ? "admin" : "team";
          const nextPermissions = Array.isArray(data?.user?.permissions) ? data.user.permissions : [];
          setIsAuthed(true);
          setUserRole(role);
          setPermissions(nextPermissions);
          setCurrentUser({
            name: String(data?.user?.full_name || data?.user?.email || ""),
            email: String(data?.user?.email || ""),
          });
          setAuthChecked(true);

          const neededPermission = permissionForPath(safePathname);
          if (!hasPermission(role, nextPermissions, neededPermission)) {
            const firstAllowed = Object.entries(PAGE_PERMISSION_MAP).find(([, permission]) =>
              hasPermission(role, nextPermissions, permission),
            )?.[0];
            window.location.replace(firstAllowed || "/login");
          }
        })
        .catch(() => {
          if (cancelled) return;
          setIsAuthed(false);
          setUserRole(null);
          setPermissions([]);
          setCurrentUser({ name: "", email: "" });
          setAuthChecked(true);
          window.location.replace("/login");
        });
    };

    loadAuth();
    window.addEventListener("focus", loadAuth);
    intervalId = setInterval(loadAuth, 30000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadAuth);
      if (intervalId) clearInterval(intervalId);
    };
  }, [safePathname, isLoginPage, isBuilderPage]);

  function handleLogout() {
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      window.location.href = "/login";
    });
  }

  if (isLoginPage || isBuilderPage) return <>{children}</>;
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f6f7]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e1e3e5] border-t-brand-primary" />
      </div>
    );
  }
  if (!isAuthed) return null;

  const pageTitle = pageTitleMap[safePathname] ||
    Object.entries(pageTitleMap).find(([k]) => safePathname.startsWith(k + "/"))?.[1] ||
    "Admin";

  return (
    <div className="min-h-screen bg-[#f6f6f7]">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[220px] flex-col bg-[#fafbfc] border-r border-[#e1e3e5] lg:flex">
        <SidebarContent
          pathname={safePathname}
          onLogout={handleLogout}
          userRole={userRole || "team"}
          permissions={permissions}
          userName={currentUser.name}
          userEmail={currentUser.email}
        />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#fafbfc] border-r border-[#e1e3e5] shadow-2xl transition-transform duration-200 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent
          pathname={safePathname}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
          userRole={userRole || "team"}
          permissions={permissions}
          userName={currentUser.name}
          userEmail={currentUser.email}
        />
      </aside>

      {/* Main */}
      <div className="lg:pl-[220px]">
        <header className="sticky top-0 z-30 border-b border-[#e1e3e5] bg-white px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-[#c9cccf] text-[#6d7175] transition-colors hover:bg-[#f6f6f7] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-[#202223]">{pageTitle}</h1>
            </div>
            {userRole ? (
              <span
                className={cn(
                  "hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex",
                  userRole === "admin"
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "bg-[#e8eefc] text-[#2d4fb3]",
                )}
              >
                {userRole === "admin" ? "Admin" : "Employee"}
              </span>
            ) : null}
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-md border border-[#c9cccf] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#202223] shadow-[0_1px_0_rgba(0,0,0,0.05)] transition-all hover:bg-[#f6f6f7] sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Store
            </Link>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
