export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
export const SUPABASE_SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || "public";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "asset-register";

export const TRIAL_DAYS = Number(process.env.TRIAL_DAYS || "30");
export const AUTH_AUTO_CONFIRM = process.env.AUTH_AUTO_CONFIRM === "true";
export const ALLOW_DEV_SUBSCRIPTION = process.env.ALLOW_DEV_SUBSCRIPTION === "true";

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
export const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "dev-admin-secret-change-me";

export const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "";

export const AI_CONFIG = {
  openaiKey: process.env.OPENAI_API_KEY || "",
  openaiBaseUrl: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  openrouterKey: process.env.OPENROUTER_API_KEY || "",
  geminiKey: process.env.GEMINI_API_KEY || "",
};

export function isAiConfigured() {
  return Boolean(AI_CONFIG.openaiKey || AI_CONFIG.openrouterKey || AI_CONFIG.geminiKey);
}
