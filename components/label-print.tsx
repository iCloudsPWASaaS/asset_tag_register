"use client";

import Link from "next/link";
import { ArrowLeft, Download, Printer } from "lucide-react";
import type { Asset } from "@/lib/types";

export function LabelPrint({
  asset,
  publicUrl,
}: {
  asset: Asset;
  publicUrl: string;
}) {
  return (
    <div className="print-label-page flex min-h-screen flex-col items-center bg-slate-100 px-4 py-8">
      <div className="no-print mb-6 flex w-full max-w-2xl items-center justify-between gap-3">
        <Link
          href={`/assets/${asset.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to asset
        </Link>
        <div className="flex items-center gap-2">
          <a href={`/api/assets/${asset.id}/qr`} download={`${asset.tag}.png`} className="btn-secondary btn-sm">
            <Download className="h-3.5 w-3.5" />
            QR image
          </a>
          <button type="button" onClick={() => window.print()} className="btn-primary btn-sm">
            <Printer className="h-3.5 w-3.5" />
            Print label
          </button>
        </div>
      </div>

      <div className="no-print mb-4 max-w-md text-center text-xs text-slate-500">
        Print at 100% scale on a 70 × 40 mm sticky label. Turn off headers and footers in the print
        dialog for the cleanest result.
      </div>

      <div className="print-label label-sheet flex overflow-hidden rounded-md border border-slate-300 bg-white p-2.5 shadow-lg">
        <div className="flex w-[26mm] shrink-0 items-center justify-center">
          <img
            src={`/api/assets/${asset.id}/qr`}
            alt={`QR code for ${asset.tag}`}
            className="h-[24mm] w-[24mm]"
          />
        </div>
        <div className="ml-2 flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[6px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                AssetTag
              </span>
              <span className="text-[7px] font-mono font-bold text-slate-900">{asset.tag}</span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[8.5px] font-bold leading-tight text-slate-900">
              {asset.premisesName}
            </p>
            <p className="line-clamp-1 text-[7.5px] text-slate-600">{asset.location}</p>
          </div>
          <div className="space-y-0.5">
            <p className="line-clamp-1 text-[7px] text-slate-700">
              <span className="font-semibold">Type:</span> {asset.type || "—"}
            </p>
            <p className="line-clamp-1 text-[7px] text-slate-700">
              <span className="font-semibold">Make:</span> {asset.make || "—"}{" "}
              {asset.model ? `· ${asset.model}` : ""}
            </p>
            <p className="line-clamp-1 text-[7px] text-slate-700">
              <span className="font-semibold">Serial:</span>{" "}
              <span className="font-mono">{asset.serialNumber || "—"}</span>
            </p>
          </div>
          <p className="text-[5.5px] leading-tight text-slate-400">Scan for the full asset record</p>
        </div>
      </div>

      <p className="no-print mt-4 max-w-md break-all text-center text-[10px] text-slate-400">
        {publicUrl}
      </p>
    </div>
  );
}
