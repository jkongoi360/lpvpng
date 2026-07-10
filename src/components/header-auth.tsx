"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuthState = { authed: boolean; email?: string };

// Top-right auth controls. Fetches session state on mount and shows either
// Sign in / Register (guest) or the user's email + Sign out (logged in).
export function HeaderAuth() {
  const [state, setState] = useState<AuthState | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { authenticated: false }))
      .then((j) => {
        if (!cancelled)
          setState({ authed: !!j.authenticated, email: j.email });
      })
      .catch(() => {
        if (!cancelled) setState({ authed: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setState({ authed: false });
    router.replace("/");
    router.refresh();
  }

  // Reserve space while loading to avoid layout shift.
  if (!state) return <div className="h-9 w-24" aria-hidden />;

  if (state.authed) {
    return (
      <div className="flex items-center gap-3">
        {state.email && (
          <span className="hidden sm:inline text-xs text-zinc-400">
            {state.email}
          </span>
        )}
        <button
          onClick={logout}
          className="rounded-md border border-white/20 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-white/10 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-200 hover:text-png-gold transition-colors"
      >
        Sign in
      </Link>
      <Link
        href="/register"
        className="rounded-md bg-png-red px-3 py-1.5 text-sm font-semibold text-white hover:bg-png-red/90 transition-colors"
      >
        Register
      </Link>
    </div>
  );
}
