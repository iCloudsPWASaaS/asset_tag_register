"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";

export function PhotoCapture({
  previewUrl,
  uploading,
  onFile,
  onClear,
}: {
  previewUrl: string;
  uploading: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function choose(file: File | null | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    onFile(file);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          choose(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {previewUrl ? (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          <img src={previewUrl} alt="Asset preview" className="aspect-[4/3] w-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-slate-700 shadow-lg">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                Uploading photo…
              </div>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-slate-950/70 to-transparent p-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Replace
            </button>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-white"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            choose(event.dataTransfer.files?.[0]);
          }}
          className={`flex aspect-[4/3] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition ${
            dragging
              ? "border-indigo-400 bg-indigo-50"
              : "border-slate-300 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/40"
          }`}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
            <Camera className="h-6 w-6" />
          </span>
          <span className="mt-3 text-sm font-semibold text-slate-900">Take or upload a photo</span>
          <span className="mt-1 max-w-[240px] text-xs text-slate-500">
            Use your camera on site, or drop an image of the asset or label here.
          </span>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
            <ImagePlus className="h-3.5 w-3.5" />
            JPG, PNG or HEIC up to 12 MB
          </span>
        </button>
      )}
    </div>
  );
}
