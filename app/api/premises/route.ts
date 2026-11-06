import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { createPremises, listPremises } from "@/lib/storage";
import { premisesInputSchema } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ premises: await listPremises(user.id) });
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
    const parsed = premisesInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Check the premises details." },
        { status: 400 },
      );
    }
    const premises = await createPremises(user.id, parsed.data);
    return NextResponse.json({ premises }, { status: 201 });
  } catch (error) {
    console.error("create premises", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save the premises." },
      { status: 500 },
    );
  }
}
