"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarPlus, CheckCircle2, Loader2, XCircle } from "lucide-react";

export function AdminActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function run(action: "extend" | "activate" | "cancel") {
    setBusy(action);
    setError("");
    try {
      const response = await fetch("/api/admin/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not update the subscription.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update the subscription.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap justify-end gap-1.5">
        <button
          type="button"
          onClick={() => run("extend")}
          disabled={Boolean(busy)}
          className="btn-secondary btn-sm"
          title="Extend trial by 30 days"
        >
          {busy === "extend" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CalendarPlus className="h-3.5 w-3.5" />
          )}
          +30d
        </button>
        <button
          type="button"
          onClick={() => run("activate")}
          disabled={Boolean(busy)}
          className="btn-secondary btn-sm text-emerald-700"
          title="Activate plan"
        >
          {busy === "activate" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Activate
        </button>
        <button
          type="button"
          onClick={() => run("cancel")}
          disabled={Boolean(busy)}
          className="btn-secondary btn-sm text-rose-700"
          title="Cancel plan"
        >
          {busy === "cancel" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          Cancel
        </button>
      </div>
      {error && <p className="mt-1.5 text-right text-[11px] text-rose-600">{error}</p>}
    </div>
  );
}
