"use client";

import { useMemo, useState } from "react";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Filter,
  Printer,
  Search,
  Tags,
  X,
} from "lucide-react";
import type { AssetSummary, Premises } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function RegisterClient({
  assets,
  premises,
  company,
}: {
  assets: AssetSummary[];
  premises: Premises[];
  company: string;
}) {
  const [query, setQuery] = useState("");
  const [premisesFilter, setPremisesFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const types = useMemo(
    () => Array.from(new Set(assets.map((asset) => asset.type).filter(Boolean))).sort(),
    [assets],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return assets
      .filter((asset) => {
        if (premisesFilter && asset.premisesId !== premisesFilter) return false;
        if (typeFilter && asset.type !== typeFilter) return false;
        if (statusFilter && asset.status !== statusFilter) return false;
        if (!needle) return true;
        return [
          asset.tag,
          asset.premisesName,
          asset.location,
          asset.type,
          asset.make,
          asset.model,
          asset.serialNumber,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => a.tag.localeCompare(b.tag));
  }, [assets, query, premisesFilter, typeFilter, statusFilter]);

  const hasFilters = Boolean(query || premisesFilter || typeFilter || statusFilter);

  function exportUrl(format: "csv" | "pdf" | "json") {
    const params = new URLSearchParams({ format });
    if (premisesFilter) params.set("premises", premisesFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (query.trim()) params.set("q", query.trim());
    return `/api/register/export?${params.toString()}`;
  }

  const active = filtered.filter((asset) => asset.status === "active").length;
  const archived = filtered.filter((asset) => asset.status === "archived").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Export centre
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Detailed asset register
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Filter the register, then export a polished PDF, spreadsheet-ready CSV or JSON backup.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className="btn-secondary">
            <Printer className="h-4 w-4" />
            Print
          </button>
          <a href={exportUrl("pdf")} className="btn-primary">
            <Download className="h-4 w-4" />
            Download PDF
          </a>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "In register", value: filtered.length },
          { label: "Active", value: active },
          { label: "Archived", value: archived },
          { label: "Premises", value: new Set(filtered.map((asset) => asset.premisesId)).size },
        ].map((item) => (
          <div key={item.label} className="card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="no-print card p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the register…"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
            <select
              className="input min-w-0 py-2 text-xs lg:w-44"
              value={premisesFilter}
              onChange={(event) => setPremisesFilter(event.target.value)}
            >
              <option value="">All premises</option>
              {premises.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              className="input min-w-0 py-2 text-xs lg:w-40"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="">All types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              className="input min-w-0 py-2 text-xs lg:w-32"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="removed">Removed</option>
            </select>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setPremisesFilter("");
                  setTypeFilter("");
                  setStatusFilter("");
                }}
                className="btn-ghost btn-sm"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Filter className="h-3 w-3" />
            {hasFilters ? `Showing ${filtered.length} of ${assets.length}` : `All ${assets.length} assets`}
          </p>
          <div className="flex flex-wrap gap-2">
            <a href={exportUrl("csv")} className="btn-secondary btn-sm">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              CSV
            </a>
            <a href={exportUrl("pdf")} className="btn-secondary btn-sm">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              PDF
            </a>
            <a href={exportUrl("json")} className="btn-secondary btn-sm">
              <FileJson className="h-3.5 w-3.5" />
              JSON
            </a>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="hidden border-b border-slate-100 px-5 py-4 print:block">
          <h2 className="text-lg font-bold text-slate-900">Asset Tag Register</h2>
          <p className="text-xs text-slate-500">
            {company} · Generated {formatDate(new Date().toISOString())} · {filtered.length} assets
          </p>
        </div>
        {filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Tags className="h-5 w-5" />
            </span>
            <h2 className="mt-3 text-sm font-semibold text-slate-900">Nothing to export yet</h2>
            <p className="mt-1 text-sm text-slate-500">
              Add assets or clear the filters to build the register.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="table-th">Tag</th>
                  <th className="table-th">Premises</th>
                  <th className="table-th">Location</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Make / model</th>
                  <th className="table-th">Serial no.</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Guidance</th>
                  <th className="table-th">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/60">
                    <td className="table-td font-mono text-xs font-bold text-indigo-700">
                      {asset.tag}
                    </td>
                    <td className="table-td">{asset.premisesName}</td>
                    <td className="table-td">{asset.location || "—"}</td>
                    <td className="table-td">{asset.type || "—"}</td>
                    <td className="table-td">
                      {[asset.make, asset.model].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="table-td font-mono text-xs">{asset.serialNumber || "—"}</td>
                    <td className="table-td">
                      <span
                        className={
                          asset.status === "active"
                            ? "badge-green"
                            : asset.status === "archived"
                              ? "badge-amber"
                              : "badge-rose"
                        }
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td className="table-td">
                      {asset.manualStatus !== "none" ? (
                        <span className="badge-indigo">Added</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="table-td whitespace-nowrap text-xs text-slate-500">
                      {formatDate(asset.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
