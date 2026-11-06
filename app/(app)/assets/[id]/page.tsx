import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  MapPin,
  Pencil,
  Printer,
  QrCode,
  Tag,
  UserRound,
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { DeleteAssetButton } from "@/components/delete-asset-button";
import { ManualPanel } from "@/components/manual-panel";
import { requireAccount } from "@/lib/auth";
import { isAiConfigured } from "@/lib/env";
import { getAsset } from "@/lib/storage";
import { absoluteAssetUrl, authPhotoUrl, formatDate, formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Asset",
};

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`mt-0.5 text-sm text-slate-800 ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </dd>
    </div>
  );
}

export default async function AssetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { user } = await requireAccount(`/assets/${id}`);
  const asset = await getAsset(user.id, id);
  if (!asset) notFound();

  const publicUrl = absoluteAssetUrl(asset.userId, asset.id);
  const statusClass =
    asset.status === "active"
      ? "badge-green"
      : asset.status === "archived"
        ? "badge-amber"
        : "badge-rose";

  return (
    <div className="space-y-5">
      {query.created && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Asset saved and QR code generated. Print the label below to tag the item.
        </div>
      )}
      {query.updated && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Asset details updated.
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Link
            href="/assets"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to assets
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="badge-indigo font-mono text-sm">{asset.tag}</span>
            <span className={statusClass}>
              {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
            </span>
            {asset.aiExtracted && (
              <span className="badge-slate">AI / OCR assisted</span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {[asset.make, asset.model].filter(Boolean).join(" ") || asset.type || "Asset"}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {asset.premisesName} · {asset.location || "No location"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              {asset.type || "No type"}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <Link href={`/assets/${asset.id}/edit`} className="btn-secondary btn-sm">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>
          <Link href={`/assets/${asset.id}/label`} className="btn-primary btn-sm">
            <Printer className="h-3.5 w-3.5" />
            Print label
          </Link>
          <DeleteAssetButton assetId={asset.id} tag={asset.tag} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <section className="card overflow-hidden">
            {asset.photoPath ? (
              <a href={authPhotoUrl(asset.photoPath)} target="_blank" rel="noreferrer">
                <img
                  src={authPhotoUrl(asset.photoPath)}
                  alt={`${asset.tag} photo`}
                  className="aspect-[4/3] w-full bg-slate-100 object-contain"
                />
              </a>
            ) : (
              <div className="flex aspect-[4/3] flex-col items-center justify-center bg-slate-50 text-slate-400">
                <Tag className="h-8 w-8" />
                <p className="mt-2 text-xs font-medium">No photo for this asset</p>
                <Link href={`/assets/${asset.id}/edit`} className="btn-secondary btn-sm mt-3">
                  Add a photo
                </Link>
              </div>
            )}
          </section>

          <section className="card p-5">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-indigo-600" />
              <h2 className="section-title">QR sticker</h2>
            </div>
            <p className="muted mt-0.5">
              Scan this code to open a read-only asset record on any phone.
            </p>
            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <img
                  src={`/api/assets/${asset.id}/qr`}
                  alt={`QR code for ${asset.tag}`}
                  className="h-36 w-36"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500">Public record URL</p>
                <p className="mt-1 break-all rounded-lg bg-slate-50 px-2.5 py-2 font-mono text-[11px] text-slate-600">
                  {publicUrl}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <CopyButton value={publicUrl} label="Copy link" />
                  <a
                    href={`/api/assets/${asset.id}/qr`}
                    download={`${asset.tag}.png`}
                    className="btn-secondary btn-sm"
                  >
                    <Download className="h-3.5 w-3.5" />
                    QR image
                  </a>
                  <Link href={`/assets/${asset.id}/label`} className="btn-primary btn-sm">
                    <Printer className="h-3.5 w-3.5" />
                    Print
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="section-title">Asset details</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Detail label="Premises" value={asset.premisesName} />
              <Detail label="Location" value={asset.location} />
              <Detail label="Premises address" value={asset.premisesAddress} />
              <Detail label="Asset type" value={asset.type} />
              <Detail label="Make" value={asset.make} />
              <Detail label="Model" value={asset.model} />
              <Detail label="Serial number" value={asset.serialNumber} mono />
              <Detail label="Status" value={asset.status} />
              <Detail label="Engineer" value={asset.engineer} />
              <Detail label="Installed / recorded" value={asset.installedAt ? formatDate(asset.installedAt) : ""} />
              <Detail label="Created" value={formatDateTime(asset.createdAt)} />
              <Detail label="Updated" value={formatDateTime(asset.updatedAt)} />
            </dl>
            {asset.notes && (
              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Notes
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {asset.notes}
                </p>
              </div>
            )}
          </section>

          <ManualPanel asset={asset} aiEnabled={isAiConfigured()} />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="card flex items-center gap-3 p-4">
              <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <CalendarDays className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Recorded
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatDate(asset.createdAt)}
                </p>
              </div>
            </div>
            <div className="card flex items-center gap-3 p-4">
              <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <UserRound className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Recorded by
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {asset.engineer || "Not recorded"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
