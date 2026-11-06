import Link from "next/link";
import { ShieldCheck, Sparkles, Tags } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next && params.next.startsWith("/") ? params.next : "/dashboard";

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden overflow-hidden bg-[#0b1220] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="hero-glow absolute inset-0" />
        <div className="relative">
          <Logo light href="/" />
        </div>
        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Asset registers, without the clipboard
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">
            Every asset tagged. Every site documented.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Photograph an asset, capture the label, generate a QR sticker and export a detailed
            register when you need it. Built for engineers and facilities teams on the move.
          </p>
          <div className="mt-8 space-y-3 text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-white/10 p-2 text-indigo-300">
                <Tags className="h-4 w-4" />
              </span>
              QR labels ready to print on sticky sheets
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-white/10 p-2 text-indigo-300">
                <Sparkles className="h-4 w-4" />
              </span>
              Photo OCR and optional AI manufacturer guidance
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-white/10 p-2 text-indigo-300">
                <ShieldCheck className="h-4 w-4" />
              </span>
              Private per-account records in your Supabase project
            </div>
          </div>
        </div>
        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} AssetTag Register
        </p>
      </div>

      <div className="flex flex-col justify-center bg-slate-50 px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo />
            <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-700">
              Back to home
            </Link>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Sign in to continue building your asset register.
          </p>
          <div className="mt-7">
            <AuthForm mode="login" nextPath={nextPath} />
          </div>
          <div className="mt-8 hidden lg:block">
            <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-700">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
