import { ShieldCheck, Tags, Users, Wallet } from "lucide-react";
import { AdminActions } from "@/components/admin-actions";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { Logo } from "@/components/logo";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getUserAssetCount, listIndexUserIds } from "@/lib/storage";
import type { Profile, Subscription } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Admin",
};

function subscriptionLabel(subscription: Subscription | null) {
  if (!subscription) return { label: "No subscription", className: "badge-slate" };
  if (subscription.status === "active") return { label: "Active", className: "badge-green" };
  if (subscription.status === "trialing") return { label: "Trialing", className: "badge-indigo" };
  if (subscription.status === "canceled") return { label: "Canceled", className: "badge-rose" };
  return { label: subscription.status, className: "badge-slate" };
}

export default async function AdminPage() {
  const session = await requireAdmin();
  const admin = getSupabaseAdmin();

  const [{ data: profilesData }, { data: subscriptionsData }, indexIds] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }).limit(100),
    admin.from("subscriptions").select("*").order("created_at", { ascending: false }),
    listIndexUserIds(),
  ]);

  const profiles = (profilesData || []) as Profile[];
  const subscriptions = (subscriptionsData || []) as Subscription[];
  const latestByUser = new Map<string, Subscription>();
  subscriptions.forEach((subscription) => {
    if (!latestByUser.has(subscription.user_id)) latestByUser.set(subscription.user_id, subscription);
  });

  const indexSet = new Set(indexIds);
  const counts = await Promise.all(
    profiles.map(async (profile) => {
      if (!indexSet.has(profile.id)) return 0;
      try {
        return await getUserAssetCount(profile.id);
      } catch {
        return 0;
      }
    }),
  );

  const totalAssets = counts.reduce((sum, count) => sum + count, 0);
  const paying = profiles.filter((profile) => {
    const subscription = latestByUser.get(profile.id);
    return subscription?.status === "active";
  }).length;
  const trialing = profiles.filter((profile) => {
    const subscription = latestByUser.get(profile.id);
    return subscription?.status === "trialing";
  }).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Logo href="/admin" />
            <span className="hidden rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white sm:inline">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-500 sm:inline">{session.email}</span>
            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Operations
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Admin console
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Customer accounts, trial status and asset register usage.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Accounts", value: profiles.length, icon: Users, tone: "bg-indigo-50 text-indigo-600" },
            { label: "Active plans", value: paying, icon: Wallet, tone: "bg-emerald-50 text-emerald-600" },
            { label: "Trialing", value: trialing, icon: ShieldCheck, tone: "bg-amber-50 text-amber-600" },
            { label: "Assets recorded", value: totalAssets, icon: Tags, tone: "bg-sky-50 text-sky-600" },
          ].map((stat) => (
            <div key={stat.label} className="card flex items-start justify-between p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <span className={`rounded-xl p-2.5 ${stat.tone}`}>
                <stat.icon className="h-5 w-5" />
              </span>
            </div>
          ))}
        </div>

        <div className="card mt-6 overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="section-title">Accounts</h2>
            <p className="muted mt-0.5">
              Extend a trial, activate a plan or cancel access. Changes take effect immediately.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="table-th">Account</th>
                  <th className="table-th">Company</th>
                  <th className="table-th">Plan</th>
                  <th className="table-th">Access until</th>
                  <th className="table-th">Assets</th>
                  <th className="table-th">Joined</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.map((profile, index) => {
                  const subscription = latestByUser.get(profile.id) || null;
                  const label = subscriptionLabel(subscription);
                  const until =
                    subscription?.status === "trialing"
                      ? subscription.trial_end
                      : subscription?.current_period_end || subscription?.trial_end;
                  return (
                    <tr key={profile.id} className="hover:bg-slate-50/60">
                      <td className="table-td">
                        <p className="text-sm font-semibold text-slate-900">
                          {profile.full_name || "Unnamed account"}
                        </p>
                        <p className="text-xs text-slate-500">{profile.email || profile.id}</p>
                      </td>
                      <td className="table-td text-sm">{profile.company_name || "—"}</td>
                      <td className="table-td">
                        <span className={label.className}>{label.label}</span>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {subscription?.plan_id || "—"}
                        </p>
                      </td>
                      <td className="table-td whitespace-nowrap text-xs text-slate-600">
                        {until ? formatDate(until) : "—"}
                      </td>
                      <td className="table-td">
                        <span className="badge-slate">{counts[index] ?? 0}</span>
                      </td>
                      <td className="table-td whitespace-nowrap text-xs text-slate-500">
                        {formatDate(profile.created_at)}
                      </td>
                      <td className="table-td">
                        <AdminActions userId={profile.id} />
                      </td>
                    </tr>
                  );
                })}
                {profiles.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                      No accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Admin sessions are signed with ADMIN_SESSION_SECRET and expire after 8 hours.
        </p>
      </main>
    </div>
  );
}
