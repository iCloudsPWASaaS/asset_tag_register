import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Camera,
  CheckCircle2,
  FileSpreadsheet,
  MapPin,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tags,
  Wrench,
} from "lucide-react";
import { Logo } from "@/components/logo";

const features = [
  {
    icon: Camera,
    title: "Photo-first capture",
    text: "Snap the asset or its label. The on-device reader pulls out make, model and serial so the engineer only checks and confirms.",
  },
  {
    icon: QrCode,
    title: "Printable QR labels",
    text: "Every asset gets a unique tag and QR code, formatted for 70 × 40 mm sticky labels. Print from any browser.",
  },
  {
    icon: BookOpen,
    title: "Manufacturer guidance",
    text: "Optional AI builds safety points, maintenance tasks and manual links from the make and model. No AI key? Get targeted manual searches.",
  },
  {
    icon: FileSpreadsheet,
    title: "Detailed register export",
    text: "Filter by premises, type or status, then export a branded PDF, spreadsheet-ready CSV or full JSON backup.",
  },
  {
    icon: Building2,
    title: "Multi-site by design",
    text: "Group assets by premises and exact location. Search Google Places to fill the address in one tap.",
  },
  {
    icon: Smartphone,
    title: "Works on site",
    text: "Installable PWA with camera capture, private photo storage and a read-only record behind every QR code.",
  },
];

