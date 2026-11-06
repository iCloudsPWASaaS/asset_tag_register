import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { autocompletePlaces } from "@/lib/places";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q") || "";
  const suggestions = await autocompletePlaces(query);
  return NextResponse.json({ suggestions });
}
