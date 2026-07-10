// Precompute a lightweight index of each electorate's boundary: map center
// (lat,lng) + a fitted default zoom. Keeps the 14MB of GeoJSON OUT of the JS
// bundle — the polygons themselves are served as static files from
// public/boundaries/<slug>.json and fetched client-side on demand.
//
// Run: node scripts/generate-boundary-index.mjs
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BOUNDARY_DIR = path.join(root, "public", "boundaries");
const OUT = path.join(root, "src", "data", "maps", "boundary-index.json");

function boundsOf(fc) {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  let seen = false;
  for (const feat of fc.features ?? []) {
    const g = feat.geometry;
    if (!g) continue;
    const polys =
      g.type === "Polygon" ? [g.coordinates]
      : g.type === "MultiPolygon" ? g.coordinates
      : null;
    if (!polys) continue;
    for (const poly of polys)
      for (const ring of poly)
        for (const [lng, lat] of ring) {
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          seen = true;
        }
  }
  return seen ? { minLat, maxLat, minLng, maxLng } : null;
}

// Fit zoom to the larger span of the district's bounding box.
function zoomFor(b) {
  const span = Math.max(b.maxLat - b.minLat, b.maxLng - b.minLng) || 0.1;
  const z = Math.round(Math.log2(360 / span)) - 1;
  return Math.max(7, Math.min(12, z));
}

const files = (await readdir(BOUNDARY_DIR))
  .filter((f) => f.endsWith(".json") && !f.startsWith("_"));

const index = {};
let skipped = 0;
for (const f of files.sort()) {
  const slug = f.replace(/\.json$/, "");
  try {
    const fc = JSON.parse(await readFile(path.join(BOUNDARY_DIR, f), "utf8"));
    const b = boundsOf(fc);
    if (!b) { skipped++; continue; }
    index[slug] = {
      center: [(b.minLat + b.maxLat) / 2, (b.minLng + b.maxLng) / 2],
      zoom: zoomFor(b),
    };
  } catch {
    skipped++;
  }
}

await writeFile(OUT, JSON.stringify(index, null, 2) + "\n", "utf8");
console.log(
  `Wrote ${Object.keys(index).length} entries to ${path.relative(root, OUT)} (${skipped} skipped)`
);
