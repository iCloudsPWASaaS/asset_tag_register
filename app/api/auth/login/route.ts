import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/session";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Check your details and try again." },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from("profiles")
      .select("id, password_hash")
      .ilike("email", email)
      .maybeSingle();

    if (error) throw new Error(error.message);

    const profile = data as { id: string; password_hash: string | null } | null;
    if (!profile || !verifyPassword(parsed.data.password, profile.password_hash)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await createSessionToken(profile.id);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    console.error("login", error);
    return NextResponse.json({ error: "Could not sign in. Please try again." }, { status: 500 });
  }
}
