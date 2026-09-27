"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { localizeError } from "@/lib/utils";

export default function AdminLoginPage() {
  const { show } = useToast();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("ssb_admin_token", data.token);
      localStorage.setItem("ssb_admin_user", data.username);
      show("Welcome back, " + data.username, "success");
      router.push("/admin/dashboard");
    } catch (err) {
      show(localizeError("en", err), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="card-surface w-full max-w-md rounded-2xl p-8">
        <h1 className="text-center text-2xl font-extrabold text-white">Admin Login</h1>
        <p className="mt-2 text-center text-xs text-white/40">
          Protected area — authorized administrators only. Admin console is English-only by design.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-white/50">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-white/50">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500" />
          </div>
          <button disabled={loading} className="w-full rounded-lg bg-brand-500 py-3 text-sm font-bold text-ink-900 shadow-glow hover:bg-brand-400 disabled:opacity-60">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-white/30">
          First run? Set ADMIN_BOOTSTRAP_USERNAME / ADMIN_BOOTSTRAP_PASSWORD in .env.local to create the first admin automatically.
        </p>
      </div>
    </section>
  );
}
