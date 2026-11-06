import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { downloadPhoto, isPhotoOwnedByUser } from "@/lib/storage";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const path = new URL(request.url).searchParams.get("path") || "";
  if (!path || !isPhotoOwnedByUser(path, user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const blob = await downloadPhoto(path);
  if (!blob) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new Response(await blob.arrayBuffer(), {
    headers: {
      "Content-Type": blob.type || "image/jpeg",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
