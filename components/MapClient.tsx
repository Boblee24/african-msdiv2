"use client";

import { useEffect, useRef } from "react";
import type { DataPoint, CsbSubmission } from "@/lib/db";

type MapProps = {
  datasets: DataPoint[];
  submissions: CsbSubmission[];
  onPointClick: (data: { type: "dataset" | "csb"; item: DataPoint | CsbSubmission }) => void;
  adminView: boolean;
};

const NODE_COLOURS: Record<string, string> = {
  NG: "#22c55e",
  KE: "#60a5fa",
  ZA: "#f87171",
};
const CSB_COLOURS: Record<string, string> = {
  validated: "#fb923c",
  flagged:   "#94a3b8",
  rejected:  "#6b7280",
};

function svgMarker(color: string, size: number, ring: boolean): string {
  const s = size * 3;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 30 30">
    ${ring ? `<circle cx="15" cy="15" r="13" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="1" stroke-opacity="0.5"/>` : ""}
    <circle cx="15" cy="15" r="7" fill="${color}" fill-opacity="0.92" stroke="white" stroke-width="0.8" stroke-opacity="0.3"/>
    <circle cx="15" cy="15" r="3" fill="white" fill-opacity="0.55"/>
  </svg>`;
}

export default function MapClient({ datasets, submissions, onPointClick, adminView }: MapProps) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const leafletRef     = useRef<import("leaflet").Map | null>(null);
  // Prevents double-init from React StrictMode running effects twice
  const initializedRef = useRef(false);
  const zoomHostRef    = useRef<HTMLDivElement | null>(null);

  // ── Initial map creation (runs once) ──────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    let mounted = true; // guard against async import resolving after unmount
    let cleanupZoomDrag: (() => void) | null = null;

    import("leaflet").then((L) => {
      if (!mounted || !containerRef.current || leafletRef.current) return;

      // Draggable host for zoom control (so it can be moved anywhere).
      const zoomHost = document.createElement("div");
      zoomHost.className = "leaflet-zoom-draggable";
      containerRef.current.appendChild(zoomHost);
      zoomHostRef.current = zoomHost;

      // Patch default icon paths (webpack asset issue)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current, {
        center:           [2, 22],
        zoom:             4,
        zoomControl:      false,
        attributionControl: true,
        minZoom:          2,
        maxZoom:          17,
      });

      const zoom = L.control.zoom({ position: "topleft" });
      zoom.addTo(map);
      const zoomEl = zoom.getContainer();
      if (zoomEl) {
        // Detach from Leaflet corner container and mount in our draggable host.
        zoomHost.appendChild(zoomEl);
        cleanupZoomDrag = makeDraggable(zoomHost, "african_msdi_zoom_control_pos");
      }

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a> | African MSDI',
        maxZoom: 19,
      }).addTo(map);

      leafletRef.current = map;
    });

    return () => {
      mounted = false;
      initializedRef.current = false;
      cleanupZoomDrag?.();
      cleanupZoomDrag = null;
      if (zoomHostRef.current) {
        zoomHostRef.current.remove();
        zoomHostRef.current = null;
      }
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, []);

  // ── Re-render markers whenever data or view mode changes ──────────────────
  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;

    import("leaflet").then((L) => {
      if (!leafletRef.current) return;

      // Remove all existing marker layers
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
      });

      // DATA DECIMATION:
      // Public  → every 3rd point, depth to 1 d.p., coordinates to 2 d.p.
      // Military → all points, depth to 3 d.p., coordinates to 5 d.p.
      const pointsToShow = adminView
        ? datasets
        : datasets.filter((_, i) => i % 3 === 0);

      pointsToShow.forEach((point) => {
        const color = NODE_COLOURS[point.node_code] ?? "#94a3b8";
        const size  = adminView ? 12 : 9;
        const icon  = L.divIcon({
          html:       svgMarker(color, size, adminView),
          className:  "",
          iconSize:   [size * 3, size * 3],
          iconAnchor: [size * 1.5, size * 1.5],
          popupAnchor:[0, -(size * 1.5)],
        });
        const marker = L.marker([Number(point.lat), Number(point.lon)], { icon });
        marker.bindPopup(officialPopup(point, adminView), { maxWidth: 300 });
        marker.on("click", () => onPointClick({ type: "dataset", item: point }));
        marker.addTo(map);
      });

      submissions.forEach((sub) => {
        if (sub.validation_status === "rejected") return;
        const color = CSB_COLOURS[sub.validation_status] ?? "#94a3b8";
        const icon  = L.divIcon({
          html:       svgMarker(color, 7, false),
          className:  "",
          iconSize:   [21, 21],
          iconAnchor: [10, 10],
          popupAnchor:[0, -10],
        });
        const marker = L.marker([Number(sub.lat), Number(sub.lon)], { icon });
        marker.bindPopup(csbPopup(sub), { maxWidth: 280 });
        marker.on("click", () => onPointClick({ type: "csb", item: sub }));
        marker.addTo(map);
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasets, submissions, adminView]);

  return <div ref={containerRef} className="w-full h-full" />;
}

function makeDraggable(el: HTMLDivElement, storageKey: string) {
  const existing = safeParsePos(localStorage.getItem(storageKey));
  if (existing) {
    el.style.left = `${existing.x}px`;
    el.style.top = `${existing.y}px`;
  } else {
    // Default: top-right-ish without overlapping the title card.
    el.style.left = "unset";
    el.style.right = "12px";
    el.style.top = "70px";
  }

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  const onPointerDown = (e: PointerEvent) => {
    // Only allow drag via right mouse button? No — keep simple: any pointer.
    dragging = true;
    el.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    // Convert from right/top to explicit left/top for dragging.
    el.style.right = "unset";
    el.style.left = `${startLeft}px`;
    el.style.top = `${startTop}px`;
    e.stopPropagation();
    e.preventDefault();
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const x = Math.max(0, startLeft + dx);
    const y = Math.max(0, startTop + dy);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    e.stopPropagation();
    e.preventDefault();
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    try {
      const x = Math.round(parseFloat(el.style.left || "0"));
      const y = Math.round(parseFloat(el.style.top || "0"));
      localStorage.setItem(storageKey, JSON.stringify({ x, y }));
    } catch {
      // ignore
    }
    e.stopPropagation();
    e.preventDefault();
  };

  el.addEventListener("pointerdown", onPointerDown, { passive: false });
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp, { passive: false });

  return () => {
    el.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };
}

function safeParsePos(raw: string | null): { x: number; y: number } | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { x?: unknown; y?: unknown };
    if (typeof v.x === "number" && typeof v.y === "number" && Number.isFinite(v.x) && Number.isFinite(v.y)) {
      return { x: v.x, y: v.y };
    }
    return null;
  } catch {
    return null;
  }
}

// ── Popup HTML helpers (plain strings — Tailwind can't reach these) ──────────

function officialPopup(p: DataPoint, isAdmin: boolean): string {
  const flags: Record<string, string> = { NG: "🇳🇬", KE: "🇰🇪", ZA: "🇿🇦" };
  const flag  = flags[p.node_code] ?? "🌍";
  const color = NODE_COLOURS[p.node_code] ?? "#94a3b8";
  const depth = isAdmin
    ? `${Number(p.depth_m).toFixed(3)} m`
    : `${Number(p.depth_m).toFixed(1)} m`;
  const coords = isAdmin
    ? `${Number(p.lat).toFixed(5)}, ${Number(p.lon).toFixed(5)}`
    : `${Number(p.lat).toFixed(2)}, ${Number(p.lon).toFixed(2)} (decimated)`;

  return `<div style="font-family:'DM Sans',sans-serif;font-size:13px">
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.1)">
      <span style="font-size:18px">${flag}</span>
      <div>
        <div style="font-weight:600;color:#e2e8f0">${p.node_country}</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:${color}">${p.dataset_id}</div>
      </div>
    </div>
    <div style="margin-bottom:8px;padding:3px 8px;background:${isAdmin ? "rgba(239,68,68,0.12)" : "rgba(148,163,184,0.08)"};border:1px solid ${isAdmin ? "rgba(239,68,68,0.35)" : "rgba(148,163,184,0.2)"};border-radius:4px;font-size:10px;font-family:'JetBrains Mono',monospace;color:${isAdmin ? "#f87171" : "#94a3b8"}">
      ${isAdmin ? "🪖 MILITARY VIEW · FULL RESOLUTION" : "🌐 PUBLIC VIEW · DECIMATED DATA"}
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <tr><td style="color:#94a3b8;padding:2px 0">Custodian</td><td style="color:#e2e8f0;text-align:right;padding-left:8px">${p.custodian}</td></tr>
      <tr><td style="color:#94a3b8;padding:2px 0">Survey date</td><td style="color:#e2e8f0;text-align:right;padding-left:8px">${p.survey_date ?? "Unknown"}</td></tr>
      <tr><td style="color:#94a3b8;padding:2px 0">Depth</td><td style="color:${isAdmin ? "#0ea5e9" : "#e2e8f0"};text-align:right;padding-left:8px;font-family:'JetBrains Mono',monospace;font-weight:${isAdmin ? "700" : "400"}">${depth}</td></tr>
      <tr><td style="color:#94a3b8;padding:2px 0">Coords</td><td style="color:${isAdmin ? "#7dd3fc" : "#475569"};text-align:right;padding-left:8px;font-family:'JetBrains Mono',monospace;font-size:11px">${coords}</td></tr>
    </table>
    <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:#94a3b8">
      ${isAdmin ? "🔓 Air-gapped Sovereign Cloud · Full resolution" : "🔒 Toggle Military View for full data"}
    </div>
  </div>`;
}

function csbPopup(sub: CsbSubmission): string {
  const cfg: Record<string, { label: string; c: string; bg: string }> = {
    validated: { label: "VALIDATED", c: "#fb923c", bg: "rgba(251,146,60,0.15)" },
    flagged:   { label: "FLAGGED",   c: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
    rejected:  { label: "REJECTED",  c: "#6b7280", bg: "rgba(107,114,128,0.15)" },
  };
  const s = cfg[sub.validation_status] ?? cfg.flagged;
  return `<div style="font-family:'DM Sans',sans-serif;font-size:13px">
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.1)">
      <span style="font-size:18px">🛳</span>
      <div>
        <div style="font-weight:600;color:#e2e8f0">VOO Edge-Node Data</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#fb923c">CSB-${sub.id} · ${sub.vessel_id}</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <tr><td style="color:#94a3b8;padding:2px 0">ML Status</td><td style="text-align:right;padding-left:8px"><span style="background:${s.bg};color:${s.c};padding:1px 6px;border-radius:4px;font-size:11px;font-weight:600">${s.label}</span></td></tr>
      <tr><td style="color:#94a3b8;padding:2px 0">Depth</td><td style="color:#0ea5e9;text-align:right;padding-left:8px;font-family:'JetBrains Mono',monospace;font-weight:700">${Number(sub.depth_m).toFixed(1)} m</td></tr>
      <tr><td style="color:#94a3b8;padding:2px 0">Vessel</td><td style="color:#e2e8f0;text-align:right;padding-left:8px">${sub.vessel_id}</td></tr>
    </table>
    <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:#94a3b8;font-style:italic">
      ML QC: ${sub.validation_reason?.slice(0, 110) ?? ""}...
    </div>
  </div>`;
}

