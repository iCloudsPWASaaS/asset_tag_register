"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Check,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { AssetSummary, Premises } from "@/lib/types";

type Suggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

type FormState = {
  name: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  postcode: string;
  notes: string;
  placeId: string;
};

const emptyForm: FormState = {
  name: "",
  addressLine1: "",
  addressLine2: "",
  addressLine3: "",
  postcode: "",
  notes: "",
  placeId: "",
};

function addressOf(premises: Premises) {
  return [premises.addressLine1, premises.addressLine2, premises.addressLine3, premises.postcode]
    .filter(Boolean)
    .join(", ");
}

export function PremisesClient({
  premises,
  assets,
}: {
  premises: Premises[];
  assets: AssetSummary[];
}) {
  const [list, setList] = useState(premises);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    assets.forEach((asset) => map.set(asset.premisesId, (map.get(asset.premisesId) || 0) + 1));
    return map;
  }, [assets]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((item) =>
      [item.name, item.addressLine1, item.addressLine2, item.postcode]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [list, query]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const needle = placeQuery.trim();
    if (needle.length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(needle)}`);
        if (!response.ok) return;
        const payload = (await response.json()) as { suggestions?: Suggestion[] };
        setSuggestions(payload.suggestions || []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [placeQuery]);

  function startAdd() {
    setAddOpen(true);
    setManualOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setPlaceQuery("");
    setSuggestions([]);
    setError("");
    setNotice("");
  }

  function startManual(name = "") {
    setManualOpen(true);
    setEditingId(null);
    setForm({ ...emptyForm, name });
    setError("");
  }

  function startEdit(item: Premises) {
    setAddOpen(true);
    setManualOpen(true);
    setEditingId(item.id);
    setForm({
      name: item.name,
      addressLine1: item.addressLine1,
      addressLine2: item.addressLine2,
      addressLine3: item.addressLine3,
      postcode: item.postcode,
      notes: item.notes,
      placeId: item.placeId || "",
    });
    setPlaceQuery("");
    setSuggestions([]);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function update(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function choosePlace(suggestion: Suggestion) {
    setSearching(true);
    setError("");
    try {
      const response = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(suggestion.placeId)}`,
      );
      const payload = (await response.json().catch(() => ({}))) as {
        place?: {
          placeId: string;
          name: string;
          addressLine1: string;
          addressLine2: string;
          addressLine3: string;
          postcode: string;
        };
        error?: string;
      };
      if (!response.ok || !payload.place) throw new Error(payload.error || "Could not load that place.");
      setForm({
        name: payload.place.name,
        addressLine1: payload.place.addressLine1,
        addressLine2: payload.place.addressLine2,
        addressLine3: payload.place.addressLine3,
        postcode: payload.place.postcode,
        notes: "",
        placeId: payload.place.placeId,
      });
      setManualOpen(true);
      setSuggestions([]);
      setPlaceQuery("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load that place.");
    } finally {
      setSearching(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        editingId ? `/api/premises/${editingId}` : "/api/premises",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        premises?: Premises;
        error?: string;
      };
      if (!response.ok || !payload.premises) {
        throw new Error(payload.error || "Could not save the premises.");
      }

      if (editingId) {
        setList((current) =>
          current
            .map((item) => (item.id === editingId ? payload.premises! : item))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        setNotice("Premises updated.");
      } else {
        setList((current) =>
          [...current, payload.premises!].sort((a, b) => a.name.localeCompare(b.name)),
        );
        setNotice("Premises added.");
      }
      setForm(emptyForm);
      setEditingId(null);
      setManualOpen(false);
      setAddOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the premises.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: Premises) {
    if (!window.confirm(`Delete ${item.name}? Premises with assets cannot be deleted.`)) return;
    setDeletingId(item.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/premises/${item.id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not delete the premises.");
      setList((current) => current.filter((entry) => entry.id !== item.id));
      setNotice("Premises deleted.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete the premises.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Sites
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Premises
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Manage the sites and buildings that assets belong to.
          </p>
        </div>
        <button type="button" onClick={startAdd} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add premises
        </button>
      </div>

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      {addOpen && (
        <section className="card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="section-title">{editingId ? "Edit premises" : "Add premises"}</h2>
              <p className="muted mt-0.5">
                Search Google Places for the address, or enter it manually.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAddOpen(false);
                setManualOpen(false);
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!editingId && (
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-10"
                value={placeQuery}
                onChange={(event) => setPlaceQuery(event.target.value)}
                placeholder="Search Google Places, e.g. Subway St Vincent Street Glasgow"
              />
              {searching && (
                <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-indigo-500" />
              )}
              {suggestions.length > 0 && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.placeId}
                      type="button"
                      onClick={() => choosePlace(suggestion)}
                      className="flex w-full items-start gap-2.5 border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-slate-50"
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
              <button
                type="button"
                onClick={() => startManual(placeQuery)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Enter manually instead
              </button>
            </div>
          )}

          {manualOpen && (
            <form onSubmit={save} className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="premises-name">
                  Premises name
                </label>
                <input
                  id="premises-name"
                  className="input"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="Subway UK, St Vincent Street"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="premises-line1">
                    Address line 1
                  </label>
                  <input
                    id="premises-line1"
                    className="input"
                    value={form.addressLine1}
                    onChange={(event) => update("addressLine1", event.target.value)}
                    placeholder="123 St Vincent Street"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="premises-line2">
                    Town / city
                  </label>
                  <input
                    id="premises-line2"
                    className="input"
                    value={form.addressLine2}
                    onChange={(event) => update("addressLine2", event.target.value)}
                    placeholder="Glasgow"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="premises-line3">
                    County / region
                  </label>
                  <input
                    id="premises-line3"
                    className="input"
                    value={form.addressLine3}
                    onChange={(event) => update("addressLine3", event.target.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="premises-postcode">
                    Postcode
                  </label>
                  <input
                    id="premises-postcode"
                    className="input"
                    value={form.postcode}
                    onChange={(event) => update("postcode", event.target.value)}
                    placeholder="G2 5TF"
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="premises-notes">
                  Access notes
                </label>
                <textarea
                  id="premises-notes"
                  className="input min-h-20 resize-y"
                  value={form.notes}
                  onChange={(event) => update("notes", event.target.value)}
                  placeholder="Key safe code, site contact, access restrictions…"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {editingId ? "Save changes" : "Add premises"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setManualOpen(false);
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      <div className="card p-3 sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search premises…"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card px-5 py-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Building2 className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-sm font-semibold text-slate-900">
            {list.length === 0 ? "No premises yet" : "No matching premises"}
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            {list.length === 0
              ? "Add the first site so you can start tagging assets against it."
              : "Try a different search term."}
          </p>
          {list.length === 0 && (
            <button type="button" onClick={startAdd} className="btn-primary mt-4">
              <Plus className="h-4 w-4" />
              Add premises
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const count = counts.get(item.id) || 0;
            return (
              <div key={item.id} className="card card-hover flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <span className="badge-slate">
                    {count} asset{count === 1 ? "" : "s"}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-900">{item.name}</h3>
                <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {addressOf(item) || "No address"}
                </p>
                {item.notes && (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-500">{item.notes}</p>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <a
                    href={`/assets?premises=${item.id}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    View assets
                  </a>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="btn-ghost btn-sm"
                      title="Edit premises"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      disabled={deletingId === item.id}
                      className="btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
                      title="Delete premises"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
