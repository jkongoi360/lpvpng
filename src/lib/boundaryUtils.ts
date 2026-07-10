import type { FeatureCollection, Geometry } from "geojson";

// Bounding-box-centre — robust against ring count and self-intersecting
// polygons; gives the visual centre of the drawn outline.
export function boundaryCenter(
  fc: FeatureCollection<Geometry> | null | undefined
): [number, number] | null {
  if (!fc || !fc.features?.length) return null;
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;
  let seen = false;
  for (const feat of fc.features) {
    const g = feat.geometry;
    if (!g) continue;
    const polys =
      g.type === "Polygon"
        ? [g.coordinates]
        : g.type === "MultiPolygon"
        ? g.coordinates
        : null;
    if (!polys) continue;
    for (const poly of polys) {
      for (const ring of poly) {
        for (const point of ring) {
          const [lng, lat] = point as [number, number];
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          seen = true;
        }
      }
    }
  }
  if (!seen) return null;
  return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
}

export function boundaryBounds(
  fc: FeatureCollection<Geometry> | null | undefined
): [[number, number], [number, number]] | null {
  if (!fc || !fc.features?.length) return null;
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;
  let seen = false;
  for (const feat of fc.features) {
    const g = feat.geometry;
    if (!g) continue;
    const polys =
      g.type === "Polygon"
        ? [g.coordinates]
        : g.type === "MultiPolygon"
        ? g.coordinates
        : null;
    if (!polys) continue;
    for (const poly of polys) {
      for (const ring of poly) {
        for (const point of ring) {
          const [lng, lat] = point as [number, number];
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          seen = true;
        }
      }
    }
  }
  if (!seen) return null;
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}
