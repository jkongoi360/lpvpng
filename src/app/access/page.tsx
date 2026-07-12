import Link from "next/link";

export const metadata = {
  title: "Full Access — Smart Electorates",
  description: "Guest access is free for 1 hour. Full access to Smart Electorates requires a one-time fee.",
};

const ADMIN_EMAIL = "jkongoi360@gmail.com";

export default function AccessPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#FCD116]/20 px-3 py-1 text-xs font-semibold text-zinc-800">
          Full access
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
          Get complete access to Smart Electorates
        </h1>
        <p className="mt-4 text-zinc-600">
          Guest access is <strong>free for 1 hour</strong> and is view-only. For
          complete, ongoing access to the full platform — all 89 Open and 22
          Regional electorates, ward-by-ward simulations, voter-distribution
          maps and Governors — a one-time fee applies.
        </p>

        <div className="mt-6 rounded-xl border border-[#CE1126]/20 bg-[#CE1126]/5 p-6 text-center">
          <div className="text-sm font-medium text-zinc-500">One-time fee</div>
          <div className="mt-1 text-4xl font-extrabold text-[#CE1126]">K2,500</div>
          <div className="mt-1 text-sm text-zinc-500">for complete access</div>
        </div>

        <div className="mt-6 space-y-3 text-sm text-zinc-700">
          <p className="font-semibold text-zinc-900">How to get full access</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Create an account (email + password), or contact us below.</li>
            <li>Arrange payment of K2,500 with our team.</li>
            <li>Your account is upgraded to complete, ongoing access.</li>
          </ol>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={`mailto:${ADMIN_EMAIL}?subject=Full%20access%20to%20Smart%20Electorates%20(K2500)`}
            className="rounded-lg bg-[#CE1126] px-6 py-3 font-semibold text-white hover:bg-[#CE1126]/90"
          >
            Contact us to pay
          </a>
          <Link
            href="/register"
            className="rounded-lg border border-zinc-300 px-6 py-3 font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Create an account
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-300 px-6 py-3 font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
