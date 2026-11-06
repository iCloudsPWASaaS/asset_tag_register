import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  compact = false,
  light = false,
  href = "/",
}: {
  compact?: boolean;
  light?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5">
      <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-sm">
        <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
          <path
            d="M8 5h11l6 6v15a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
            fill="white"
            opacity="0.95"
          />
          <path d="M19 5v6h6" fill="#c7d2fe" />
          <rect x="10" y="15" width="5" height="5" rx="1" fill="#4f46e5" />
          <rect x="17" y="15" width="2.4" height="2.4" rx="0.5" fill="#4f46e5" />
          <rect x="20.6" y="15" width="2.4" height="2.4" rx="0.5" fill="#4f46e5" />
          <rect x="17" y="18.6" width="2.4" height="2.4" rx="0.5" fill="#4f46e5" />
          <rect x="20.6" y="18.6" width="2.4" height="2.4" rx="0.5" fill="#4f46e5" />
          <rect x="10" y="22" width="7" height="2" rx="0.8" fill="#a5b4fc" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className={cn("block text-sm font-bold tracking-tight", light ? "text-white" : "text-slate-900")}>
            AssetTag
          </span>
          <span className={cn("block text-[10px] font-semibold uppercase tracking-[0.18em]", light ? "text-indigo-200" : "text-slate-400")}>
            Register
          </span>
        </span>
      )}
    </Link>
  );
}
