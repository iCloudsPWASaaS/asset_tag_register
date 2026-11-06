import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ALLOW_DEV_SUBSCRIPTION, TRIAL_DAYS } from "@/lib/env";
import type {
  AccessState,
  AccountContext,
  Profile,
  Subscription,
} from "@/lib/types";
import { daysBetween } from "@/lib/utils";

function computeAccess(
  profile: Profile | null,
  subscription: Subscription | null,
): AccessState {
  if (ALLOW_DEV_SUBSCRIPTION) {
    return {
      allowed: true,
      reason: "dev",
      planId: subscription?.plan_id || "dev",
      status: subscription?.status || "dev",
      endsAt: subscription?.current_period_end || subscription?.trial_end || null,
      daysLeft: 999,
    };
  }

  const now = new Date();
  const status = (subscription?.status || "").toLowerCase();
  const planId = subscription?.plan_id || "pro";

  if (subscription) {
    const endsAt =
      status === "trialing"
        ? subscription.trial_end
        : subscription.current_period_end || subscription.trial_end;
    const endDate = endsAt ? new Date(endsAt) : null;

    if (status === "active" || status === "trialing") {
      if (!endDate || endDate.getTime() > now.getTime()) {
        return {
          allowed: true,
          reason: status === "trialing" ? "trialing" : "active",
          planId,
          status,
          endsAt,
          daysLeft: endDate ? daysBetween(now, endDate) : 999,
        };
      }
      return {
        allowed: false,
        reason: "expired",
        planId,
        status,
        endsAt,
        daysLeft: 0,
      };
    }

    if (status === "canceled" && endDate && endDate.getTime() > now.getTime()) {
      return {
        allowed: true,
        reason: "active",
        planId,
        status,
        endsAt,
        daysLeft: daysBetween(now, endDate),
      };
    }
  }

  if (profile?.created_at) {
    const created = new Date(profile.created_at);
    const trialEnd = new Date(created.getTime() + TRIAL_DAYS * 86_400_000);
    if (trialEnd.getTime() > now.getTime()) {
      return {
        allowed: true,
        reason: "trial",
        planId,
        status: "trial",
        endsAt: trialEnd.toISOString(),
        daysLeft: daysBetween(now, trialEnd),
      };
    }
    return {
      allowed: false,
      reason: "expired",
      planId,
      status: "trial",
      endsAt: trialEnd.toISOString(),
      daysLeft: 0,
    };
  }

  return {
    allowed: false,
    reason: "none",
    planId,
    status: "none",
    endsAt: null,
    daysLeft: 0,
  };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("profiles")
    .select(
      "id, email, full_name, company_name, phone, avatar_url, gas_safe_id, role, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("getProfile", error.message);
    return null;
  }
  return (data as Profile | null) ?? null;
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getSubscription", error.message);
    return null;
  }
  return (data as Subscription | null) ?? null;
}

export async function getAccountContext(userId: string): Promise<AccountContext> {
  const [profile, subscription] = await Promise.all([
    getProfile(userId),
    getSubscription(userId),
  ]);

  return {
    profile,
    subscription,
    access: computeAccess(profile, subscription),
  };
}

export async function ensureProfile(input: {
  id: string;
  email: string;
  fullName?: string;
  companyName?: string;
  phone?: string;
}) {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", input.id)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("profiles")
      .update({
        email: input.email,
        ...(input.fullName ? { full_name: input.fullName } : {}),
        ...(input.companyName ? { company_name: input.companyName } : {}),
        ...(input.phone ? { phone: input.phone } : {}),
        updated_at: now,
      })
      .eq("id", input.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await admin.from("profiles").insert({
    id: input.id,
    email: input.email,
    full_name: input.fullName || null,
    company_name: input.companyName || null,
    phone: input.phone || null,
    role: "owner",
    created_at: now,
    updated_at: now,
  });
  if (error) throw new Error(error.message);
}

export async function ensureTrialSubscription(userId: string) {
  const admin = getSupabaseAdmin();
  const existing = await getSubscription(userId);
  if (existing) return existing;

  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 86_400_000);
  const { data, error } = await admin
    .from("subscriptions")
    .insert({
      user_id: userId,
      plan_id: "pro",
      status: "trialing",
      billing_interval: "monthly",
      trial_start: now.toISOString(),
      trial_end: trialEnd.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: trialEnd.toISOString(),
      cancel_at_period_end: false,
    })
    .select("*")
    .single();

  if (error) {
    console.error("ensureTrialSubscription", error.message);
    return null;
  }
  return data as Subscription;
}

export async function ensureSettings(input: {
  userId: string;
  companyName?: string;
  email?: string;
  phone?: string;
}) {
  const admin = getSupabaseAdmin();
  const { data: existing } = await admin
    .from("settings")
    .select("user_id")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existing) return;

  const { error } = await admin.from("settings").insert({
    user_id: input.userId,
    company_name: input.companyName || null,
    email: input.email || null,
    phone: input.phone || null,
    currency: "GBP",
    vat_rate: 0,
    auto_sync: true,
  });
  if (error) console.error("ensureSettings", error.message);
}
