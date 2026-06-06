"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Activity, Check, KeyRound, Plus, Save, ShieldCheck, UserRound, Users, Mail, Shield, Info, Lock, Loader2, ChevronDown, Home, ShoppingBag, Tag, Boxes, LayoutGrid, FolderTree, UsersRound, Megaphone, Percent, FileText, Globe, BarChart3, Monitor, Smartphone, Settings } from "lucide-react";
import { useAdminPermissions } from "@/lib/use-admin-permissions";

type PermissionDefinition = {
  code: string;
  module: string;
  action: string;
  label: string;
  description: string;
  sortOrder: number;
};

type Member = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "team";
  is_active: boolean;
  permissions_locked: boolean;
  last_login_at: string | null;
  created_at: string;
  permissions: string[];
};

type FormState = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "team";
  is_active: boolean;
  password: string;
  permissions: string[];
};

const blankForm: FormState = {
  id: "",
  email: "",
  full_name: "",
  role: "team",
  is_active: true,
  password: "",
  permissions: ["home.view"],
};

const moduleLabels: Record<string, string> = {
  home: "Home",
  orders: "Orders",
  products: "Products",
  variants: "Variants",
  collections: "Collections",
  categories: "Categories",
  customers: "Customers",
  marketing: "Marketing",
  discounts: "Discounts",
  content: "Content",
  markets: "Markets",
  analytics: "Analytics",
  activity: "Activity Logs",
  online_store: "Online Store",
  app: "App",
  settings: "Settings",
  members: "Members",
};

const moduleIcons: Record<string, any> = {
  home: Home,
  orders: ShoppingBag,
  products: Tag,
  variants: Boxes,
  collections: LayoutGrid,
  categories: FolderTree,
  customers: UsersRound,
  marketing: Megaphone,
  discounts: Percent,
  content: FileText,
  markets: Globe,
  analytics: BarChart3,
  activity: Activity,
  online_store: Monitor,
  app: Smartphone,
  settings: Settings,
  members: Users,
};

