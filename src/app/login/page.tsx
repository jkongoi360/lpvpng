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
} from "@/components/auth/auth-shell";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.replace(next);
        router.refresh();
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j?.error || "Invalid credentials. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="PNG LPV Election Simulator 2027"
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
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
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
