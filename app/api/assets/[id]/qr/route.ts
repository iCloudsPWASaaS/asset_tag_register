import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth";
import { getAsset } from "@/lib/storage";
import { absoluteAssetUrl } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const asset = await getAsset(user.id, id);
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  const url = absoluteAssetUrl(asset.userId, asset.id);
  const buffer = await QRCode.toBuffer(url, {
    type: "png",
    width: 700,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
