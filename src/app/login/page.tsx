"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("Invalid password. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Mt Giluwe Background with slow zoom */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/mt-giluwe.jpg')",
          animation: "slowZoom 30s ease-in-out infinite alternate",
        }}
      />

      {/* 70% transparency overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* PNG Emblem */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-3 h-8 bg-[#CE1126] rounded-sm" />
              <div className="w-3 h-8 bg-[#000000] rounded-sm" />
              <div className="w-3 h-8 bg-[#FCD116] rounded-sm" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Smart Electorates
            </h1>
            <p className="text-sm text-white/60 mt-2">
              PNG LPV Election Simulator 2027
            </p>
            <p className="text-xs text-white/40 mt-1">
              Mt Giluwe, Southern Highlands
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white/80 mb-2"
              >
                Access Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FCD116]/50 focus:border-[#FCD116]/50 transition-all"
                placeholder="Enter password"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="text-sm text-[#CE1126] bg-[#CE1126]/10 border border-[#CE1126]/30 rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 bg-[#CE1126] hover:bg-[#CE1126]/90 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FCD116]/50"
            >
              {loading ? "Authenticating..." : "Enter Site"}
            </button>
          </form>

          <p className="text-center text-xs text-white/30 mt-6">
            This site is password-protected for review purposes.
          </p>
        </div>
      </div>

      {/* Zoom animation keyframes */}
      <style>{`
        @keyframes slowZoom {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.15);
          }
        }
      `}</style>
    </div>
  );
}
