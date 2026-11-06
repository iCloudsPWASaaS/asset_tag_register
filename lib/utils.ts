import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function daysBetween(from: Date, to: Date) {
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / 86_400_000));
}

export function initials(name: string | null | undefined, email?: string | null) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function truncate(value: string, length = 60) {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1)}…`;
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function publicAssetPath(userId: string, assetId: string) {
  return `/a/${userId}/${assetId}`;
}

export function absoluteAssetUrl(userId: string, assetId: string) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${publicAssetPath(userId, assetId)}`;
}

export function assetTypeSuggestions() {
  return [
    "Fire safety sign",
    "Fire extinguisher",
    "Fire alarm call point",
    "Smoke detector",
    "Emergency light",
    "Fire door",
    "Gas appliance",
    "Electrical socket",
    "First aid kit",
    "Security camera",
    "Air conditioning unit",
    "Water heater",
    "Boiler",
    "Kitchen extractor",
    "Refrigeration unit",
    "Pat testing item",
  ];
}

export function photoUrlForAsset(userId: string, assetId: string) {
  return `/api/public/photo?userId=${encodeURIComponent(userId)}&assetId=${encodeURIComponent(assetId)}`;
}

export function authPhotoUrl(path: string) {
  return `/api/photo?path=${encodeURIComponent(path)}`;
}
