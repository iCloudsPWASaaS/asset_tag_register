import { AssetForm } from "@/components/asset-form";
import { requireAccount } from "@/lib/auth";
import { isAiConfigured } from "@/lib/env";
import { listPremises } from "@/lib/storage";

export const metadata = {
  title: "New asset",
};

export default async function NewAssetPage() {
  const { user, account } = await requireAccount("/assets/new");
  const premises = await listPremises(user.id);
  const defaultEngineer =
    account.profile?.full_name || String(user.user_metadata?.full_name || "");

  return (
    <AssetForm
      mode="create"
      premises={premises}
      defaultEngineer={defaultEngineer}
      aiEnabled={isAiConfigured()}
    />
  );
}
