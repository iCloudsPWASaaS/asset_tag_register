import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import {
  deleteAsset,
  getAsset,
  isPhotoOwnedByUser,
  updateAsset,
} from "@/lib/storage";
import { assetUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const asset = await getAsset(user.id, id);
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  return NextResponse.json({ asset });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const account = await getAccountContext(user.id);
  if (!account.access.allowed) {
    return NextResponse.json({ error: "Your trial has ended. Activate a plan to continue." }, { status: 402 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = assetUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Check the asset details." },
        { status: 400 },
      );
    }
    if (parsed.data.photoPath && !isPhotoOwnedByUser(parsed.data.photoPath, user.id)) {
      return NextResponse.json({ error: "Invalid photo reference." }, { status: 400 });
    }
    const asset = await updateAsset(user.id, id, parsed.data);
    return NextResponse.json({ asset });
  } catch (error) {
    console.error("update asset", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update the asset." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const account = await getAccountContext(user.id);
  if (!account.access.allowed) {
    return NextResponse.json({ error: "Your active plan is required." }, { status: 402 });
  }

  const { id } = await params;
  try {
    await deleteAsset(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("delete asset", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete the asset." },
      { status: 500 },
    );
  }
}
