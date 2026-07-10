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

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.replace("/login"), 2000);
      } else {
        setError(j?.error || "Could not reset password.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title="Reset your password">
        <div className={authErrorClass}>
          This reset link is missing its token. Request a new one from{" "}
          <AuthLink href="/forgot-password">Forgot password</AuthLink>.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      footer={<AuthLink href="/login">Back to sign in</AuthLink>}
    >
      {done ? (
        <div className={authNoticeClass}>
          Password updated. Redirecting you to sign in…
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className={authLabelClass}>
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authFieldClass}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label htmlFor="confirm" className={authLabelClass}>
              Confirm new password
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
            disabled={loading || !password || !confirm}
            className={authButtonClass}
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthShell title="Set a new password">{null}</AuthShell>}>
      <ResetForm />
    </Suspense>
  );
}
