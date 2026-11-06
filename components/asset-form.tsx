"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  QrCode,
  Save,
  ScanLine,
  Sparkles,
  Wand2,
} from "lucide-react";
import { PhotoCapture } from "@/components/photo-capture";
import { PremisesPicker } from "@/components/premises-picker";
import type { Asset, ExtractedFields, Premises } from "@/lib/types";
import { assetTypeSuggestions, authPhotoUrl } from "@/lib/utils";

type FormState = {
  location: string;
  type: string;
  make: string;
  model: string;
  serialNumber: string;
  notes: string;
  engineer: string;
  installedAt: string;
};

function dateInput(value: string | undefined) {
  if (!value) return "";
  return value.slice(0, 10);
}

function fallbackPremises(asset: Asset): Premises {
  const [line1 = "", line2 = "", line3 = "", postcode = ""] = (asset.premisesAddress || "")
    .split(",")
    .map((part) => part.trim());
  return {
    id: asset.premisesId,
    name: asset.premisesName,
    addressLine1: line1,
    addressLine2: line2,
    addressLine3: line3,
    postcode,
    notes: "",
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
}

function premisesAddress(premises: Premises | null) {
  if (!premises) return "";
  return [
    premises.addressLine1,
    premises.addressLine2,
    premises.addressLine3,
    premises.postcode,
  ]
    .filter(Boolean)
    .join(", ");
}

async function imageToBase64(blob: Blob) {
  try {
    const bitmap = await createImageBitmap(blob);
    const max = 1400;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    return { base64: dataUrl.split(",")[1] || "", mime: "image/jpeg" };
  } catch {
    return null;
  }
}

export function AssetForm({
  mode,
  asset,
  premises,
  defaultEngineer,
  aiEnabled,
}: {
  mode: "create" | "edit";
  asset?: Asset;
  premises: Premises[];
  defaultEngineer: string;
  aiEnabled: boolean;
}) {
  const router = useRouter();
  const [premisesList, setPremisesList] = useState<Premises[]>(premises);
  const [selectedPremises, setSelectedPremises] = useState<Premises | null>(() => {
    if (!asset) return null;
    return premises.find((item) => item.id === asset.premisesId) || fallbackPremises(asset);
  });

  const [form, setForm] = useState<FormState>({
    location: asset?.location || "",
    type: asset?.type || "",
    make: asset?.make || "",
    model: asset?.model || "",
    serialNumber: asset?.serialNumber || "",
    notes: asset?.notes || "",
    engineer: asset?.engineer || defaultEngineer,
    installedAt: dateInput(asset?.installedAt),
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPath, setPhotoPath] = useState(asset?.photoPath || "");
  const [photoContentType, setPhotoContentType] = useState(asset?.photoContentType || "");
  const [previewUrl, setPreviewUrl] = useState(
    asset?.photoPath ? authPhotoUrl(asset.photoPath) : "",
  );
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrText, setOcrText] = useState("");
  const [scanNotice, setScanNotice] = useState("");
  const [scanError, setScanError] = useState("");
  const [aiExtracted, setAiExtracted] = useState(Boolean(asset?.aiExtracted));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const previewRef = useRef("");

  function update(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleFile(file: File) {
    if (previewRef.current.startsWith("blob:")) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setPhotoFile(file);
    setPreviewUrl(url);
    setOcrText("");
    setScanNotice("");
    setScanError("");
    void uploadPhoto(file);
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body });
      const payload = (await response.json().catch(() => ({}))) as {
        path?: string;
        contentType?: string;
        error?: string;
      };
      if (!response.ok || !payload.path) {
        throw new Error(payload.error || "Could not upload the photo.");
      }
      setPhotoPath(payload.path);
      setPhotoContentType(payload.contentType || file.type || "image/jpeg");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not upload the photo.");
    } finally {
      setUploading(false);
    }
  }

  function clearPhoto() {
    if (previewRef.current.startsWith("blob:")) URL.revokeObjectURL(previewRef.current);
    previewRef.current = "";
    setPhotoFile(null);
    setPhotoPath("");
    setPhotoContentType("");
    setPreviewUrl("");
    setOcrText("");
    setScanNotice("");
    setScanError("");
  }

  async function scanLabel() {
    setScanError("");
    setScanNotice("");
    setOcrProgress(0);

    let source: Blob | null = photoFile;
    if (!source && photoPath) {
      try {
        const response = await fetch(authPhotoUrl(photoPath));
        if (response.ok) source = await response.blob();
      } catch {
        source = null;
      }
    }
    if (!source) {
      setScanError("Add a photo first, then scan the label.");
      return;
    }

    setScanning(true);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (message) => {
          if (message.status === "recognizing text") {
            setOcrProgress(Math.round((message.progress || 0) * 100));
          }
        },
      });

      let text = "";
      try {
        const result = await worker.recognize(source);
        text = result.data.text || "";
      } finally {
        await worker.terminate();
      }

      setOcrText(text);
      const image = aiEnabled ? await imageToBase64(source) : null;
      const response = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          imageBase64: image?.base64,
          imageMime: image?.mime,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        fields?: ExtractedFields;
        source?: "ai" | "heuristic";
        provider?: string;
        notice?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Could not read the label.");

      const fields = payload.fields || {};
      setForm((current) => ({
        ...current,
        location: current.location || fields.location || "",
        type: current.type || fields.type || "",
        make: current.make || fields.make || "",
        model: current.model || fields.model || "",
        serialNumber: current.serialNumber || fields.serialNumber || "",
      }));
      setAiExtracted(payload.source === "ai");
      setScanNotice(
        payload.notice ||
          (payload.source === "ai"
            ? `Label read with ${payload.provider || "AI"}. Check every field before saving.`
            : "Label read on this device. Check every field before saving."),
      );
    } catch (caught) {
      setScanError(
        caught instanceof Error
          ? caught.message
          : "Could not scan the label. You can still type the details manually.",
      );
    } finally {
      setScanning(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!selectedPremises) {
      setError("Choose or add a premises before saving.");
      return;
    }
    if (!form.location.trim()) {
      setError("Add a location within the premises.");
      return;
    }
    if (!form.type.trim()) {
      setError("Add an asset type.");
      return;
    }
    if (!form.make.trim()) {
      setError("Add the manufacturer.");
      return;
    }
    if (uploading) {
      setError("Wait for the photo to finish uploading.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        premisesId: selectedPremises.id,
        premisesName: selectedPremises.name,
        premisesAddress: premisesAddress(selectedPremises),
        location: form.location,
        type: form.type,
        make: form.make,
        model: form.model,
        serialNumber: form.serialNumber,
        notes: form.notes,
        engineer: form.engineer,
        installedAt: form.installedAt,
        photoPath,
        photoContentType,
        aiExtracted,
      };

      const response = await fetch(
        mode === "edit" && asset ? `/api/assets/${asset.id}` : "/api/assets",
        {
          method: mode === "edit" && asset ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json().catch(() => ({}))) as {
        asset?: Asset;
        error?: string;
      };
      if (!response.ok || !result.asset) {
        throw new Error(result.error || "Could not save the asset.");
      }

      router.push(
        `/assets/${result.asset.id}?${mode === "edit" ? "updated" : "created"}=1`,
      );
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the asset.");
    } finally {
      setSaving(false);
    }
  }

  const types = assetTypeSuggestions();

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Link
            href={asset ? `/assets/${asset.id}` : "/assets"}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {asset ? "Back to asset" : "Back to assets"}
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {mode === "edit" ? "Edit asset" : "Capture a new asset"}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {mode === "edit"
              ? "Update the details, photo or location for this tagged item."
              : "Photograph the label, check the details and save to generate the QR sticker."}
          </p>
        </div>
        {asset && (
          <div className="flex items-center gap-2">
            <span className="badge-indigo font-mono">{asset.tag}</span>
            <Link href={`/assets/${asset.id}/label`} className="btn-secondary btn-sm">
              <QrCode className="h-3.5 w-3.5" />
              Label
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <section className="card p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="section-title">Asset photo</h2>
                <p className="muted mt-0.5">The label photo is used for the record and OCR.</p>
              </div>
              {photoPath && (
                <span className="badge-green">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Stored
                </span>
              )}
            </div>
            <PhotoCapture
              previewUrl={previewUrl}
              uploading={uploading}
              onFile={handleFile}
              onClear={clearPhoto}
            />
          </section>

          <section className="card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="section-title">Read the label</h2>
                <p className="muted mt-0.5">
                  On-device OCR finds the make, model and serial number.
                </p>
              </div>
              <span className={aiEnabled ? "badge-indigo" : "badge-slate"}>
                <Sparkles className="h-3.5 w-3.5" />
                {aiEnabled ? "AI assisted" : "On-device"}
              </span>
            </div>

            <button
              type="button"
              onClick={scanLabel}
              disabled={scanning || uploading || (!photoFile && !photoPath)}
              className="btn-secondary mt-4 w-full"
            >
              {scanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ScanLine className="h-4 w-4" />
              )}
              {scanning ? "Reading the label…" : "Scan label photo"}
            </button>

            {scanning && (
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${Math.max(6, ocrProgress)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  {ocrProgress > 0 ? `Reading text… ${ocrProgress}%` : "Preparing the label reader…"}
                </p>
              </div>
            )}

            {scanNotice && (
              <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                {scanNotice}
              </div>
            )}
            {scanError && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {scanError}
              </div>
            )}

            {ocrText && (
              <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-slate-600">
                  View OCR text ({ocrText.trim().split(/\s+/).length} words)
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-slate-500">
                  {ocrText}
                </pre>
              </details>
            )}
          </section>

          <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 text-xs leading-relaxed text-slate-500">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <Wand2 className="h-4 w-4 text-indigo-500" />
              Faster capture
            </div>
            <p className="mt-1.5">
              Fill in the premises and location, then use “Scan label photo”. The reader fills any
              empty make, model, type, location and serial fields. Always check the values before
              saving.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <section className="card p-4 sm:p-5">
            <h2 className="section-title">Where is it?</h2>
            <p className="muted mt-0.5 mb-4">Choose an existing premises or add a new one.</p>
            <PremisesPicker
              premises={premisesList}
              selected={selectedPremises}
              onSelect={setSelectedPremises}
              onCreated={(created) => {
                setPremisesList((current) => {
                  if (current.some((item) => item.id === created.id)) return current;
                  return [...current, created].sort((a, b) => a.name.localeCompare(b.name));
                });
              }}
            />

            <div className="mt-4">
              <label className="label" htmlFor="location">
                Location within premises
              </label>
              <input
                id="location"
                className="input"
                value={form.location}
                onChange={(event) => update("location", event.target.value)}
                placeholder="Entrance, first-floor kitchen, rear store…"
                required
              />
            </div>
          </section>

          <section className="card p-4 sm:p-5">
            <h2 className="section-title">Asset details</h2>
            <p className="muted mt-0.5 mb-4">The information printed on the label and register.</p>

            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="type">
                  Asset type
                </label>
                <input
                  id="type"
                  className="input"
                  value={form.type}
                  onChange={(event) => update("type", event.target.value)}
                  placeholder="Fire safety sign"
                  list="asset-types"
                  required
                />
                <datalist id="asset-types">
                  {types.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="make">
                    Make
                  </label>
                  <input
                    id="make"
                    className="input"
                    value={form.make}
                    onChange={(event) => update("make", event.target.value)}
                    placeholder="Alpha"
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="model">
                    Model
                  </label>
                  <input
                    id="model"
                    className="input"
                    value={form.model}
                    onChange={(event) => update("model", event.target.value)}
                    placeholder="Twin LED, 24V battery"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="serialNumber">
                  Serial number
                </label>
                <input
                  id="serialNumber"
                  className="input font-mono"
                  value={form.serialNumber}
                  onChange={(event) => update("serialNumber", event.target.value)}
                  placeholder="ABC1234"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="engineer">
                    Engineer / recorded by
                  </label>
                  <input
                    id="engineer"
                    className="input"
                    value={form.engineer}
                    onChange={(event) => update("engineer", event.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="installedAt">
                    Installed / recorded date
                  </label>
                  <input
                    id="installedAt"
                    type="date"
                    className="input"
                    value={form.installedAt}
                    onChange={(event) => update("installedAt", event.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="notes">
                  Notes
                </label>
                <textarea
                  id="notes"
                  className="input min-h-24 resize-y"
                  value={form.notes}
                  onChange={(event) => update("notes", event.target.value)}
                  placeholder="Access notes, condition, test results, replacement due date…"
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link href={asset ? `/assets/${asset.id}` : "/assets"} className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={saving || uploading}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {mode === "edit" ? "Save changes" : "Save & generate QR"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
