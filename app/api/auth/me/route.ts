import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureProfile, getAccountContext } from "@/lib/account";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  let account = await getAccountContext(user.id);
  if (!account.profile) {
    await ensureProfile({
      id: user.id,
      email: user.email || "",
      fullName: String(user.user_metadata?.full_name || ""),
      companyName: String(user.user_metadata?.company_name || ""),
    });
    account = await getAccountContext(user.id);
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    profile: account.profile,
    subscription: account.subscription,
    access: account.access,
  });
}
