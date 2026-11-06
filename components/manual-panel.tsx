"use client";

import { useState } from "react";
import {
  BookOpen,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { Asset, ManualResult } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function ManualPanel({ asset, aiEnabled }: { asset: Asset; aiEnabled: boolean }) {
  const [manual, setManual] = useState<ManualResult | null>(asset.manual);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: asset.id,
          make: asset.make,
          model: asset.model,
          type: asset.type,
          serialNumber: asset.serialNumber,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        manual?: ManualResult;
        error?: string;
      };
      if (!response.ok || !payload.manual) {
        throw new Error(payload.error || "Could not build the guidance.");
      }
      setManual(payload.manual);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not build the guidance.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            <h2 className="section-title">Manufacturer guidance</h2>
          </div>
          <p className="muted mt-0.5">
            Safety points, maintenance tasks and manual links for this asset.
          </p>
        </div>
        {manual && (
          <span className={manual.status === "ai" ? "badge-indigo" : "badge-slate"}>
            {manual.status === "ai" ? "AI guidance" : "Search links"}
          </span>
        )}
      </div>

      <div className="p-5">
        {manual ? (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-slate-700">{manual.summary}</p>

            {manual.safety.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                  Safety
                </div>
                <ul className="mt-2 space-y-1.5">
                  {manual.safety.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {manual.maintenance.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Wrench className="h-3.5 w-3.5 text-sky-500" />
                  Maintenance
                </div>
                <ul className="mt-2 space-y-1.5">
                  {manual.maintenance.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {manual.specs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                  Specifications
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {manual.specs.map((item) => (
                    <span key={item} className="badge-slate">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {manual.sources.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                  Sources & searches
                </div>
                <div className="mt-2 space-y-1.5">
                  {manual.sources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50/40"
                    >
                      <span className="line-clamp-1">{source.title}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
              <p className="text-[11px] text-slate-400">
                {manual.provider ? `${manual.provider} · ` : ""}
                {formatDateTime(manual.generatedAt)}
              </p>
              <button type="button" onClick={generate} className="btn-secondary btn-sm" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Refresh guidance
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-8 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
              <BookOpen className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              No manufacturer guidance yet
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
              {aiEnabled
                ? "Generate AI-assisted safety, maintenance and specification guidance, plus links to the manufacturer documentation."
                : "AI is not configured, so we will prepare targeted manual searches for this make and model."}
            </p>
            <button type="button" onClick={generate} className="btn-primary btn-sm mt-4" disabled={loading}>
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {loading ? "Building guidance…" : "Find manufacturer guidance"}
            </button>
            {!aiEnabled && (
              <p className="mt-3 text-[11px] text-slate-400">
                Tip: add an AI key in the environment to unlock automatic manufacturer instructions.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}
