"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Check, Loader2, MapPin, Plus, Search, X } from "lucide-react";
import type { Premises } from "@/lib/types";

type Suggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

function addressOf(premises: Premises) {
  return [premises.addressLine1, premises.addressLine2, premises.addressLine3, premises.postcode]
    .filter(Boolean)
    .join(", ");
}

export function PremisesPicker({
  premises,
  selected,
  onSelect,
  onCreated,
}: {
  premises: Premises[];
  selected: Premises | null;
  onSelect: (premises: Premises | null) => void;
  onCreated: (premises: Premises) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [manualOpen, setManualOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [manual, setManual] = useState({
    name: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    postcode: "",
  });
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const matching = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return premises.slice(0, 6);
    return premises
      .filter((item) =>
        [item.name, item.addressLine1, item.addressLine2, item.postcode]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 6);
  }, [premises, query]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const needle = query.trim();
    if (needle.length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(needle)}`);
        if (!response.ok) return;
        const payload = (await response.json()) as { suggestions?: Suggestion[] };
        setSuggestions(payload.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    }, 280);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function chooseSuggestion(suggestion: Suggestion) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(suggestion.placeId)}`,
      );
      if (!response.ok) throw new Error("Could not load that address.");
      const payload = (await response.json()) as {
        place?: {
          placeId: string;
          name: string;
          addressLine1: string;
          addressLine2: string;
          addressLine3: string;
          postcode: string;
        };
      };
      if (!payload.place) throw new Error("Could not load that address.");

      const existing = premises.find((item) => item.placeId === payload.place?.placeId);
      if (existing) {
        onSelect(existing);
        setOpen(false);
        setQuery("");
        return;
      }

      const createResponse = await fetch("/api/premises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.place),
      });
      const created = (await createResponse.json().catch(() => ({}))) as {
        premises?: Premises;
        error?: string;
      };
      if (!createResponse.ok || !created.premises) {
        throw new Error(created.error || "Could not save the premises.");
      }
      onCreated(created.premises);
      onSelect(created.premises);
      setOpen(false);
      setQuery("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load that address.");
    } finally {
      setLoading(false);
    }
  }

  function chooseExisting(item: Premises) {
    onSelect(item);
    setOpen(false);
    setQuery("");
  }

  function openManual(name = query) {
    setManual({
      name: name || "",
      addressLine1: "",
      addressLine2: "",
      addressLine3: "",
      postcode: "",
    });
    setManualOpen(true);
    setOpen(false);
    setError("");
  }

  async function saveManual(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/premises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manual),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        premises?: Premises;
        error?: string;
      };
      if (!response.ok || !payload.premises) {
        throw new Error(payload.error || "Could not save the premises.");
      }
      onCreated(payload.premises);
      onSelect(payload.premises);
      setManualOpen(false);
      setQuery("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the premises.");
    } finally {
      setSaving(false);
    }
  }

  if (selected) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-lg bg-white p-2 text-indigo-600 shadow-sm">
              <Building2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{selected.name}</p>
              <p className="mt-0.5 text-xs text-slate-600">{addressOf(selected) || "No address"}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <Check className="h-3 w-3" /> Premises selected
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
            aria-label="Change premises"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-10"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search a premises or type a new one…"
        />
      </div>

      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="max-h-72 overflow-y-auto">
            {matching.length > 0 && (
              <div className="border-b border-slate-100 p-1.5">
                <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Your premises
                </p>
                {matching.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => chooseExisting(item)}
                    className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50"
                  >
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span>
                      <span className="block text-sm font-medium text-slate-900">{item.name}</span>
                      <span className="block text-xs text-slate-500">
                        {addressOf(item) || "No address"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="border-b border-slate-100 p-1.5">
                <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Google Places
                </p>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.placeId}
                    type="button"
                    onClick={() => chooseSuggestion(suggestion)}
                    disabled={loading}
                    className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50 disabled:opacity-60"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                    <span>
                      <span className="block text-sm font-medium text-slate-900">
                        {suggestion.mainText}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {suggestion.secondaryText}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="p-1.5">
              <button
                type="button"
                onClick={() => openManual(query)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
              >
                <Plus className="h-4 w-4" />
                {query.trim() ? `Add “${query.trim()}” manually` : "Add a premises manually"}
              </button>
            </div>
          </div>
        </div>
      )}

      {manualOpen && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">New premises</p>
            <button
              type="button"
              onClick={() => setManualOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={saveManual} className="space-y-3">
            <div>
              <label className="label" htmlFor="premisesName">
                Premises name
              </label>
              <input
                id="premisesName"
                className="input"
                value={manual.name}
                onChange={(event) => setManual({ ...manual, name: event.target.value })}
                placeholder="Subway UK, St Vincent Street"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="premisesAddress1">
                Address line 1
              </label>
              <input
                id="premisesAddress1"
                className="input"
                value={manual.addressLine1}
                onChange={(event) => setManual({ ...manual, addressLine1: event.target.value })}
                placeholder="123 St Vincent Street"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="premisesAddress2">
                  Town / city
                </label>
                <input
                  id="premisesAddress2"
                  className="input"
                  value={manual.addressLine2}
                  onChange={(event) => setManual({ ...manual, addressLine2: event.target.value })}
                  placeholder="Glasgow"
                />
              </div>
              <div>
                <label className="label" htmlFor="premisesPostcode">
                  Postcode
                </label>
                <input
                  id="premisesPostcode"
                  className="input"
                  value={manual.postcode}
                  onChange={(event) => setManual({ ...manual, postcode: event.target.value })}
                  placeholder="G2 5TF"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary btn-sm" disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Save premises
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
