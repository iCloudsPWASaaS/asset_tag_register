"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Invalid admin credentials.");
      router.push("/admin");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid admin credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="admin-email">
          Admin email
        </label>
        <input
          id="admin-email"
          type="email"
          className="input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@gaschecker.app"
          autoComplete="username"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          className="input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
        Sign in to admin
      </button>
    </form>
  );
}
