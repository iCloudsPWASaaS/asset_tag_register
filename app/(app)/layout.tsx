import { AppShell } from "@/components/app-shell";
import { ensureProfile, getAccountContext } from "@/lib/account";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  let account = await getAccountContext(user.id);

  if (!account.profile) {
    await ensureProfile({
      id: user.id,
      email: user.email || "",
      fullName: String(user.user_metadata?.full_name || ""),
      companyName: String(user.user_metadata?.company_name || ""),
      phone: String(user.user_metadata?.phone || ""),
    });
    account = await getAccountContext(user.id);
  }

  const profile = account.profile;
  const access = account.access;
  const name =
    profile?.full_name || String(user.user_metadata?.full_name || "") || user.email || "Engineer";
  const company =
    profile?.company_name || String(user.user_metadata?.company_name || "") || "";

  let trialLabel = "30-day free trial";
  let trialTone: "green" | "amber" | "rose" | "indigo" = "indigo";

  if (access.reason === "dev") {
    trialLabel = "Developer access enabled";
    trialTone = "green";
  } else if (access.reason === "active") {
    trialLabel = `${access.planId} plan active`;
    trialTone = "green";
  } else if (access.reason === "trialing" || access.reason === "trial") {
    trialLabel = `${access.daysLeft} day${access.daysLeft === 1 ? "" : "s"} left in trial`;
    trialTone = access.daysLeft <= 7 ? "amber" : "indigo";
  } else if (access.reason === "expired") {
    trialLabel = "Trial ended — activate a plan";
    trialTone = "rose";
  }

  return (
    <AppShell
      user={{ name, email: user.email || "", company }}
      trialLabel={trialLabel}
      trialTone={trialTone}
    >
      {children}
    </AppShell>
  );
}
