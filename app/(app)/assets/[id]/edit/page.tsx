import { notFound } from "next/navigation";
import { AssetForm } from "@/components/asset-form";
import { requireAccount } from "@/lib/auth";
import { isAiConfigured } from "@/lib/env";
import { getAsset, listPremises } from "@/lib/storage";

export const metadata = {
  title: "Edit asset",
};

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, account } = await requireAccount(`/assets/${id}/edit`);
  const asset = await getAsset(user.id, id);
  if (!asset) notFound();
  const premises = await listPremises(user.id);
  const defaultEngineer =
    account.profile?.full_name || String(user.user_metadata?.full_name || "");

  return (
    <AssetForm
      mode="edit"
      asset={asset}
      premises={premises}
      defaultEngineer={defaultEngineer}
      aiEnabled={isAiConfigured()}
    />
  );
}
