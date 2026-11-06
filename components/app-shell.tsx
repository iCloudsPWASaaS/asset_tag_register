"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  CreditCard,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Sparkles,
  Tags,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn, initials } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: Tags },
  { href: "/premises", label: "Premises", icon: Building2 },
  { href: "/register", label: "Register & export", icon: FileSpreadsheet },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  user,
  trialLabel,
  trialTone,
}: {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    company: string;
  };
  trialLabel: string;
  trialTone: "green" | "amber" | "rose" | "indigo";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const toneClass = {
    green: "bg-emerald-400/15 text-emerald-200 ring-emerald-400/30",
    amber: "bg-amber-400/15 text-amber-200 ring-amber-400/30",
    rose: "bg-rose-400/15 text-rose-200 ring-rose-400/30",
    indigo: "bg-indigo-400/15 text-indigo-200 ring-indigo-400/30",
  }[trialTone];

  const sidebar = (
    <div className="flex h-full flex-col bg-[#0b1220] text-slate-300">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo light href="/dashboard" />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 pb-4">
        <Link
          href="/assets/new"
          onClick={() => setOpen(false)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-400"
        >
          <Plus className="h-4 w-4" />
          New asset
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navigation.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-white/10 text-white ring-1 ring-white/10"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
              )}
            >
              <Icon className={cn("h-4.5 w-4.5", active ? "text-indigo-300" : "text-slate-500")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
          {trialLabel}
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
          Photo capture, QR labels, AI manuals and detailed register exports.
        </p>
        <Link
          href="/billing"
          onClick={() => setOpen(false)}
          className={cn(
            "mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
            toneClass,
          )}
        >
          <CreditCard className="h-3 w-3" />
          Plan & billing
        </Link>
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-200 ring-1 ring-indigo-400/30">
            {initials(user.name, user.email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{user.name}</p>
            <p className="truncate text-[11px] text-slate-500">{user.company || user.email}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="no-print hidden lg:sticky lg:top-0 lg:block lg:h-screen">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[280px] shadow-2xl">{sidebar}</div>
        </div>
      )}

      <div className="min-w-0">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo href="/dashboard" />
          <Link
            href="/assets/new"
            className="rounded-xl bg-indigo-600 p-2 text-white shadow-sm"
            aria-label="New asset"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
