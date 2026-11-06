import { RegisterClient } from "@/components/register-client";
import { requireAccount } from "@/lib/auth";
import { listAssets, listPremises } from "@/lib/storage";

export const metadata = {
  title: "Register & export",
};

export default async function RegisterPage() {
  const { user, account } = await requireAccount("/register");
  const [assets, premises] = await Promise.all([
    listAssets(user.id),
    listPremises(user.id),
  ]);
  const company =
    account.profile?.company_name || account.profile?.full_name || "AssetTag Register";

  return <RegisterClient assets={assets} premises={premises} company={company} />;
}
