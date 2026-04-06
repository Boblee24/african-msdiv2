"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import FilterPanel from "@/components/FilterPanel";
import ApiPanel    from "@/components/ApiPanel";
import type { DataPoint, CsbSubmission } from "@/lib/db";
import { useMapTheme } from "@/hooks/useMapTheme";

const MapClient = dynamic(() => import("@/components/MapClient"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-ocean-deep">
      <div className="w-10 h-10 rounded-full border-2 border-teal-dim border-t-teal-bright"
        style={{ animation: "spin 1s linear infinite" }} />
      <span className="font-mono text-sm text-text-muted">Initialising African MSDI…</span>
    </div>
  ),
});

type Filters  = { country: string; confidence: string; source: string };
type Selected = { type: "dataset" | "csb"; item: DataPoint | CsbSubmission } | null;

export default function DiscoveryPortal() {
  const { mapTheme, setMapTheme } = useMapTheme();
  const [all,       setAll]       = useState<DataPoint[]>([]);
  const [subs,      setSubs]      = useState<CsbSubmission[]>([]);
  const [filtered,  setFiltered]  = useState<DataPoint[]>([]);
  const [filters,   setFilters]   = useState<Filters>({ country: "all", confidence: "all", source: "all" });
  const [selected,  setSelected]  = useState<Selected>(null);
  const [adminView, setAdminView] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/datasets")
      .then((r) => r.json())
      .then((d) => { setAll(d.datasets ?? []); setSubs(d.submissions ?? []); setFiltered(d.datasets ?? []); })
      .catch(() => setError("Cannot connect to database. Add DATABASE_URL to .env.local then run: npm run seed"));
  }, []);

  useEffect(() => {
    let r = [...all];
    if (filters.country    !== "all") r = r.filter((d) => d.node_code        === filters.country);
    if (filters.confidence !== "all") r = r.filter((d) => d.confidence_level === filters.confidence);
    if (filters.source     !== "all") r = r.filter((d) => d.data_source      === filters.source);
    setFiltered(r);
  }, [filters, all]);

  const handleClick = useCallback((data: Selected) => setSelected(data), []);

  const stats = {
    nigeria: all.filter((d) => d.node_code === "NG").length,
    kenya:   all.filter((d) => d.node_code === "KE").length,
    sa:      all.filter((d) => d.node_code === "ZA").length,
    csb:     subs.filter((s) => s.validation_status === "validated").length,
  };

  return (
    <div className="relative w-full h-full overflow-hidden">

      {/* Error banner */}
      {error && (
        <div className="absolute top-0 inset-x-0 z-50 px-4 py-2.5 font-mono text-xs"
          style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", borderTop: "none", color: "#fca5a5" }}>
          ⚠ {error}
        </div>
      )}

      {/* Leaflet map — full bleed background */}
      <MapClient
        datasets={filtered}
        submissions={subs}
        onPointClick={handleClick}
        adminView={adminView}
        mapTheme={mapTheme}
      />

      {/* Filter + legend + toggle */}
      <FilterPanel
        filters={filters}
        onChange={setFilters}
        stats={stats}
        adminView={adminView}
        onAdminToggle={() => setAdminView((v) => !v)}
        mapTheme={mapTheme}
        onMapThemeChange={setMapTheme}
      />

      {/* Centre title card */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] text-center pointer-events-none px-5 py-2.5 rounded-xl"
        style={{ background: "rgba(6,13,26,0.88)", border: "1px solid rgba(14,165,233,0.35)", backdropFilter: "blur(12px)" }}>
        <p className="font-display text-lg font-bold text-text-primary">
          Federated African Marine Spatial Data Infrastructure
        </p>
        <p className="label-mono text-text-muted mt-0.5">
          DISCOVERY PORTAL · IHO S-100 COMPLIANT · 3 NATIONAL NODES
        </p>
      </div>

      {/* Bottom hint */}
      {!selected && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[400] pointer-events-none px-4 py-1.5 rounded-full text-xs text-text-muted whitespace-nowrap"
          style={{ background: "rgba(6,13,26,0.85)", border: "1px solid rgba(14,165,233,0.15)", backdropFilter: "blur(8px)" }}>
          Click any marker to inspect · Use filters to explore nodes
        </div>
      )}

      {/* S-100 API panel */}
      <div className="absolute inset-y-0 right-0 overflow-hidden transition-[width] duration-300"
        style={{ width: selected ? "380px" : "0", zIndex: 450 }}>
        <ApiPanel selected={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  );
}
