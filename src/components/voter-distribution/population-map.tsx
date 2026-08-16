"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  GeoJSON,
  LayersControl,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { FeatureCollection, Geometry } from "geojson";

import type { ElectorateMapConfig, LatLng } from "@/data/maps/registry";
import type { Ward as WardForMap } from "./types";

const STORAGE_KEY_PREFIX = "voter-distribution-overrides:";

const fmt = (n: number) => n.toLocaleString("en-US");

// "Card" pin: colored number badge + ward name + voter count, with a short
// stem pointing to the ward's geo location.
const CARD_W = 152;
const CARD_H = 44;
const STEM_H = 8;
const ICON_W = CARD_W;
const ICON_H = CARD_H + STEM_H;

function splitWardLabel(name: string, fallbackNum: string): {
  num: string;
  rest: string;
} {
  const m = name.match(/^\s*(\d+)\s*-\s*(.+?)\s*$/);
  if (m) return { num: m[1], rest: m[2] };
  return { num: fallbackNum, rest: name };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function makeWardIcon(
  color: string,
  num: string,
  name: string,
  voters: number,
  selected: boolean,
): L.DivIcon {
  const cls = selected ? "ward-pin selected" : "ward-pin";
  const safeName = escapeHtml(name);
  const safeNum = escapeHtml(num);
  const voterText = voters.toLocaleString("en-US");
  return L.divIcon({
    className: "ward-marker",
    iconSize: [ICON_W, ICON_H],
    iconAnchor: [ICON_W / 2, ICON_H],
    popupAnchor: [0, -ICON_H + 6],
    html: `<div class="${cls}">
      <div class="ward-pin-card" style="border-color:${color}">
        <div class="ward-pin-num" style="background:${color}">${safeNum}</div>
        <div class="ward-pin-text">
          <div class="ward-pin-name">${safeName}</div>
          <div class="ward-pin-voters">${voterText} voters</div>
        </div>
      </div>
      <div class="ward-pin-stem-wrap">
        <div class="ward-pin-stem" style="background:${color}"></div>
      </div>
    </div>`,
  });
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SelectionController({
  selectedWardId,
  positionFor,
  markersRef,
}: {
  selectedWardId: string | null;
  positionFor: (id: string) => LatLng | null;
  markersRef: React.MutableRefObject<Map<string, L.Marker>>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!selectedWardId) return;
    const pos = positionFor(selectedWardId);
    if (!pos) return;
    map.flyTo(pos, Math.max(map.getZoom(), 14), { duration: 0.6 });
    const m = markersRef.current.get(selectedWardId);
    if (m) {
      setTimeout(() => m.openPopup(), 350);
    }
  }, [selectedWardId, map, positionFor, markersRef]);
  return null;
}

// Resets the map view whenever the electorate changes — without this Leaflet
// keeps the previous center/zoom when wards swap underneath it.
function ElectorateRecenter({
  electorateSlug,
  center,
  zoom,
}: {
  electorateSlug: string;
  center: LatLng;
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.4 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electorateSlug]);
  return null;
}

export type PopulationMapProps = {
  electorateSlug: string;
  config: ElectorateMapConfig;
  llgs: { id: string; name: string }[];
  wards: WardForMap[];
  selectedWardId: string | null;
};