function getInitials(name: string) {
  if (!name) return "QH";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

function normalizeSelectedPermissions(codes: string[], definitions: PermissionDefinition[]) {
  const allowed = new Set(definitions.map((permission) => permission.code));
  const selected = new Set(codes.filter((code) => allowed.has(code)));

  for (const code of Array.from(selected)) {
    const permission = definitions.find((item) => item.code === code);
    if (!permission || permission.action === "view") continue;
    const moduleViewCode = `${permission.module}.view`;
    if (allowed.has(moduleViewCode)) selected.add(moduleViewCode);
  }

  if (selected.has("members.permissions.manage")) selected.add("members.view");
  return Array.from(selected);
}

export default function AdminUsersPage() {
  const { can } = useAdminPermissions();
  const [members, setMembers] = useState<Member[]>([]);
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [form, setForm] = useState<FormState>(blankForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const toggleModuleExpanded = (module: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }));
  };

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, PermissionDefinition[]>>((groups, permission) => {
      groups[permission.module] = groups[permission.module] || [];
      groups[permission.module].push(permission);
      groups[permission.module].sort((a, b) => a.sortOrder - b.sortOrder);
      return groups;
    }, {});
  }, [permissions]);

  async function loadMembers() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/members", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load members");
      setMembers(Array.isArray(data.members) ? data.members : []);
      setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  function editMember(member: Member) {
    setForm({
      id: member.id,
      email: member.email,
      full_name: member.full_name,
      role: member.role,
      is_active: member.is_active,
      password: "",
      permissions: normalizeSelectedPermissions(member.permissions || [], permissions),
    });
    setMessage("");
  }

  const handleEditClick = (member: Member) => {
    editMember(member);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function togglePermission(code: string) {
    setForm((current) => {
      const set = new Set(current.permissions);
      if (set.has(code)) set.delete(code);
      else set.add(code);
      return { ...current, permissions: normalizeSelectedPermissions(Array.from(set), permissions) };
    });
  }

  function toggleModule(module: string) {
    const codes = groupedPermissions[module]?.map((permission) => permission.code) || [];
    setForm((current) => {
      const set = new Set(current.permissions);
      const allSelected = codes.every((code) => set.has(code));
      codes.forEach((code) => {
        if (allSelected) set.delete(code);
        else set.add(code);
      });
      return { ...current, permissions: normalizeSelectedPermissions(Array.from(set), permissions) };
    });
  }

  async function submitMember(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const isEdit = Boolean(form.id);
      const normalizedPermissions = normalizeSelectedPermissions(form.permissions, permissions);
      const payload = {
        ...form,
        permissions: normalizedPermissions,
      };
      if (isEdit && !can("members.permissions.manage")) {
        delete (payload as Partial<FormState>).permissions;
      }
      const response = await fetch("/api/admin/members", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save member");
      setMessage(isEdit ? "Member updated." : "Member created.");
      setForm(blankForm);
      await loadMembers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save member");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateMember(id: string) {
    setMessage("");
    const response = await fetch(`/api/admin/members?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Failed to deactivate member");
      return;
    }
    await loadMembers();
  }

  async function activateMember(member: Member) {
    setMessage("");
    try {
      const response = await fetch("/api/admin/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: member.id,
          full_name: member.full_name,
          role: member.role,
          is_active: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to activate member");
      setMessage(`Member "${member.full_name}" activated.`);
      await loadMembers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to activate member");
    }
  }

  return (
    <div className="grid gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-brand-primary">
            <Users className="h-3.5 w-3.5" />
            Workspace Team
          </div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl lg:text-[22px]">Members & Permissions</h2>
          <p className="text-[13px] font-medium text-slate-500">
            Control access levels, configure granular module permissions, and manage your team.
          </p>
        </div>
        {can("members.create") ? (
          <button
            onClick={() => setForm(blankForm)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary px-5 py-2.5 text-[13px] font-bold text-white shadow-soft hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            New Member
          </button>
        ) : null}
      </div>

      {message ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3.5 text-[13px] font-semibold text-blue-800 shadow-sm flex items-center gap-2.5 animate-fadeIn">
          <Info className="h-4 w-4 text-blue-500 shrink-0" />
          <span>{message}</span>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        {/* Left Column: Form + Members List */}
        <div className="space-y-6">
          {((form.id && can("members.edit")) || (!form.id && can("members.create"))) ? (
            <form onSubmit={submitMember} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                  <UserRound className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-wider">
                  {form.id ? "Edit Member" : "Create Member"}
                </h3>
              </div>

              <div className="grid gap-4">
                <label className="grid gap-1.5 text-[12.5px] font-bold text-slate-700">
                  Full Name
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={form.full_name}
                      onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                      className="h-10 w-full rounded-xl border border-slate-200 pl-[42px] pr-3 text-[13px] font-medium text-slate-800 outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                      placeholder="Enter name"
                      required
                    />
                  </div>
                </label>

                <label className="grid gap-1.5 text-[12.5px] font-bold text-slate-700">
                  Email Address
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      disabled={Boolean(form.id)}
                      className="h-10 w-full rounded-xl border border-slate-200 pl-[42px] pr-3 text-[13px] font-medium text-slate-800 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                </label>

                <label className="grid gap-1.5 text-[12.5px] font-bold text-slate-700">
                  Role
                  <div className="relative">
                    <Shield className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={form.role}
                      onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as "admin" | "team" }))}
                      className="h-10 w-full rounded-xl border border-slate-200 pl-[42px] pr-10 text-[13px] font-medium text-slate-800 outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 appearance-none bg-white cursor-pointer"
                    >
                      <option value="team">Team Member</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </label>

                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 flex items-center justify-between">
                  <span className="text-[12.5px] font-bold text-slate-700">Active Status</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary"></div>
                  </label>
                </div>

                <label className="grid gap-1.5 text-[12.5px] font-bold text-slate-700">
                  <span className="inline-flex items-center gap-1">
                    <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                    {form.id ? "Change Password" : "Password"}
                  </span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder={form.id ? "•••••••• (Leave blank to keep)" : "Minimum 6 characters"}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-[13px] font-medium text-slate-800 outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                    required={!form.id}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-[13px] font-bold text-white shadow-soft hover:bg-brand-secondary disabled:opacity-60 transition-all hover:shadow-md active:scale-[0.98]"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Member Details"}
              </button>
            </form>
          ) : null}

          {/* Team Members List Card */}
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/40">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200/60 text-slate-600">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-wider">Team Members</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200/40">
                {members.length} Total
              </span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-[13px] font-bold text-slate-400 flex flex-col items-center gap-2.5">
                <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
                Loading directory...
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {members.map((member) => {
                  const initials = getInitials(member.full_name);
                  const isActive = member.is_active;
                  return (
                    <div key={member.id} className="p-5 flex flex-col hover:bg-slate-50/30 transition-colors duration-150">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-secondary text-[13.5px] font-bold text-white shadow-md shadow-brand-primary/10 select-none">
                          {initials}
                        </div>
                        
                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-black text-slate-900 text-[14.5px] tracking-tight truncate" title={member.full_name}>
                              {member.full_name}
                            </p>
                            <span className={`rounded-full px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider shrink-0 select-none ${
                              member.role === "admin"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200/50"
                                : "bg-slate-100 text-slate-600 border border-slate-200/50"
                            }`}>
                              {member.role}
                            </span>
                          </div>
                          
                          <p className="mt-0.5 text-xs font-semibold text-slate-500 truncate" title={member.email}>
                            {member.email}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100/50">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/35 px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-emerald-700">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                </span>
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200/35 px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-rose-700">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                                </span>
                                Suspended
                              </span>
                            )}
                            
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              {member.role === "admin" ? "Super Admin" : `${member.permissions?.length || 0} Permissions`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {(can("members.edit") || can("members.delete")) && (
                        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                          {can("members.edit") && (
                            <button
                              type="button"
                              onClick={() => handleEditClick(member)}
                              className="flex-1 rounded-xl border border-slate-200 bg-white py-1.5 text-center text-xs font-black text-slate-700 hover:bg-brand-primary/[0.03] hover:text-brand-primary hover:border-brand-primary/30 transition-all shadow-soft focus:outline-none"
                            >
                              Edit Profile
                            </button>
                          )}
                          {can("members.delete") && (
                            isActive ? (
                              <button
                                type="button"
                                onClick={() => deactivateMember(member.id)}
                                className="flex-1 rounded-xl border border-rose-200 bg-white py-1.5 text-center text-xs font-black text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-all shadow-soft focus:outline-none"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => activateMember(member)}
                                className="flex-1 rounded-xl border border-emerald-200 bg-white py-1.5 text-center text-xs font-black text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-all shadow-soft focus:outline-none"
                              >
                                Activate
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Granular Permissions */}
        <div className="h-fit">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-wider">Granular Permissions</h3>
            </div>

            {form.role === "admin" ? (
              <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4.5 py-4 text-[13px] font-bold text-brand-primary shadow-sm flex items-center gap-3">
                <Lock className="h-5 w-5 text-brand-primary shrink-0 animate-pulse" />
                <div>
                  <p className="font-black uppercase tracking-wider text-[11px]">Super Administrator Mode</p>
                  <p className="mt-0.5 font-medium text-brand-primary/80">Administrators automatically have complete access to all modules and configurations.</p>
                </div>
              </div>
            ) : can("members.permissions.manage") ? (
              <div className="space-y-3">
                {Object.entries(groupedPermissions).map(([module, items]) => {
                  const allSelected = items.every((permission) => form.permissions.includes(permission.code));
                  const selectedInModule = items.filter((permission) => form.permissions.includes(permission.code)).length;
                  const isOpen = expandedModules[module] || false;
                  const IconComponent = moduleIcons[module] || Shield;

                  return (
                    <div
                      key={module}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white shadow-soft ${
                        isOpen ? "border-brand-primary/30 ring-1 ring-brand-primary/5" : "border-slate-200/80 hover:border-slate-300"
                      }`}
                    >
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => toggleModuleExpanded(module)}
                        className="flex w-full items-center justify-between px-5 py-4 text-left select-none bg-white hover:bg-slate-50/30 transition-colors focus:outline-none"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                              isOpen ? "bg-brand-primary/10 text-brand-primary" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <IconComponent className="h-4.5 w-4.5" />
                          </div>
                          <span className="text-sm font-bold text-slate-800 tracking-tight truncate">
                            {moduleLabels[module] || module}
                          </span>
                          {selectedInModule > 0 && (
                            <span className="inline-flex items-center rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-[9px] font-black text-brand-primary border border-brand-primary/20 uppercase tracking-wider shrink-0">
                              {selectedInModule} / {items.length} Active
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                            isOpen ? "rotate-180 text-brand-primary" : ""
                          }`}
                        />
                      </button>

                      {/* Accordion Body */}
                      {isOpen && (
                        <div className="border-t border-slate-100 bg-slate-50/15 p-5 space-y-4 animate-slideDown">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              {moduleLabels[module] || module} Permissions
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleModule(module)}
                              className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-brand-primary hover:bg-brand-primary/5 hover:border-brand-primary/30 transition-all active:scale-95 shadow-soft focus:outline-none"
                            >
                              {allSelected ? "Clear All Section" : "Select All Section"}
                            </button>
                          </div>

                          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                            {items.map((permission) => {
                              const isChecked = form.permissions.includes(permission.code);
                              return (
                                <label
                                  key={permission.code}
                                  className={`flex items-start gap-3 rounded-xl p-3 border transition-all cursor-pointer select-none ${
                                    isChecked
                                      ? "bg-brand-primary/[0.03] border-brand-primary/20"
                                      : "bg-white border-slate-200/60 hover:border-slate-300"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => togglePermission(permission.code)}
                                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand-primary cursor-pointer"
                                  />
                                  <span className="min-w-0">
                                    <span
                                      className={`block text-[12.5px] font-bold ${
                                        isChecked ? "text-brand-primary" : "text-slate-800"
                                      }`}
                                    >
                                      {permission.label}
                                    </span>
                                    <span className="block text-[11px] text-slate-400 mt-1 font-medium leading-relaxed">
                                      {permission.description}
                                    </span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] font-medium text-slate-500">
                You can edit member details, but permission assignment requires the <strong className="text-slate-700">Manage Member Permissions</strong> permission.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
