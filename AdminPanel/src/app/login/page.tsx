"use client";

import { useState, FormEvent } from "react";
import { useEffect } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function TeamLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const hasTokenCookie = document.cookie.includes("qh_token=");
    if (hasTokenCookie) {
      window.location.replace("/");
      return;
    }

    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        const role = data?.user?.role || data?.role;
        if (role === "admin" || role === "team") {
          window.location.replace("/");
        }
      })
      .catch(() => {});
  }, []);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/team-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // Store user info for client-side usage
      localStorage.setItem("qh_team_user", JSON.stringify(data.user));
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f6f7] p-4">
      <div className="w-full max-w-[380px]">
        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#008060] text-lg font-bold text-white">
            QH
          </div>
          <h1 className="mt-3 text-lg font-semibold text-[#202223]">Log in to QuirkyHome</h1>
          <p className="mt-1 text-[13px] text-[#6d7175]">Admin & Team Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-[#e1e3e5] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          {error && (
            <div className="mb-4 rounded-md border border-[#e0b3b2] bg-[#fff4f4] px-3 py-2.5 text-[13px] font-medium text-[#d72c0d]">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#202223]">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c9196]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@quirkyhome.in"
                  className="w-full rounded-md border border-[#c9cccf] bg-white py-2.5 pl-10 pr-3 text-[14px] text-[#202223] placeholder:text-[#b5b5b5] focus:border-[#008060] focus:outline-none focus:ring-2 focus:ring-[#008060]/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#202223]">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c9196]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-[#c9cccf] bg-white py-2.5 pl-10 pr-10 text-[14px] text-[#202223] focus:border-[#008060] focus:outline-none focus:ring-2 focus:ring-[#008060]/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c9196] hover:text-[#202223]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-md bg-[#008060] py-2.5 text-[14px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.2)] transition-colors hover:bg-[#006e52] disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
