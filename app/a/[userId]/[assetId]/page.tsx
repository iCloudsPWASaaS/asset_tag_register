import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  Building2,
  ExternalLink,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Wrench,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { getPublicAsset } from "@/lib/storage";
import { formatDate, photoUrlForAsset } from "@/lib/utils";

export const metadata = {
  title: "Asset record",
};

export default async function PublicAssetPage({
  params,
}: {
  params: Promise<{ userId: string; assetId: string }>;
}) {
  const { userId, assetId } = await params;
  const record = await getPublicAsset(userId, assetId);
  if (!record) notFound();

  const { asset } = record;
  const photo = asset.photoPath ? photoUrlForAsset(userId, asset.id) : "";
  const statusClass =
    asset.status === "active"
      ? "badge-green"
      : asset.status === "archived"
        ? "badge-amber"
        : "badge-rose";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5">
          <Logo href="/" />
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Read-only record
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        {asset.status === "removed" && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            This asset has been marked as removed from the register. The historical record is shown
            for reference.
          </div>
        )}

        <div className="card overflow-hidden">
          {photo ? (
            <img src={photo} alt={`${asset.tag} photo`} className="aspect-[4/3] w-full bg-slate-100 object-contain" />
          ) : (
            <div className="flex aspect-[16/7] items-center justify-center bg-gradient-to-br from-indigo-50 to-sky-50 text-indigo-300">
              <Tag className="h-12 w-12" />
            </div>
          )}

          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-indigo font-mono text-sm">{asset.tag}</span>
              <span className={statusClass}>
                {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              {[asset.make, asset.model].filter(Boolean).join(" ") || asset.type || "Asset"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{asset.type || "No asset type recorded"}</p>

            <div className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Premises
                </p>
                <p className="mt-0.5 flex items-start gap-1.5 text-sm font-medium text-slate-800">
                  <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {asset.premisesName}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Location
                </p>
                <p className="mt-0.5 flex items-start gap-1.5 text-sm font-medium text-slate-800">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {asset.location || "Not recorded"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Address
                </p>
                <p className="mt-0.5 text-sm text-slate-700">{asset.premisesAddress || "Not recorded"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Serial number
                </p>
                <p className="mt-0.5 font-mono text-sm text-slate-700">
                  {asset.serialNumber || "Not recorded"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Recorded
                </p>
                <p className="mt-0.5 text-sm text-slate-700">{formatDate(asset.createdAt)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Engineer
                </p>
                <p className="mt-0.5 text-sm text-slate-700">{asset.engineer || "Not recorded"}</p>
              </div>
            </div>

            {asset.notes && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Notes
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {asset.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {asset.manual && (
          <div className="card mt-5 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-600" />
              <h2 className="section-title">Manufacturer guidance</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{asset.manual.summary}</p>

            {asset.manual.safety.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Safety
                </div>
                <ul className="mt-2 space-y-1.5">
                  {asset.manual.safety.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {asset.manual.maintenance.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Wrench className="h-3.5 w-3.5 text-sky-500" /> Maintenance
                </div>
                <ul className="mt-2 space-y-1.5">
                  {asset.manual.maintenance.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {asset.manual.sources.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" /> Manual links
                </div>
                <div className="mt-2 space-y-1.5">
                  {asset.manual.sources.map((source) => (
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
          </div>
        )}

        <footer className="mt-8 flex flex-col items-center gap-2 text-center">
          <p className="text-[11px] text-slate-400">
            Record ID {asset.id} · Last updated {formatDate(asset.updatedAt)}
          </p>
          <Link href="/login" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
            Open AssetTag Register
          </Link>
        </footer>
      </main>
    </div>
  );
}
