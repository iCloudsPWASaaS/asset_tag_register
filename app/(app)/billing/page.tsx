import Link from "next/link";
import { CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import { getAccountContext } from "@/lib/account";
import { requireUser } from "@/lib/auth";
import { ALLOW_DEV_SUBSCRIPTION } from "@/lib/env";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Plan & billing",
};

export default async function BillingPage() {
  const user = await requireUser("/billing");
  const account = await getAccountContext(user.id);
  const access = account.access;

  const planName =
    access.planId === "business"
      ? "Business"
      : access.planId === "starter"
        ? "Starter"
        : access.planId === "dev"
          ? "Developer"
          : "Professional";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
          Subscription
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Plan & billing
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Manage access to your asset register. Stripe billing can be enabled later without changing
          your records.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5 sm:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current plan</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{planName}</p>
              <p className="mt-1 text-sm text-slate-500">
                {access.allowed ? (
                  <>
                    {access.reason === "trialing" || access.reason === "trial"
                      ? "Trial access"
                      : access.reason === "dev"
                        ? "Developer access"
                        : "Active subscription"}
                    {access.endsAt ? ` · renews ${formatDate(access.endsAt)}` : ""}
                  </>
                ) : (
                  "Access paused — activate a plan to continue."
                )}
              </p>
            </div>
            <span
              className={
                access.allowed
                  ? "badge-green"
                  : "badge-rose"
              }
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {access.allowed ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              "Unlimited asset records",
              "QR label printing",
              "Photo storage",
              "CSV + PDF register export",
              "Photo OCR label reading",
              "Optional AI manufacturer guidance",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <span className="inline-flex rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
            <CreditCard className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-900">
            {ALLOW_DEV_SUBSCRIPTION ? "Developer mode" : "Activate a plan"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {ALLOW_DEV_SUBSCRIPTION
              ? "ALLOW_DEV_SUBSCRIPTION is on, so access is not blocked while you build and test."
              : "Online card payments are not connected yet. Ask your administrator to activate the plan, or configure Stripe keys in the environment."}
          </p>
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-700">Need help?</p>
            <p className="mt-1">Contact the account administrator to extend or activate access.</p>
          </div>
        </div>
      </div>

      {!access.allowed && (
        <div className="card border-rose-200 bg-rose-50/50 p-5">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-rose-100 p-2 text-rose-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-rose-900">Your trial has ended</p>
              <p className="mt-1 text-sm text-rose-700">
                Your records are safe. Activate a plan to reopen the dashboard, asset capture and
                register exports.
              </p>
              <Link href="/settings" className="btn-secondary btn-sm mt-3">
                Account settings
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
