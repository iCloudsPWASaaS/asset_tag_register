import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { extractAssetFields } from "@/lib/ai";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const account = await getAccountContext(user.id);
  if (!account.access.allowed) {
    return NextResponse.json({ error: "Your active plan is required." }, { status: 402 });
  }

  try {
    const body = (await request.json()) as {
      text?: string;
      imageBase64?: string;
      imageMime?: string;
    };
    if (!body.text && !body.imageBase64) {
      return NextResponse.json(
        { error: "Run the label scan or attach a photo first." },
        { status: 400 },
      );
    }
    if (body.imageBase64 && body.imageBase64.length > 8_000_000) {
      return NextResponse.json({ error: "That image is too large." }, { status: 413 });
    }

    const result = await extractAssetFields({
      text: body.text,
      imageBase64: body.imageBase64,
      imageMime: body.imageMime,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("ai extract", error);
    return NextResponse.json({ error: "Could not read the label." }, { status: 500 });
  }
}
