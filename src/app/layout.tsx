import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PNG LPV Election Simulator 2027",
  description:
    "Simulate Papua New Guinea's Limited Preferential Voting system for the 2027 general elections",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b bg-png-black text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="h-8 w-3 bg-png-red" />
                  <div className="h-8 w-3 bg-png-gold" />
                </div>
                <div>
                  <span className="text-lg font-bold tracking-tight">
                    PNG LPV Simulator
                  </span>
                  <span className="ml-2 text-xs text-zinc-400">2027</span>
                </div>
              </Link>
              <nav className="flex items-center gap-6 text-sm">
                <Link
                  href="/regional"
                  className="text-zinc-300 hover:text-png-gold transition-colors"
                >
                  Regional
                </Link>
                <Link
                  href="/open"
                  className="text-zinc-300 hover:text-png-gold transition-colors"
                >
                  Open Seats
                </Link>
                <Link
                  href="/voter-distribution"
                  className="text-zinc-300 hover:text-png-gold transition-colors"
                >
                  Voter Distribution
                </Link>
                <Link
                  href="/about"
                  className="text-zinc-300 hover:text-png-gold transition-colors"
                >
                  How LPV Works
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t bg-zinc-50 py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-zinc-500">
            PNG Limited Preferential Voting Simulator &mdash; Educational Tool
            for the 2027 General Elections
          </div>
        </footer>
      </body>
    </html>
  );
}