export default function PopulationMap({
  electorateSlug,
  config,
  llgs,
  wards,
  selectedWardId,
}: PopulationMapProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}${electorateSlug}`;
  const [overrides, setOverrides] = useState<Record<string, LatLng>>({});
  const [loaded, setLoaded] = useState(false);

  // District boundary polygon, fetched on demand from the static file so the
  // 14MB of GeoJSON never enters the JS bundle. Cleared/reloaded per electorate.
  const [boundary, setBoundary] = useState<FeatureCollection<Geometry> | null>(
    null,
  );
  useEffect(() => {
    if (!config.hasBoundary) {
      setBoundary(null);
      return;
    }
    let cancelled = false;
    setBoundary(null);
    fetch(`/boundaries/${electorateSlug}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setBoundary(data);
      })
      .catch(() => {
        if (!cancelled) setBoundary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [electorateSlug, config.hasBoundary]);

  // Reload overrides from localStorage whenever the electorate changes.
  useEffect(() => {
    setLoaded(false);
    try {
      const raw = localStorage.getItem(storageKey);
      setOverrides(raw ? JSON.parse(raw) : {});
    } catch {
      setOverrides({});
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(storageKey, JSON.stringify(overrides));
  }, [overrides, loaded, storageKey]);

  // Server-persisted overrides (shared for all users), seeded as the baseline
  // under any local drags. Admins can push local drags to the server.
  const [serverOverrides, setServerOverrides] = useState<Record<string, LatLng>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j?.isAdmin) setIsAdmin(true);
      })
      .catch(() => {});
    fetch("/api/save-coordinates")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j?.overrides) setServerOverrides(j.overrides);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const iconCache = useRef(new Map<string, L.DivIcon>());
  // Clear the icon cache when wards swap — otherwise we'd render stale labels
  // for a different electorate's wards.
  useEffect(() => {
    iconCache.current.clear();
  }, [electorateSlug]);

  const iconFor = (
    wardId: string,
    color: string,
    num: string,
    name: string,
    voters: number,
    selected: boolean,
  ) => {
    const key = `${wardId}|${selected ? "S" : "N"}`;
    let icon = iconCache.current.get(key);
    if (!icon) {
      icon = makeWardIcon(color, num, name, voters, selected);
      iconCache.current.set(key, icon);
    }
    return icon;
  };

  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  // Drop stale marker refs when the ward set changes.
  useEffect(() => {
    markersRef.current.clear();
  }, [electorateSlug]);

  const positionFor = useMemo(() => {
    return (id: string): LatLng | null => {
      const ov = overrides[id] ?? serverOverrides[id];
      if (ov) return ov;
      const w = wards.find((x) => x.id === id);
      return w ? [w.lat, w.lng] : null;
    };
  }, [overrides, serverOverrides, wards]);

  const movedCount = useMemo(() => Object.keys(overrides).length, [overrides]);

  const handleReset = () => {
    if (movedCount === 0) return;
    if (
      confirm(`Reset ${movedCount} moved marker(s) back to default positions?`)
    ) {
      setOverrides({});
    }
  };

  const handleExport = () => {
    const payload = wards.map((w) => {
      const ov = overrides[w.id];
      return {
        id: w.id,
        name: w.name,
        llg: w.llgName,
        registeredVoters: w.registeredVoters,
        lat: ov ? ov[0] : w.lat,
        lng: ov ? ov[1] : w.lng,
        moved: !!ov,
      };
    });
    downloadJson(`${electorateSlug}-ward-coordinates.json`, payload);
  };

  // Admin-only: persist the current local drags to the server so they become
  // the shared baseline for everyone, then fold them into serverOverrides and
  // clear the local layer.
  const handleSaveToServer = async () => {
    if (movedCount === 0) return;
    setSaveState("saving");
    try {
      const res = await fetch("/api/save-coordinates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setServerOverrides((prev) => ({ ...prev, ...overrides }));
      setOverrides({});
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  };

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <MapContainer
        center={config.electorateCenter}
        zoom={config.defaultZoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <LayersControl position="topleft">
          <LayersControl.BaseLayer checked name="Google Hybrid">
            <TileLayer
              attribution="Imagery &copy; Google"
              url="https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              subdomains={["0", "1", "2", "3"]}
              maxZoom={20}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Google Satellite">
            <TileLayer
              attribution="Imagery &copy; Google"
              url="https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              subdomains={["0", "1", "2", "3"]}
              maxZoom={20}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Google Roadmap">
            <TileLayer
              attribution="&copy; Google"
              url="https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              subdomains={["0", "1", "2", "3"]}
              maxZoom={20}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Google Terrain">
            <TileLayer
              attribution="&copy; Google"
              url="https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
              subdomains={["0", "1", "2", "3"]}
              maxZoom={20}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <ElectorateRecenter
          electorateSlug={electorateSlug}
          center={config.electorateCenter}
          zoom={config.defaultZoom}
        />

        <SelectionController
          selectedWardId={selectedWardId}
          positionFor={positionFor}
          markersRef={markersRef}
        />

        {boundary && (
          <GeoJSON
            key={`${electorateSlug}-boundary`}
            data={boundary}
            style={() => ({
              color: "#dc2626",
              weight: 4,
              opacity: 0.95,
              fill: false,
              lineCap: "round",
              lineJoin: "round",
            })}
            onEachFeature={(feature, layer) => {
              const name =
                (feature.properties as { name?: string } | null)?.name ?? "District";
              layer.bindTooltip(name, {
                sticky: true,
                direction: "top",
                className: "boundary-tooltip",
              });
            }}
            interactive={false}
          />
        )}

        {llgs.map((llg) => {
          const center = config.llgCenters[llg.id];
          const color = config.llgColors[llg.id] ?? "#64748b";
          if (!center) return null;
          return (
            <CircleMarker
              key={`${electorateSlug}-${llg.id}-circle`}
              center={center}
              radius={28}
              pathOptions={{
                color,
                weight: 2,
                fillColor: color,
                fillOpacity: 0.05,
                dashArray: "4 4",
              }}
              interactive={false}
            />
          );
        })}

        {wards.map((w, i) => {
          const ov = overrides[w.id] ?? serverOverrides[w.id];
          const pos: LatLng = ov ?? [w.lat, w.lng];
          // A named ward group overrides the LLG colour so the group reads as
          // one block on the map.
          const color =
            w.groupColor ?? config.llgColors[w.llgId] ?? "#64748b";
          const isSelected = selectedWardId === w.id;
          const parts = splitWardLabel(w.name, String(i + 1));
          return (
            <Marker
              key={`${electorateSlug}-${w.id}`}
              position={pos}
              draggable
              zIndexOffset={isSelected ? 1000 : 0}
              icon={iconFor(
                w.id,
                color,
                parts.num,
                parts.rest,
                w.registeredVoters,
                isSelected,
              )}
              ref={(m) => {
                if (m) markersRef.current.set(w.id, m);
                else markersRef.current.delete(w.id);
              }}
              eventHandlers={{
                dragend: (e) => {
                  const ll = (e.target as L.Marker).getLatLng();
                  setOverrides((prev) => ({
                    ...prev,
                    [w.id]: [ll.lat, ll.lng],
                  }));
                },
              }}
            >
              <Popup>
                <div className="popup-title">{w.name}</div>
                <div className="popup-llg">{w.llgName}</div>
                <div className="popup-row">
                  <span>Registered voters</span>
                  <strong>{fmt(w.registeredVoters)}</strong>
                </div>
                <div className="popup-row">
                  <span>Lat, Lng</span>
                  <strong>
                    {pos[0].toFixed(4)}, {pos[1].toFixed(4)}
                  </strong>
                </div>
                {ov && (
                  <button
                    className="popup-btn"
                    onClick={() =>
                      setOverrides((prev) => {
                        const next = { ...prev };
                        delete next[w.id];
                        return next;
                      })
                    }
                  >
                    Reset this marker
                  </button>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="map-toolbar">
        <span className="map-toolbar-label">
          {movedCount > 0
            ? `${movedCount} moved (saved locally)`
            : "Drag any marker to reposition"}
        </span>
        <button
          className="map-toolbar-btn"
          onClick={handleExport}
          title="Download all ward coordinates as JSON"
        >
          Export JSON
        </button>
        {isAdmin && (
          <button
            className="map-toolbar-btn"
            onClick={handleSaveToServer}
            disabled={movedCount === 0 || saveState === "saving"}
            title="Persist moved markers to the server for all users (admin)"
          >
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
                ? "Saved ✓"
                : saveState === "error"
                  ? "Save failed"
                  : "Save to server"}
          </button>
        )}
        <button
          className="map-toolbar-btn"
          onClick={handleReset}
          disabled={movedCount === 0}
          title="Restore default positions"
        >
          Reset all
        </button>
      </div>
    </div>
  );
}
