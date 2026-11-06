import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPlaceDetails } from "@/lib/places";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const placeId = new URL(request.url).searchParams.get("placeId") || "";
  const place = await getPlaceDetails(placeId);
  if (!place) return NextResponse.json({ error: "Place not found" }, { status: 404 });
  return NextResponse.json({ place });
}