const steps = [
  {
    number: "01",
    title: "Photograph the asset",
    text: "Use the camera on your phone or upload a photo of the item and its label.",
    icon: Camera,
  },
  {
    number: "02",
    title: "Check the details",
    text: "Location, type, make, model and serial number. OCR fills the blanks; you confirm.",
    icon: ScanLine,
  },
  {
    number: "03",
    title: "Print the QR label",
    text: "Save once and print a sticky label. Scanning it opens the read-only asset record.",
    icon: QrCode,
  },
  {
    number: "04",
    title: "Export the register",
    text: "Roll every item into a detailed register, ready for audits, handovers and clients.",
    icon: FileSpreadsheet,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-slate-900">
              How it works
            </a>
            <a href="#example" className="hover:text-slate-900">
              Example label
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost btn-sm hidden sm:inline-flex">
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary btn-sm">
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="hero-glow absolute inset-0" />
          <div className="grid-bg absolute inset-0 opacity-40" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                30-day free trial · no card required
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Every asset tagged.
                <br />
                <span className="text-indigo-600">Every site documented.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                The asset register for engineers and facilities teams. Photograph an item, capture
                the label, print a QR sticker and export a detailed register — without a clipboard
                or a spreadsheet in sight.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/signup" className="btn-primary px-5 py-3">
                  Start your free trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="btn-secondary px-5 py-3">
                  Sign in
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> QR labels included
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Private photo storage
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> PDF, CSV & JSON exports
                </span>
              </div>
            </div>

            <div className="relative flex items-center justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-300/40">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Asset record
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
                        <svg viewBox="0 0 100 100" className="h-20 w-20" aria-hidden="true">
                          <rect width="100" height="100" fill="white" />
                          {Array.from({ length: 10 }).map((_, row) =>
                            Array.from({ length: 10 }).map((_, col) => {
                              const filled =
                                (row < 3 && col < 3) ||
                                (row < 3 && col > 6) ||
                                (row > 6 && col < 3) ||
                                (row * 7 + col * 13) % 5 < 2;
                              return filled ? (
                                <rect
                                  key={`${row}-${col}`}
                                  x={col * 9 + 5}
                                  y={row * 9 + 5}
                                  width="8"
                                  height="8"
                                  rx="1"
                                  fill="#0f172a"
                                />
                              ) : null;
                            }),
                          )}
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-bold text-indigo-700">AT-000142</p>
                        <p className="mt-1 text-sm font-bold leading-tight text-slate-900">
                          Subway UK, St Vincent Street
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin className="h-3 w-3" /> Entrance
                        </p>
                        <div className="mt-2 space-y-0.5 text-[11px] text-slate-600">
                          <p>
                            <span className="font-semibold">Type:</span> Fire safety sign
                          </p>
                          <p>
                            <span className="font-semibold">Make:</span> Alpha · Twin LED, 24V
                          </p>
                          <p>
                            <span className="font-semibold">Serial:</span>{" "}
                            <span className="font-mono">ABC1234</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      { label: "Assets", value: "148" },
                      { label: "Premises", value: "12" },
                      { label: "With guidance", value: "96" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-slate-200 p-2.5">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                          {stat.label}
                        </p>
                        <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-xl bg-indigo-600 px-3 py-2.5 text-white">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold">
                      <BookOpen className="h-4 w-4" />
                      Manufacturer guidance ready
                    </span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                      AI
                    </span>
                  </div>
                </div>

                <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:block">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Stored privately
                      </p>
                      <p className="text-xs font-bold text-slate-900">Per-account records</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Built for the job
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                A register that keeps up with the engineer.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Everything between spotting an asset and handing over a finished register, in one
                focused workflow.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="card card-hover p-5">
                  <span className="inline-flex rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                How it works
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                From photo to printed label in minutes.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <div key={step.number} className="card relative p-5">
                  <span className="text-[11px] font-bold tracking-wider text-indigo-400">
                    {step.number}
                  </span>
                  <span className="mt-3 inline-flex rounded-xl bg-slate-100 p-2.5 text-slate-700">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="example" className="border-y border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Example record
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                The details that matter, captured once.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Premises, location, type, make, model and serial number — plus the photo, the QR
                label and any manufacturer guidance you add later.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  { icon: Building2, label: "Premises", value: "Subway UK, St Vincent Street Glasgow" },
                  { icon: MapPin, label: "Location", value: "Entrance" },
                  { icon: Tags, label: "Type", value: "Fire safety sign" },
                  { icon: Wrench, label: "Make / model", value: "Alpha · Twin LED, 24V battery" },
                  { icon: ScanLine, label: "Serial number", value: "ABC1234" },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3">
                    <span className="rounded-lg bg-white p-1.5 text-indigo-600 shadow-sm ring-1 ring-slate-200">
                      <row.icon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {row.label}
                      </p>
                      <p className="text-sm font-medium text-slate-800">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-xl">
                <div className="mx-auto w-fit rotate-[-2deg] rounded-md border border-slate-300 bg-white p-3 shadow-lg">
                  <div className="flex gap-3">
                    <div className="rounded-md border border-slate-200 p-1.5">
                      <svg viewBox="0 0 100 100" className="h-20 w-20" aria-hidden="true">
                        <rect width="100" height="100" fill="white" />
                        {Array.from({ length: 10 }).map((_, row) =>
                          Array.from({ length: 10 }).map((_, col) => {
                            const filled =
                              (row < 3 && col < 3) ||
                              (row < 3 && col > 6) ||
                              (row > 6 && col < 3) ||
                              (row * 11 + col * 5) % 4 < 2;
                            return filled ? (
                              <rect
                                key={`${row}-${col}`}
                                x={col * 9 + 5}
                                y={row * 9 + 5}
                                width="8"
                                height="8"
                                rx="1"
                                fill="#0f172a"
                              />
                            ) : null;
                          }),
                        )}
                      </svg>
                    </div>
                    <div className="w-40">
                      <p className="text-[7px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                        AssetTag
                      </p>
                      <p className="font-mono text-[10px] font-bold text-slate-900">AT-000142</p>
                      <p className="mt-1 text-[10px] font-bold leading-tight text-slate-900">
                        Subway UK, St Vincent Street
                      </p>
                      <p className="text-[8px] text-slate-500">Entrance</p>
                      <p className="mt-1 text-[8px] text-slate-700">
                        <span className="font-semibold">Type:</span> Fire safety sign
                      </p>
                      <p className="text-[8px] text-slate-700">
                        <span className="font-semibold">Make:</span> Alpha · Twin LED
                      </p>
                      <p className="text-[8px] text-slate-700">
                        <span className="font-semibold">Serial:</span> ABC1234
                      </p>
                      <p className="mt-1 text-[6px] text-slate-400">Scan for the full asset record</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-xs font-semibold text-slate-900">70 × 40 mm sticky label</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Print at 100% scale from any browser.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Start with 30 days free
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Tag your first asset today.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              No card required. Add a premises, capture an asset and print the QR label in your
              first session.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="btn-primary px-5 py-3">
                Create your account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-secondary px-5 py-3">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <Logo />
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} AssetTag Register. Built for engineers and facilities teams.
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <Link href="/login" className="hover:text-slate-800">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-slate-800">
              Start trial
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
