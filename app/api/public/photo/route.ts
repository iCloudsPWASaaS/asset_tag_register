import { NextResponse } from "next/server";
import { downloadPhoto, getPublicAsset } from "@/lib/storage";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") || "";
  const assetId = url.searchParams.get("assetId") || "";
  if (!userId || !assetId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const record = await getPublicAsset(userId, assetId);
  if (!record?.asset.photoPath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const blob = await downloadPhoto(record.asset.photoPath);
  if (!blob) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new Response(await blob.arrayBuffer(), {
    headers: {
      "Content-Type": blob.type || "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
