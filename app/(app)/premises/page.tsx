import { PremisesClient } from "@/components/premises-client";
import { requireAccount } from "@/lib/auth";
import { listAssets, listPremises } from "@/lib/storage";

export const metadata = {
  title: "Premises",
};

export default async function PremisesPage() {
  const { user } = await requireAccount("/premises");
  const [premises, assets] = await Promise.all([
    listPremises(user.id),
    listAssets(user.id),
  ]);

  return <PremisesClient premises={premises} assets={assets} />;
}
