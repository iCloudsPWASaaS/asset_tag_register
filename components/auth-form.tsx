"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function AuthForm({
  mode,
  nextPath,
}: {
  mode: "login" | "signup";
  nextPath: string;
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    phone: "",
    email: "",
    password: "",
  });

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body =
        mode === "signup"
          ? {
              email: form.email,
              password: form.password,
              fullName: form.fullName,
              companyName: form.companyName,
              phone: form.phone,
            }
          : {
              email: form.email,
              password: form.password,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(
          payload.error ||
            (mode === "signup" ? "Could not create your account." : "Could not sign in."),
        );
      }

      router.push(nextPath || "/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "signup" && (
        <>
          <div>
            <label className="label" htmlFor="fullName">
              Your name
            </label>
            <input
              id="fullName"
              className="input"
              value={form.fullName}
              onChange={(event) => update("fullName", event.target.value)}
              placeholder="Jamie Smith"
              autoComplete="name"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="companyName">
                Company
              </label>
              <input
                id="companyName"
                className="input"
                value={form.companyName}
                onChange={(event) => update("companyName", event.target.value)}
                placeholder="Smith Facilities"
                autoComplete="organization"
              />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                className="input"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="07700 900123"
                autoComplete="tel"
              />
            </div>
          </div>
        </>
      )}

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="input"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          placeholder="you@company.co.uk"
          autoComplete="email"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            className="input pr-11"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={8}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "signup" ? "Create account & start trial" : "Sign in"}
      </button>

      <p className="text-center text-sm text-slate-500">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to AssetTag?{" "}
            <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Start a 30-day trial
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
