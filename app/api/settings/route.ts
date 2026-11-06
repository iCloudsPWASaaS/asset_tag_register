import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const schema = z.object({
  fullName: z.string().trim().optional().default(""),
  companyName: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
});

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Check your details." },
        { status: 400 },
      );
    }
    const { fullName, companyName, phone } = parsed.data;
    const admin = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name: fullName || null,
        company_name: companyName || null,
        phone: phone || null,
        updated_at: now,
      })
      .eq("id", user.id);
    if (profileError) throw new Error(profileError.message);

    const { data: existing } = await admin
      .from("settings")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await admin
        .from("settings")
        .update({
          company_name: companyName || null,
          phone: phone || null,
          email: user.email || null,
          updated_at: now,
        })
        .eq("user_id", user.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await admin.from("settings").insert({
        user_id: user.id,
        company_name: companyName || null,
        phone: phone || null,
        email: user.email || null,
        currency: "GBP",
        vat_rate: 0,
        auto_sync: true,
      });
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("settings", error);
    return NextResponse.json({ error: "Could not save your settings." }, { status: 500 });
  }
}
