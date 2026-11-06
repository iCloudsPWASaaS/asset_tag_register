import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { uploadPhoto } from "@/lib/storage";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const account = await getAccountContext(user.id);
  if (!account.access.allowed) {
    return NextResponse.json({ error: "Your trial has ended. Activate a plan to continue." }, { status: 402 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
    }
    const result = await uploadPhoto(user.id, file);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("upload", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not upload the photo." },
      { status: 500 },
    );
  }
}
