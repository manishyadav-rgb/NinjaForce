"use client";

import { useEffect, useMemo, useState } from "react";

type MeResponse = {
  user?: {
    role?: "admin" | "team";
    permissions?: string[];
  };
};

export function useAdminPermissions() {
  const [role, setRole] = useState<"admin" | "team" | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const loadPermissions = () => {
      fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
        .then(async (response) => {
          if (!response.ok) throw new Error("Unauthenticated");
          return response.json() as Promise<MeResponse>;
        })
        .then((data) => {
          if (cancelled) return;
          setRole(data.user?.role || "team");
          setPermissions(Array.isArray(data.user?.permissions) ? data.user.permissions : []);
        })
        .catch(() => {
          if (cancelled) return;
          setRole(null);
          setPermissions([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    loadPermissions();
    window.addEventListener("focus", loadPermissions);
    intervalId = setInterval(loadPermissions, 30000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadPermissions);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return useMemo(
    () => ({
      loading,
      role,
      permissions,
      can: (permissionCode: string) => role === "admin" || permissions.includes(permissionCode),
    }),
    [loading, role, permissions],
  );
}
