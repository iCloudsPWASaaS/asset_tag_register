import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import {
  createAsset,
  isPhotoOwnedByUser,
  listAssets,
  listPremises,
} from "@/lib/storage";
import { assetInputSchema } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [assets, premises] = await Promise.all([
    listAssets(user.id),
    listPremises(user.id),
  ]);
  return NextResponse.json({ assets, premises });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getAccountContext(user.id);
  if (!account.access.allowed) {
    return NextResponse.json({ error: "Your trial has ended. Activate a plan to continue." }, { status: 402 });
  }

  try {
    const body = await request.json();
    const parsed = assetInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Check the asset details." },
        { status: 400 },
      );
    }

    const input = parsed.data;
    if (input.photoPath && !isPhotoOwnedByUser(input.photoPath, user.id)) {
      return NextResponse.json({ error: "Invalid photo reference." }, { status: 400 });
    }
    if (!input.engineer && account.profile?.full_name) {
      input.engineer = account.profile.full_name;
    }

    const asset = await createAsset(user.id, input);
    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    console.error("create asset", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save the asset." },
      { status: 500 },
    );
  }
}
