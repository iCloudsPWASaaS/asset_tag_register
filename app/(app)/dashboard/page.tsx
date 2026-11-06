import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Camera,
  FileSpreadsheet,
  Plus,
  QrCode,
  Sparkles,
  Tags,
  TrendingUp,
} from "lucide-react";
import { requireAccount } from "@/lib/auth";
import { listAssets, listPremises } from "@/lib/storage";
import { formatDate, photoUrlForAsset } from "@/lib/utils";

export const metadata = {
  title: "Dashboard",
};

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <span className={`rounded-xl p-2.5 ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const { user, account } = await requireAccount();
  const [assets, premises] = await Promise.all([listAssets(user.id), listPremises(user.id)]);

  const types = new Set(assets.map((asset) => asset.type).filter(Boolean));
  const manuals = assets.filter((asset) => asset.manualStatus !== "none").length;
  const recent = assets.slice(0, 6);
  const displayName =
    account.profile?.full_name?.split(" ")[0] ||
    String(user.user_metadata?.full_name || "").split(" ")[0] ||
    "there";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Overview
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Good to see you, {displayName}.
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {assets.length === 0
              ? "Start with your first asset photo and build the register from there."
              : `${assets.length} asset${assets.length === 1 ? "" : "s"} across ${premises.length} premises.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/assets/new" className="btn-primary">
            <Camera className="h-4 w-4" />
            Capture asset
          </Link>
          <Link href="/register" className="btn-secondary">
            <FileSpreadsheet className="h-4 w-4" />
            Export register
          </Link>
        </div>
      </div>

      {account.access.reason !== "dev" &&
        account.access.reason !== "active" &&
        account.access.daysLeft <= 10 && (
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-amber-100 p-2 text-amber-700">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {account.access.daysLeft} day{account.access.daysLeft === 1 ? "" : "s"} left in your trial
                </p>
                <p className="text-xs text-amber-700">
                  Keep your QR labels, photos and register exports after the trial by activating a plan.
                </p>
              </div>
            </div>
            <Link href="/billing" className="btn-secondary btn-sm shrink-0">
              View plan
            </Link>
          </div>
        )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Assets"
          value={assets.length}
          hint="Every tagged item in the register"
          icon={Tags}
          tone="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="Premises"
          value={premises.length}
          hint="Sites and locations on file"
          icon={Building2}
          tone="bg-sky-50 text-sky-600"
        />
        <StatCard
          label="Asset types"
          value={types.size}
          hint="Categories used across your sites"
          icon={TrendingUp}
          tone="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="With guidance"
          value={manuals}
          hint="Assets with manual links or AI guidance"
          icon={Sparkles}
          tone="bg-violet-50 text-violet-600"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="section-title">Recent assets</h2>
              <p className="muted mt-0.5">The latest items added to your register.</p>
            </div>
            <Link
              href="/assets"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Camera className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">No assets yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                Take a photo of the asset label, check the details and generate the QR sticker.
              </p>
              <Link href="/assets/new" className="btn-primary mt-5">
                <Plus className="h-4 w-4" />
                Add your first asset
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="table-th">Asset</th>
                    <th className="table-th">Premises / location</th>
                    <th className="table-th">Type</th>
                    <th className="table-th">Serial</th>
                    <th className="table-th">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50/60">
                      <td className="table-td">
                        <Link href={`/assets/${asset.id}`} className="flex items-center gap-3">
                          {asset.photoPath ? (
                            <img
                              src={photoUrlForAsset(user.id, asset.id)}
                              alt=""
                              className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                            />
                          ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                              <Tags className="h-4 w-4" />
                            </span>
                          )}
                          <span>
                            <span className="block font-semibold text-slate-900">{asset.tag}</span>
                            <span className="block text-xs text-slate-500">
                              {[asset.make, asset.model].filter(Boolean).join(" ")}
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
                      <td className="table-td font-mono text-xs">{asset.serialNumber || "—"}</td>
                      <td className="table-td whitespace-nowrap text-xs text-slate-500">
                        {formatDate(asset.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="section-title">Premises</h2>
                <p className="muted mt-0.5">Sites in your register.</p>
              </div>
              <Link
                href="/premises"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Manage
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {premises.slice(0, 5).map((premisesItem) => {
                const count = assets.filter((asset) => asset.premisesId === premisesItem.id).length;
                return (
                  <Link
                    key={premisesItem.id}
                    href={`/assets?premises=${premisesItem.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {premisesItem.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {[premisesItem.addressLine1, premisesItem.postcode].filter(Boolean).join(", ") ||
                          "No address"}
                      </p>
                    </div>
                    <span className="badge-slate shrink-0">{count}</span>
                  </Link>
                );
              })}
              {premises.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-slate-500">No premises yet.</p>
                  <Link href="/premises" className="btn-secondary btn-sm mt-3">
                    Add premises
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="card bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 text-white">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-200">
              <QrCode className="h-4 w-4" />
              QR labels
            </div>
            <p className="mt-2 text-sm font-semibold">Print a sticky label in seconds</p>
            <p className="mt-1 text-xs leading-relaxed text-indigo-100">
              Each asset gets a unique QR code that opens a read-only record on any phone.
            </p>
            <Link
              href="/assets"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
            >
              Choose an asset <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
