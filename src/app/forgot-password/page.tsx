"use client";

import { useState } from "react";
import {
  AuthShell,
  AuthLink,
  authFieldClass,
  authLabelClass,
  authButtonClass,
  authErrorClass,
  authNoticeClass,
} from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setNotice(
          j?.message ||
            "If an account exists for that email, a reset link is on its way."
        );
      } else {
        setError(j?.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a reset link"
      footer={
        <p>
          Remembered it? <AuthLink href="/login">Back to sign in</AuthLink>
        </p>
      }
    >
      {notice ? (
        <div className={authNoticeClass}>{notice}</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
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
          {error && <div className={authErrorClass}>{error}</div>}
          <button
            type="submit"
            disabled={loading || !email}
            className={authButtonClass}
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
