import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Subscription } from "@/lib/types";

const DAY = 86_400_000;

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as {
      userId?: string;
      action?: "extend" | "activate" | "cancel";
    };
    const userId = body.userId || "";
    const action = body.action;
    if (!userId || !action || !["extend", "activate", "cancel"].includes(action)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: existing, error: lookupError } = await admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);

    const now = new Date();
    const subscription = existing as Subscription | null;
    const nowIso = now.toISOString();

    const patch: Record<string, unknown> = {
      plan_id: "pro",
      billing_interval: "monthly",
      updated_at: nowIso,
    };

    if (action === "extend") {
      const currentEnd = subscription?.trial_end ? new Date(subscription.trial_end) : now;
      const base = currentEnd.getTime() > now.getTime() ? currentEnd : now;
      const end = new Date(base.getTime() + 30 * DAY);
      patch.status = "trialing";
      patch.trial_start = subscription?.trial_start || nowIso;
      patch.trial_end = end.toISOString();
      patch.current_period_start = nowIso;
      patch.current_period_end = end.toISOString();
      patch.cancel_at_period_end = false;
    } else if (action === "activate") {
      const end = new Date(now.getTime() + 30 * DAY);
      patch.status = "active";
      patch.trial_start = subscription?.trial_start || nowIso;
      patch.trial_end = subscription?.trial_end || nowIso;
      patch.current_period_start = nowIso;
      patch.current_period_end = end.toISOString();
      patch.cancel_at_period_end = false;
    } else {
      patch.status = "canceled";
      patch.cancel_at_period_end = true;
      patch.current_period_end =
        subscription?.current_period_end || subscription?.trial_end || nowIso;
    }

    if (subscription) {
      const { error } = await admin
        .from("subscriptions")
        .update(patch)
        .eq("id", subscription.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await admin.from("subscriptions").insert({
        user_id: userId,
        status: action === "cancel" ? "canceled" : action === "activate" ? "active" : "trialing",
        trial_start: nowIso,
        trial_end:
          action === "activate"
            ? nowIso
            : new Date(now.getTime() + 30 * DAY).toISOString(),
        current_period_start: nowIso,
        current_period_end:
          action === "cancel"
            ? nowIso
            : new Date(now.getTime() + 30 * DAY).toISOString(),
        cancel_at_period_end: action === "cancel",
        plan_id: "pro",
        billing_interval: "monthly",
      });
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin subscription", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update the subscription." },
      { status: 500 },
    );
  }
}
