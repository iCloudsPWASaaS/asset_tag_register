import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_EMAILS,
  ADMIN_PASSWORD,
  ADMIN_SESSION_SECRET,
} from "@/lib/env";

const COOKIE_NAME = "at_admin";
const MAX_AGE_SECONDS = 60 * 60 * 8;

type AdminPayload = {
  email: string;
  exp: number;
};

function base64url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(value: string) {
  return crypto
    .createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(value)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function isValidAdminCredentials(email: string, password: string) {
  const normalisedEmail = email.trim().toLowerCase();
  const emailOk = ADMIN_EMAILS.includes(normalisedEmail);
  const passwordOk = Boolean(ADMIN_PASSWORD) && safeEqual(password, ADMIN_PASSWORD);
  return emailOk && passwordOk;
}

export function createAdminToken(email: string) {
  const payload: AdminPayload = {
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const body = base64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function verifyAdminToken(token: string | undefined | null): AdminPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  if (!safeEqual(signature, expected)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    ) as AdminPayload;
    if (!payload.email || !payload.exp) return null;
    if (payload.exp * 1000 < Date.now()) return null;
    if (!ADMIN_EMAILS.includes(payload.email)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const store = await cookies();
  return verifyAdminToken(store.get(COOKIE_NAME)?.value);
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
export const ADMIN_COOKIE_MAX_AGE = MAX_AGE_SECONDS;
