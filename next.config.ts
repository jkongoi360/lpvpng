import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to this directory. Without this, turbopack walks
    // up the tree and picks an ancestor package.json, which breaks resolution
    // of tailwindcss and other deps that only live in this app's node_modules.
    root: path.resolve(__dirname),
  },
  // better-sqlite3 is a native (.node) addon; it must not be bundled by
  // Turbopack/webpack — keep it external so it's require()d at runtime.
  serverExternalPackages: ["better-sqlite3"],
  typescript: {
    ignoreBuildErrors: true,
  },
  // Voter Distribution moved to its own site. Keep old links working: a
  // specific ?electorate= goes to that electorate's map, anything else to the
  // Imbonggu map.
  async redirects() {
    return [
      {
        source: "/voter-distribution",
        has: [{ type: "query", key: "electorate", value: "(?<slug>[a-z0-9-]+)" }],
        destination: "https://smartvoterpng.com/electorate/:slug",
        permanent: true,
      },
      {
        source: "/voter-distribution/:path*",
        destination: "https://smartvoterpng.com/voter-distribution",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
