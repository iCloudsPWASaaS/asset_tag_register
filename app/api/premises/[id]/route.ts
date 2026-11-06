import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { deletePremises, getPremises, updatePremises } from "@/lib/storage";
import { premisesInputSchema } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const premises = await getPremises(user.id, id);
  if (!premises) return NextResponse.json({ error: "Premises not found" }, { status: 404 });
  return NextResponse.json({ premises });
}

export async function PUT(
  request: Request,
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
    const body = await request.json();
    const parsed = premisesInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Check the premises details." },
        { status: 400 },
      );
    }
    const premises = await updatePremises(user.id, id, parsed.data);
    return NextResponse.json({ premises });
  } catch (error) {
    console.error("update premises", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update the premises." },
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
    await deletePremises(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("delete premises", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete the premises." },
      { status: 500 },
    );
  }
}
