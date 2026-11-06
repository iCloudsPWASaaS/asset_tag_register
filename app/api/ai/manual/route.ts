import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { generateManufacturerManual } from "@/lib/ai";
import { getAsset, updateAsset } from "@/lib/storage";
import { manualSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const account = await getAccountContext(user.id);
  if (!account.access.allowed) {
    return NextResponse.json({ error: "Your active plan is required." }, { status: 402 });
  }

  try {
    const body = await request.json();
    const parsed = manualSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Check the asset details." }, { status: 400 });
    }
    const { make, model, type, serialNumber } = parsed.data;
    const assetId = typeof body.assetId === "string" ? body.assetId : "";

    if (!make && !model && !type) {
      return NextResponse.json(
        { error: "Add a make, model or asset type first." },
        { status: 400 },
      );
    }

    if (assetId) {
      const asset = await getAsset(user.id, assetId);
      if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const manual = await generateManufacturerManual({
      make,
      model,
      type,
      serialNumber,
    });

    if (assetId) {
      await updateAsset(user.id, assetId, { manual });
    }

    return NextResponse.json({ manual });
  } catch (error) {
    console.error("ai manual", error);
    return NextResponse.json({ error: "Could not build the guidance." }, { status: 500 });
  }
}
