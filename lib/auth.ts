import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAccountContext, getProfile } from "@/lib/account";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import type { AccountContext } from "@/lib/types";

export type AuthUser = {
  id: string;
  email: string | null;
  user_metadata: {
    full_name: string;
    company_name: string;
    phone: string;
  };
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const session = await verifySessionToken(store.get(SESSION_COOKIE_NAME)?.value);
  if (!session) return null;

  const profile = await getProfile(session.uid);
  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    user_metadata: {
      full_name: profile.full_name || "",
      company_name: profile.company_name || "",
      phone: profile.phone || "",
    },
  };
}

export async function requireUser(nextPath = "/dashboard") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

export async function requireAccount(nextPath = "/dashboard"): Promise<{
  user: AuthUser;
  account: AccountContext;
}> {
  const user = await requireUser(nextPath);
  const account = await getAccountContext(user.id);
  if (!account.access.allowed) {
    redirect("/billing");
  }
  return { user, account };
}
