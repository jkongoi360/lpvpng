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

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setNotice(
          j?.message ||
            "Check your inbox for a verification link to activate your account."
        );
      } else {
        setError(j?.error || "Could not register. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="PNG LPV Election Simulator 2027"
      footer={
        <p>
          Already have an account? <AuthLink href="/login">Sign in</AuthLink>
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
          <div>
            <label htmlFor="password" className={authLabelClass}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authFieldClass}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label htmlFor="confirm" className={authLabelClass}>
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={authFieldClass}
              placeholder="Re-enter password"
            />
          </div>
          {error && <div className={authErrorClass}>{error}</div>}
          <button
            type="submit"
            disabled={loading || !email || !password || !confirm}
            className={authButtonClass}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
