import Link from "next/link";
import { Camera, CheckCircle2, QrCode, Sparkles } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Start your free trial",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next && params.next.startsWith("/") ? params.next : "/dashboard";

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <div className="relative hidden overflow-hidden bg-[#0b1220] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="hero-glow absolute inset-0" />
        <div className="relative">
          <Logo light href="/" />
        </div>
        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            30-day free trial · no card required
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">
            From photo to printed QR label in minutes.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Capture the asset, let the label reader fill in the details, then print a durable QR
            sticker. Every item rolls up into one detailed, exportable register.
          </p>
          <div className="mt-8 space-y-4">
            {[
              { icon: Camera, title: "Photo capture", text: "Snap the asset label on site." },
              { icon: Sparkles, title: "Smart extraction", text: "OCR reads make, model and serial." },
              { icon: QrCode, title: "QR labels", text: "Print sticky labels from any browser." },
              { icon: CheckCircle2, title: "Register export", text: "CSV and detailed PDF in one click." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="mt-0.5 rounded-lg bg-white/10 p-2 text-indigo-300">
                  <item.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.text}</p>
                </div>
              </div>
            ))}
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Your 30-day trial starts immediately. No payment details needed.
          </p>
          <div className="mt-7">
            <AuthForm mode="signup" nextPath={nextPath} />
          </div>
          <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-400">
            By creating an account you agree to use the register responsibly and only upload
            information you are authorised to record.
          </p>
          <div className="mt-6 hidden lg:block">
            <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-700">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
