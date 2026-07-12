"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// After Stripe Checkout, access is granted by the webhook (source of truth).
// We poll /api/auth/me until `paid` flips true, then show the entry link.
export default function PaymentSuccessPage() {
  const [paid, setPaid] = useState(false);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (paid) return;
    const t = setInterval(async () => {
      setTries((n) => n + 1);
      try {
        const r = await fetch("/api/auth/me");
        const j = await r.json().catch(() => ({}));
        if (j?.paid) setPaid(true);
      } catch {
        /* keep polling */
      }
    }, 2500);
    return () => clearInterval(t);
  }, [paid]);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        {paid ? (
          <>
            <div className="text-4xl">🎉</div>
            <h1 className="mt-3 text-2xl font-bold text-zinc-900">Payment complete</h1>
            <p className="mt-2 text-zinc-600">
              Thank you — your account now has complete access to Smart Electorates.
            </p>
            <Link
              href="/open"
              className="mt-6 inline-block rounded-lg bg-[#15803d] px-6 py-3 font-semibold text-white hover:bg-[#15803d]/90"
            >
              Enter the platform
            </Link>
          </>
        ) : (
          <>
            <div className="text-4xl">⏳</div>
            <h1 className="mt-3 text-2xl font-bold text-zinc-900">Activating your access…</h1>
            <p className="mt-2 text-zinc-600">
              Your payment is being confirmed. This usually takes a few seconds.
            </p>
            {tries > 8 && (
              <p className="mt-4 text-sm text-zinc-500">
                Taking longer than expected? Refresh in a moment, or{" "}
                <Link href="/access" className="text-[#CE1126] underline">
                  return to the access page
                </Link>
                .
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
