"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { MAP_THEME_OPTIONS, type MapThemeId } from "@/lib/mapThemes";

type Filters = { country: string; confidence: string; source: string };
type Props = {
  filters: Filters;
  onChange: (f: Filters) => void;
  stats: { nigeria: number; kenya: number; sa: number; csb: number; csbFlagged: number };
  adminView: boolean;
  onAdminToggle: () => void;
  mapTheme: MapThemeId;
  onMapThemeChange: (theme: MapThemeId) => void;
};

type SectionKey = "legend" | "mode" | "stats";

export default function FilterPanel({
  filters,
  onChange,
  stats,
  adminView,
  onAdminToggle,
  mapTheme,
  onMapThemeChange,
}: Props) {
  const set = (k: keyof Filters, v: string) => onChange({ ...filters, [k]: v });
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);
  const isOpen = (key: SectionKey) => openSection === key;
  const toggle = (key: SectionKey) => {
    setOpenSection((current) => (current === key ? null : key));
  };

  return (
    <div className="absolute top-3 left-3 z-500 w-56 flex flex-col gap-2">
      <div className="glass-dark overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-[rgba(14,165,233,0.15)]">
          <span className="label-mono text-teal-bright">Filter Datasets</span>
        </div>
        <div className="p-3 flex flex-col gap-3">
          <Select label="Map theme" value={mapTheme} onChange={(v) => onMapThemeChange(v as MapThemeId)}
            options={MAP_THEME_OPTIONS}
          />
          <Select label="Country node" value={filters.country} onChange={(v) => set("country", v)}
            options={[
              { value: "all", label: "All nodes" },
              { value: "NG", label: "Nigeria (NHA)" },
              { value: "KE", label: "Kenya (KMA)" },
              { value: "ZA", label: "South Africa (SANHO)" },
            ]}
          />
          <Select label="Confidence" value={filters.confidence} onChange={(v) => set("confidence", v)}
            options={[
              { value: "all", label: "All levels" },
              { value: "high", label: "High (official)" },
            ]}
          />
          <Select label="Data source" value={filters.source} onChange={(v) => set("source", v)}
            options={[
              { value: "all", label: "All sources" },
              { value: "official_survey", label: "Official survey" },
              { value: "crowdsourced_bathymetry", label: "VOO Edge-Node" },
            ]}
          />
        </div>
      </div>

      <Accordion
        title="Legend"
        open={isOpen("legend")}
        onToggle={() => toggle("legend")}
      >
        <div className="p-3.5 flex flex-col gap-1.5">
          <LegendDot color="#22c55e" label="Nigeria / NHA" count={stats.nigeria} />
          <LegendDot color="#60a5fa" label="Kenya / KMA" count={stats.kenya} />
          <LegendDot color="#f87171" label="South Africa / SANHO" count={stats.sa} />
          <div className="h-px bg-[rgba(14,165,233,0.15)] my-1" />
          <LegendDot color="#fb923c" label="VOO - Validated" count={stats.csb} small />
          <LegendDot color="#94a3b8" label="VOO - Flagged" count={stats.csbFlagged} small />
        </div>
      </Accordion>

      <Accordion
        title={adminView ? "Navy / Military" : "Public / Commercial"}
        open={isOpen("mode")}
        onToggle={() => toggle("mode")}
        shellClassName="rounded-xl transition-all duration-300 backdrop-blur-md overflow-hidden"
        shellStyle={{
          background: adminView ? "rgba(239,68,68,0.07)" : "rgba(6,13,26,0.93)",
          border: `1px solid ${adminView ? "rgba(239,68,68,0.5)" : "rgba(14,165,233,0.18)"}`,
        }}
        headerRight={<Toggle checked={adminView} onChange={onAdminToggle} danger={adminView} />}
      >
        <div className="px-3.5 pb-3.5">
          <p className={`text-[11px] leading-relaxed border-t pt-2 ${adminView ? "text-[#fca5a5]" : "text-text-muted"}`}
            style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            {adminView
              ? <><strong className="text-node-sa">High-res:</strong> precise 3 d.p. - dense clusters - full depth</>
              : <><strong className="text-text-secondary">Decimated:</strong> rounded 1 d.p. - sparse - safety layer only</>}
          </p>

          {adminView && (
            <div className="mt-2 px-2 py-0.5 rounded font-mono text-[10px] text-node-sa tracking-[0.05em]"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>
              RESTRICTED - NHO AUTH REQUIRED
            </div>
          )}
        </div>
      </Accordion>

      <Accordion
        title="Stats"
        open={isOpen("stats")}
        onToggle={() => toggle("stats")}
      >
        <div className="p-3">
          <div className="flex justify-around">
            <Stat label="Nodes" value="3" color="text-teal-bright" />
            <Stat label="Points" value={String(stats.nigeria + stats.kenya + stats.sa)} color="text-text-primary" />
            <Stat label="VOO" value={String(stats.csb)} color="text-csb-orange" />
          </div>
        </div>
      </Accordion>
    </div>
  );
}

function Accordion({
  title,
  open,
  onToggle,
  children,
  headerRight,
  accent,
  shellClassName,
  shellStyle,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  headerRight?: ReactNode;
  accent?: boolean;
  shellClassName?: string;
  shellStyle?: CSSProperties;
}) {
  return (
    <div className={shellClassName ?? "glass-dark overflow-hidden"} style={shellStyle}>
      <div className="px-3.5 py-2.5 border-b border-[rgba(14,165,233,0.15)] flex items-center gap-2">
        <button type="button" onClick={onToggle}
          className="flex items-center gap-2 flex-1 text-left cursor-pointer">
          <span className={`label-mono ${accent ? "text-teal-bright" : ""}`}>{title}</span>
          <span className="text-[10px] text-text-muted">{open ? "-" : "+"}</span>
        </button>
        {headerRight}
      </div>
      {open ? children : null}
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-[11px] text-text-muted block mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md px-2 py-1.5 text-xs text-text-primary cursor-pointer outline-none"
        style={{ background: "rgba(15,32,64,0.85)", border: "1px solid rgba(14,165,233,0.18)" }}>
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: "#0a1628" }}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function LegendDot({ color, label, count, small }: { color: string; label: string; count: number | null; small?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-full shrink-0 ${small ? "w-2 h-2" : "w-2.5 h-2.5"}`}
        style={{ background: color, boxShadow: `0 0 5px ${color}66` }} />
      <span className="text-[12px] font-medium text-slate-100 flex-1">{label}</span>
      {count !== null && (
        <span className="text-[10px] font-mono font-semibold text-slate-100 px-1.5 py-0.5 rounded"
          style={{ background: "rgba(15,23,42,0.78)", border: "1px solid rgba(148,163,184,0.28)" }}>{count}</span>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, danger }: { checked: boolean; onChange: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onChange} className="relative w-9 h-5 rounded-full border-none cursor-pointer shrink-0 transition-all duration-200"
      style={{
        background: checked
          ? danger
            ? "linear-gradient(90deg,#b91c1c,#ef4444)"
            : "linear-gradient(90deg,#0891b2,#0ea5e9)"
          : "rgba(255,255,255,0.1)",
      }}>
      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
        style={{ left: checked ? "18px" : "2px" }} />
    </button>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-lg font-mono font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-text-muted tracking-wider">{label}</div>
    </div>
  );
}
