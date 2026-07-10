"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AuthShell,
  AuthLink,
  authErrorClass,
  authNoticeClass,
} from "@/components/auth/auth-shell";

function VerifyInner() {
  const token = useSearchParams().get("token") || "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard React strict-mode double-invoke (token is single-use)
    ran.current = true;
    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing its token.");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const j = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus("ok");
        } else {
          setStatus("error");
          setMessage(j?.error || "Verification failed.");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    })();
  }, [token]);

  return (
    <AuthShell
      title="Email verification"
      footer={<AuthLink href="/login">Go to sign in</AuthLink>}
    >
      {status === "loading" && (
        <div className={authNoticeClass}>Verifying your email…</div>
      )}
      {status === "ok" && (
        <div className={authNoticeClass}>
          Your email is verified. You can now sign in.
        </div>
      )}
      {status === "error" && (
        <div className={authErrorClass}>
          {message}{" "}
          <AuthLink href="/register">Register again</AuthLink> to get a new link.
        </div>
      )}
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthShell title="Email verification">{null}</AuthShell>}>
      <VerifyInner />
    </Suspense>
  );
}
