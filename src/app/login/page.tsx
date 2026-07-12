"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AuthShell,
  AuthLink,
  authFieldClass,
  authLabelClass,
  authButtonClass,
  authErrorClass,
  authNoticeClass,
} from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";

const ERRORS: Record<string, string> = {
  google_unavailable: "Google sign-in isn't available right now.",
  google_failed: "Google sign-in failed. Please try again.",
  google_state: "Google sign-in expired. Please try again.",
  google_unverified: "Your Google email isn't verified.",
};

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/";
  const urlError = search.get("error");

  const [phase, setPhase] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(urlError ? ERRORS[urlError] || "Sign-in failed." : "");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  async function continueAsGuest() {
    setError("");
    setGuestLoading(true);
    try {
      const res = await fetch("/api/auth/guest", { method: "POST" });
      if (res.ok) {
        router.replace(next);
        router.refresh();
      } else {
        setError("Could not start a guest session. Please try again.");
        setGuestLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setGuestLoading(false);
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.otpRequired) {
        setPhase("otp");
        setNotice(`We emailed a 6-digit code to ${j.email || email}.`);
      } else {
        setError(j?.error || "Invalid credentials. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      if (res.ok) {
        router.replace(next);
        router.refresh();
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j?.error || "Invalid or expired code.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function resendCode() {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.otpRequired) {
        setNotice(`We emailed a new code to ${j.email || email}.`);
        setOtp("");
      } else {
        setError(j?.error || "Could not resend the code.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (phase === "otp") {
    return (
      <AuthShell
        title="Enter your sign-in code"
        subtitle="Two-factor verification"
        footer={
          <p>
            Wrong account?{" "}
            <button
              onClick={() => {
                setPhase("password");
                setOtp("");
                setError("");
                setNotice("");
              }}
              className="text-white/70 hover:text-[#FCD116] underline underline-offset-2"
            >
              Start over
            </button>
          </p>
        }
      >
        <form onSubmit={submitOtp} className="space-y-5">
          {notice && <div className={authNoticeClass}>{notice}</div>}
          <div>
            <label htmlFor="otp" className={authLabelClass}>
              6-digit code
            </label>
            <input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className={`${authFieldClass} tracking-[0.5em] text-center text-lg`}
              placeholder="••••••"
            />
          </div>
          {error && <div className={authErrorClass}>{error}</div>}
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className={authButtonClass}
          >
            {loading ? "Verifying…" : "Verify & sign in"}
          </button>
          <button
            type="button"
            onClick={resendCode}
            disabled={loading}
            className="w-full text-center text-sm text-white/60 hover:text-[#FCD116] transition-colors"
          >
            Didn&apos;t get it? Resend code
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="PNG Limited Preferential Voting · 2027"
      footer={
        <>
          <p>
            No account? <AuthLink href="/register">Create one</AuthLink>
          </p>
          <p>
            <AuthLink href="/forgot-password">Forgot your password?</AuthLink>
          </p>
        </>
      }
    >
      <div className="space-y-5">
        <GoogleButton next={next} />
        <form onSubmit={submitPassword} className="space-y-5">
          <div>
            <label htmlFor="email" className={authLabelClass}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authFieldClass}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className={authLabelClass}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authFieldClass}
              placeholder="Enter password"
            />
          </div>
          {error && <div className={authErrorClass}>{error}</div>}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className={authButtonClass}
          >
            {loading ? "Signing in…" : "Continue"}
          </button>
        </form>

        {/* Guest access */}
        <div className="flex items-center gap-3 text-xs text-white/40">
          <div className="h-px flex-1 bg-white/20" />
          just browsing?
          <div className="h-px flex-1 bg-white/20" />
        </div>
        <button
          type="button"
          onClick={continueAsGuest}
          disabled={guestLoading}
          className="w-full rounded-lg border border-white/30 py-3 font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          {guestLoading ? "Starting…" : "Continue as guest (1 hour, view only)"}
        </button>
        <p className="text-center text-xs text-white/50">
          Guest access is free for 1 hour.{" "}
          <AuthLink href="/access">Full access — K2,500</AuthLink>
        </p>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthShell title="Sign in">{null}</AuthShell>}>
      <LoginForm />
    </Suspense>
  );
}
