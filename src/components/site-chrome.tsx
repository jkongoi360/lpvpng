"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderAuth } from "./header-auth";

// Auth pages render their own full-screen shell (Mt Giluwe backdrop), so the
// global header/footer are hidden there.
const BARE_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = BARE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );

  if (bare) return <>{children}</>;

  return (
    <>
      <header className="border-b bg-png-black text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="h-8 w-3 bg-png-red" />
                <div className="h-8 w-3 bg-png-gold" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight">
                  SmartVoter PNG
                </span>
                <span className="ml-2 text-xs text-zinc-400">2027</span>
              </div>
            </Link>
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-6 text-sm">
                <Link
                  href="/regional"
                  className="text-zinc-300 hover:text-png-gold transition-colors"
                >
                  Regional
                </Link>
                <Link
                  href="/governors"
                  className="text-zinc-300 hover:text-png-gold transition-colors"
                >
                  Governors
                </Link>
                <Link
                  href="/open"
                  className="text-zinc-300 hover:text-png-gold transition-colors"
                >
                  Open Seats
                </Link>
                <Link
                  href="/voter-distribution"
                  className="text-zinc-300 hover:text-png-gold transition-colors"
                >
                  Voter Distribution
                </Link>
                <Link
                  href="/about"
                  className="text-zinc-300 hover:text-png-gold transition-colors"
                >
                  How LPV Works
                </Link>
              </nav>
              <HeaderAuth />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-zinc-50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-zinc-500">
          SmartVoter PNG &mdash; Limited Preferential Voting · 2027 General
          Elections
        </div>
      </footer>
    </>
  );
}
