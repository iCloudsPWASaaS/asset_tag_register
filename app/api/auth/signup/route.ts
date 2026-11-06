import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureSettings, ensureTrialSubscription } from "@/lib/account";
import { hashPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/session";
import { signupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Check your details and try again." },
        { status: 400 },
      );
    }

    const { email, password, fullName, companyName, phone } = parsed.data;
    const normalisedEmail = email.toLowerCase();
    const admin = getSupabaseAdmin();

    const { data: existing, error: lookupError } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", normalisedEmail)
      .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists. Try signing in instead." },
        { status: 409 },
      );
    }

    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error: insertError } = await admin.from("profiles").insert({
      id: userId,
      email: normalisedEmail,
      full_name: fullName,
      company_name: companyName || null,
      phone: phone || null,
      role: "owner",
      password_hash: hashPassword(password),
      created_at: now,
      updated_at: now,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "An account with that email already exists. Try signing in instead." },
          { status: 409 },
        );
      }
      throw new Error(insertError.message);
    }

    await ensureTrialSubscription(userId);
    await ensureSettings({
      userId,
      companyName,
      email: normalisedEmail,
      phone,
    });

    const token = await createSessionToken(userId);
    const response = NextResponse.json({ ok: true }, { status: 201 });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    console.error("signup", error);
    return NextResponse.json(
      { error: "Could not create the account. Please try again." },
      { status: 500 },
    );
  }
}
