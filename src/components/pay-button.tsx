"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = { authenticated: boolean; paid?: boolean; guest?: boolean };

// Adapts the /access call-to-action to the viewer:
//  - paid/admin  → already has access
//  - logged in   → "Pay online" (Stripe Checkout)
//  - guest/none  → create an account / sign in to pay
export function PayButton() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { authenticated: false }))
      .then((j) => setMe({ authenticated: !!j.authenticated, paid: !!j.paid, guest: !!j.guest }))
      .catch(() => setME_none());
    function setME_none() {
      setMe({ authenticated: false });
    }
  }, []);

  async function pay() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (j.url) {
        window.location.href = j.url;
      } else if (j.alreadyPaid) {
        window.location.href = "/open";
      } else {
        setError(j.error || "Could not start checkout. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!me) return <div className="h-12" aria-hidden />;

  const btn = "rounded-lg px-6 py-3 font-semibold transition-colors";

  // Logged-in, unpaid, non-guest → can pay directly.
  if (me.authenticated && !me.paid && !me.guest) {
    return (
      <div>
        <button onClick={pay} disabled={loading} className={`${btn} bg-[#CE1126] text-white hover:bg-[#CE1126]/90 disabled:opacity-50`}>
          {loading ? "Redirecting to secure checkout…" : "Pay online — US$625 (K2,500)"}
        </button>
        {error && <p className="mt-2 text-sm text-[#CE1126]">{error}</p>}
        <p className="mt-2 text-xs text-zinc-500">Secure payment by Stripe. One-time fee for permanent access.</p>
      </div>
    );
  }

  // Already has full access.
  if (me.paid) {
    return (
      <Link href="/open" className={`${btn} inline-block bg-[#15803d] text-white hover:bg-[#15803d]/90`}>
        ✓ You have full access — enter
      </Link>
    );
  }

  // Guest or logged out → need an account first.
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/register" className={`${btn} bg-[#CE1126] text-white hover:bg-[#CE1126]/90`}>
        Create an account to pay
      </Link>
      <Link href="/login" className={`${btn} border border-zinc-300 text-zinc-700 hover:bg-zinc-50`}>
        Sign in
      </Link>
    </div>
  );
}
