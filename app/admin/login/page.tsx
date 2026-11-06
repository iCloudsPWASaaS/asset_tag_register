import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AdminLoginForm } from "@/components/admin-login-form";
import { Logo } from "@/components/logo";
import { getAdminSession } from "@/lib/admin";

export const metadata = {
  title: "Admin sign in",
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <div className="grid min-h-screen place-items-center bg-[#0b1220] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <Logo light href="/" />
          <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-slate-200">
            Back to site
          </Link>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
            <ShieldCheck className="h-4 w-4" />
            Admin console
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">
            Standalone admin access. This is separate from customer accounts.
          </p>
          <div className="mt-6">
            <AdminLoginForm />
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-slate-500">
          Authorised administrators only. Sessions expire after 8 hours.
        </p>
      </div>
    </div>
  );
}
