"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

export function DeleteAssetButton({ assetId, tag }: { assetId: string; tag: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (!window.confirm(`Delete ${tag}? The photo and record will be removed permanently.`)) {
      return;
    }
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/assets/${assetId}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not delete the asset.");
      router.push("/assets");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete the asset.");
      setDeleting(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={remove} className="btn-danger btn-sm" disabled={deleting}>
        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        Delete
      </button>
      {error && <p className="mt-1.5 max-w-xs text-[11px] text-rose-600">{error}</p>}
    </div>
  );
}
