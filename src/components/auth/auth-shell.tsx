import Link from "next/link";

// Shared Mt Giluwe glassmorphism shell for all auth pages, matching the
// original login styling. Children render inside the card, below the brand.
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/mt-giluwe.jpg')",
          animation: "slowZoom 30s ease-in-out infinite alternate",
        }}
      />
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-3 h-8 bg-[#CE1126] rounded-sm" />
              <div className="w-3 h-8 bg-[#000000] rounded-sm" />
              <div className="w-3 h-8 bg-[#FCD116] rounded-sm" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              SmartVoter PNG
            </h1>
            {subtitle && (
              <p className="text-sm text-white/60 mt-2">{subtitle}</p>
            )}
          </div>

          <h2 className="text-lg font-semibold text-white/90 mb-4">{title}</h2>
          {children}
          {footer && (
            <div className="text-center text-xs text-white/50 mt-6 space-y-1">
              {footer}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slowZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}

export const authFieldClass =
  "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FCD116]/50 focus:border-[#FCD116]/50 transition-all";

export const authLabelClass =
  "block text-sm font-medium text-white/80 mb-2";

export const authButtonClass =
  "w-full py-3 bg-[#CE1126] hover:bg-[#CE1126]/90 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FCD116]/50";

export const authErrorClass =
  "text-sm text-[#CE1126] bg-[#CE1126]/10 border border-[#CE1126]/30 rounded-lg px-4 py-2.5";

export const authNoticeClass =
  "text-sm text-white/90 bg-[#FCD116]/10 border border-[#FCD116]/30 rounded-lg px-4 py-2.5";

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-white/70 hover:text-[#FCD116] underline underline-offset-2">
      {children}
    </Link>
  );
}
