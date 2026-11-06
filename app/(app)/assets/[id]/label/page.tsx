import { notFound } from "next/navigation";
import { LabelPrint } from "@/components/label-print";
import { requireAccount } from "@/lib/auth";
import { getAsset } from "@/lib/storage";
import { absoluteAssetUrl } from "@/lib/utils";

export const metadata = {
  title: "Print label",
};

export default async function AssetLabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await requireAccount(`/assets/${id}/label`);
  const asset = await getAsset(user.id, id);
  if (!asset) notFound();

  return (
    <>
      <style>{`@page { size: 70mm 40mm; margin: 0; }`}</style>
      <LabelPrint asset={asset} publicUrl={absoluteAssetUrl(asset.userId, asset.id)} />
    </>
  );
}
