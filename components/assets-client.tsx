"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Camera,
  FileSpreadsheet,
  Filter,
  Plus,
  QrCode,
  Search,
  Tags,
  X,
} from "lucide-react";
import type { AssetSummary, Premises } from "@/lib/types";
import { authPhotoUrl, formatDate } from "@/lib/utils";

function statusClass(status: AssetSummary["status"]) {
  if (status === "active") return "badge-green";
  if (status === "archived") return "badge-amber";
  return "badge-rose";
}

export function AssetsClient({
  assets,
  premises,
  initialPremises,
}: {
  assets: AssetSummary[];
  premises: Premises[];
  initialPremises?: string;
}) {
  const [query, setQuery] = useState("");
  const [premisesFilter, setPremisesFilter] = useState(initialPremises || "");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const types = useMemo(
    () => Array.from(new Set(assets.map((asset) => asset.type).filter(Boolean))).sort(),
    [assets],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return assets.filter((asset) => {
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
    });
  }, [assets, query, premisesFilter, typeFilter, statusFilter]);

  const hasFilters = Boolean(query || premisesFilter || typeFilter || statusFilter);

  function clearFilters() {
    setQuery("");
    setPremisesFilter("");
    setTypeFilter("");
    setStatusFilter("");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Asset register
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Assets
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {assets.length} tagged item{assets.length === 1 ? "" : "s"} across {premises.length}{" "}
            premises.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/register" className="btn-secondary">
            <FileSpreadsheet className="h-4 w-4" />
            Register
          </Link>
          <Link href="/assets/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            New asset
          </Link>
        </div>
      </div>

      <div className="card p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tag, premises, make, model or serial…"
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
              <button type="button" onClick={clearFilters} className="btn-ghost btn-sm">
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
        {hasFilters && (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <Filter className="h-3 w-3" />
            Showing {filtered.length} of {assets.length} assets
          </p>
        )}
      </div>

      {assets.length === 0 ? (
        <div className="card px-5 py-16 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Camera className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Build your first register</h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">
            Take a photo of an asset or its label, confirm the details and save. We will generate a
            QR code you can print onto a sticky label.
          </p>
          <Link href="/assets/new" className="btn-primary mt-5">
            <Plus className="h-4 w-4" />
            Capture your first asset
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card px-5 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Search className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-sm font-semibold text-slate-900">No matching assets</h2>
          <p className="mt-1 text-sm text-slate-500">Try clearing the filters or searching for something else.</p>
          <button type="button" onClick={clearFilters} className="btn-secondary btn-sm mt-4">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="table-th">Asset</th>
                  <th className="table-th">Premises / location</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Make / model</th>
                  <th className="table-th">Serial</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Updated</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/60">
                    <td className="table-td">
                      <Link href={`/assets/${asset.id}`} className="flex items-center gap-3">
                        {asset.photoPath ? (
                          <img
                            src={authPhotoUrl(asset.photoPath)}
                            alt=""
                            className="h-11 w-11 rounded-lg border border-slate-200 object-cover"
                          />
                        ) : (
                          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                            <Tags className="h-4 w-4" />
                          </span>
                        )}
                        <span>
                          <span className="block font-mono text-xs font-bold text-indigo-700">
                            {asset.tag}
                          </span>
                          <span className="block text-[11px] text-slate-500">
                            {asset.manualStatus !== "none" ? "Guidance added" : "No guidance"}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="table-td">
                      <span className="block text-sm font-medium text-slate-800">
                        {asset.premisesName}
                      </span>
                      <span className="block text-xs text-slate-500">{asset.location || "—"}</span>
                    </td>
                    <td className="table-td">{asset.type || "—"}</td>
                    <td className="table-td">
                      <span className="block text-sm text-slate-800">{asset.make || "—"}</span>
                      <span className="block text-xs text-slate-500">{asset.model || "—"}</span>
                    </td>
                    <td className="table-td font-mono text-xs">{asset.serialNumber || "—"}</td>
                    <td className="table-td">
                      <span className={statusClass(asset.status)}>
                        {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                      </span>
                    </td>
                    <td className="table-td whitespace-nowrap text-xs text-slate-500">
                      {formatDate(asset.updatedAt)}
                    </td>
                    <td className="table-td">
                      <div className="flex justify-end gap-1.5">
                        <Link href={`/assets/${asset.id}`} className="btn-secondary btn-sm">
                          View
                        </Link>
                        <Link href={`/assets/${asset.id}/label`} className="btn-ghost btn-sm" title="Print label">
                          <QrCode className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
