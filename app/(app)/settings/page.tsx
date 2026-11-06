import Link from "next/link";
import {
  CheckCircle2,
  Cloud,
  Database,
  FileSpreadsheet,
  MapPin,
  Sparkles,
  XCircle,
} from "lucide-react";
import { SettingsForm } from "@/components/settings-form";
import { getAccountContext } from "@/lib/account";
import { requireUser } from "@/lib/auth";
import {
  ALLOW_DEV_SUBSCRIPTION,
  GOOGLE_PLACES_API_KEY,
  isAiConfigured,
  STORAGE_BUCKET,
  SUPABASE_SCHEMA,
} from "@/lib/env";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Settings",
};

function StatusRow({
  ok,
  label,
  detail,
  icon: Icon,
}: {
  ok: boolean;
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-slate-100 p-2 text-slate-600">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{detail}</p>
        </div>
      </div>
      <span className={ok ? "badge-green" : "badge-slate"}>
        {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
        {ok ? "Ready" : "Optional"}
      </span>
    </div>
  );
}

export default async function SettingsPage() {
  const user = await requireUser("/settings");
  const account = await getAccountContext(user.id);
  const profile = account.profile;
  const aiReady = isAiConfigured();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Account</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Settings</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Your profile, integrations and data export options.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="card p-5 sm:p-6">
          <h2 className="section-title">Profile</h2>
          <p className="muted mt-0.5 mb-5">
            These details appear on your register exports and labels.
          </p>
          <SettingsForm
            email={user.email || ""}
            initial={{
              fullName: profile?.full_name || String(user.user_metadata?.full_name || ""),
              companyName: profile?.company_name || String(user.user_metadata?.company_name || ""),
              phone: profile?.phone || String(user.user_metadata?.phone || ""),
            }}
          />
        </section>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="section-title">Plan</h2>
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {account.access.planId === "dev" ? "Developer access" : account.access.planId}
                  </p>
                  <p className="text-xs text-slate-500">
                    {account.access.endsAt
                      ? `Access until ${formatDate(account.access.endsAt)}`
                      : "No expiry date"}
                  </p>
                </div>
                <span className={account.access.allowed ? "badge-green" : "badge-rose"}>
                  {account.access.allowed ? "Active" : "Inactive"}
                </span>
              </div>
              {account.access.reason !== "dev" && account.access.reason !== "active" && (
                <p className="mt-3 text-xs text-slate-500">
                  {account.access.daysLeft} day{account.access.daysLeft === 1 ? "" : "s"} remaining
                  in your trial.
                </p>
              )}
            </div>
            <Link href="/billing" className="btn-secondary btn-sm mt-4">
              Manage plan
            </Link>
          </section>

          <section className="card p-5">
            <h2 className="section-title">Integrations</h2>
            <div className="mt-2 divide-y divide-slate-100">
              <StatusRow
                ok
                label="Supabase"
                detail={`Schema "${SUPABASE_SCHEMA}" · bucket "${STORAGE_BUCKET}"`}
                icon={Database}
              />
              <StatusRow
                ok
                label="Photo storage"
                detail="Private object storage with per-user paths"
                icon={Cloud}
              />
              <StatusRow
                ok={Boolean(GOOGLE_PLACES_API_KEY)}
                label="Google Places"
                detail="Premises autocomplete and address fill"
                icon={MapPin}
              />
              <StatusRow
                ok={aiReady}
                label="AI provider"
                detail={
                  aiReady
                    ? "Photo extraction and manufacturer guidance enabled"
                    : "Add OPENAI_API_KEY, OPENROUTER_API_KEY or GEMINI_API_KEY to enable"
                }
                icon={Sparkles}
              />
            </div>
          </section>
        </div>
      </div>

      <section className="card p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="section-title">Export your data</h2>
            <p className="muted mt-0.5">
              Download the full register as a detailed PDF, spreadsheet-ready CSV or a JSON backup.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/api/register/export?format=pdf" className="btn-secondary btn-sm">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              PDF
            </a>
            <a href="/api/register/export?format=csv" className="btn-secondary btn-sm">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              CSV
            </a>
            <a href="/api/register/export?format=json" className="btn-secondary btn-sm">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              JSON
            </a>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 text-xs text-slate-500">
        <p>
          Records are stored in your Supabase project under <code>asset-register/</code>. Photos are
          private and served through authenticated routes.{" "}
          {ALLOW_DEV_SUBSCRIPTION ? "Developer subscription bypass is enabled." : ""}
        </p>
      </div>
    </div>
  );
}
