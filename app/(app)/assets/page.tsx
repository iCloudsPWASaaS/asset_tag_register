import { AssetsClient } from "@/components/assets-client";
import { requireAccount } from "@/lib/auth";
import { listAssets, listPremises } from "@/lib/storage";

export const metadata = {
  title: "Assets",
};

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ premises?: string }>;
}) {
  const { user } = await requireAccount("/assets");
  const [assets, premises, params] = await Promise.all([
    listAssets(user.id),
    listPremises(user.id),
    searchParams,
  ]);

  return (
    <AssetsClient
      assets={assets}
      premises={premises}
      initialPremises={params.premises}
    />
  );
}
