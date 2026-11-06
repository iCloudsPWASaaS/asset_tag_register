"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";

export function SettingsForm({
  initial,
  email,
}: {
  initial: { fullName: string; companyName: string; phone: string };
  email: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not save your settings.");
      setMessage({ type: "success", text: "Settings saved." });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not save your settings.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="fullName">
            Full name
          </label>
          <input
            id="fullName"
            className="input"
            value={form.fullName}
            onChange={(event) => update("fullName", event.target.value)}
            placeholder="Jamie Smith"
          />
        </div>
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
          />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" className="input bg-slate-50" value={email} readOnly />
        </div>
      </div>

      {message && (
        <div
          className={
            message.type === "success"
              ? "rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700"
              : "rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
          }
        >
          {message.text}
        </div>
      )}

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save changes
      </button>
    </form>
  );
}
