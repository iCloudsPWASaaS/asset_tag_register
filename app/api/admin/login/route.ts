import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_MAX_AGE,
  ADMIN_COOKIE_NAME,
  createAdminToken,
  isValidAdminCredentials,
} from "@/lib/admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = (body.email || "").trim();
    const password = body.password || "";
    if (!isValidAdminCredentials(email, password)) {
      return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
    }

    const token = createAdminToken(email);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_COOKIE_MAX_AGE,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Could not sign in." }, { status: 400 });
  }
}
