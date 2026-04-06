"use client";

import { useState, useEffect } from "react";
import type { DataPoint, CsbSubmission } from "@/lib/db";

type Props = {
  selected: { type: "dataset" | "csb"; item: DataPoint | CsbSubmission } | null;
  onClose: () => void;
};

export default function ApiPanel({ selected, onClose }: Props) {
  const [apiData, setApiData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading]  = useState(false);
  const [copied, setCopied]    = useState(false);

  useEffect(() => {
    if (!selected) { setApiData(null); return; }
    (async () => {
      setLoading(true);
      setApiData(null);
      try {
        const id = selected.type === "dataset"
          ? (selected.item as DataPoint).dataset_id
          : String((selected.item as CsbSubmission).id);
        const res  = await fetch(`/api/datasets/${id}`);
        setApiData(await res.json());
      } catch {
        setApiData({ error: "Failed to fetch API response" });
      } finally {
        setLoading(false);
      }
    })();
  }, [selected]);

  function copy() {
    if (!apiData) return;
    navigator.clipboard.writeText(JSON.stringify(apiData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!selected) return null;

  const isDataset = selected.type === "dataset";
  const item      = selected.item as DataPoint & CsbSubmission;

  return (
    <div className="absolute inset-y-0 right-0 w-[380px] flex flex-col z-[450]"
      style={{ background: "rgba(6,13,26,0.97)", borderLeft: "1px solid rgba(14,165,233,0.35)", backdropFilter: "blur(16px)", animation: "slideIn 0.2s ease" }}>

      {/* Header */}
      <div className="flex justify-between items-start p-4 border-b"
        style={{ borderColor: "rgba(14,165,233,0.15)" }}>
        <div>
          <p className="label-mono text-teal-bright mb-1">S-100 API Response</p>
          <p className="text-sm font-semibold text-text-primary">{isDataset ? item.dataset_id : `CSB-${item.id}`}</p>
          <p className="text-[11px] text-text-secondary mt-0.5">{isDataset ? item.custodian : `Vessel ${item.vessel_id}`}</p>
        </div>
        <button onClick={onClose}
          className="w-7 h-7 rounded-md flex items-center justify-center text-sm text-text-secondary cursor-pointer transition-colors hover:text-text-primary"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(14,165,233,0.15)" }}>
          ✕
        </button>
      </div>

      {/* Endpoint */}
      <div className="px-4 py-2.5 border-b" style={{ borderColor: "rgba(14,165,233,0.1)" }}>
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-md font-mono text-[11px]"
          style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.15)" }}>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-node-nigeria"
            style={{ background: "rgba(34,197,94,0.15)" }}>GET</span>
          <span className="text-text-secondary truncate">
            /api/datasets/{isDataset ? item.dataset_id : item.id}
          </span>
        </div>
      </div>

      {/* Restricted notice */}
      {isDataset && (item as DataPoint).access_level === "restricted" && (
        <div className="mx-4 mt-3 px-3 py-2.5 rounded-lg text-[11px] leading-relaxed"
          style={{ background: "rgba(251,146,60,0.07)", border: "1px solid rgba(251,146,60,0.25)", color: "#d97706" }}>
          <strong>🔒 Restricted Dataset</strong> — Full-resolution depth grid requires
          institutional auth (MEDIN RBAC). Toggle Military View to see full coordinates.
        </div>
      )}

      {/* JSON body */}
      <div className="flex-1 overflow-hidden flex flex-col px-4 py-3">
        <div className="flex justify-between items-center mb-2">
          <span className="font-mono text-[10px] text-text-muted">200 OK · application/json</span>
          <button onClick={copy}
            className="font-mono text-[11px] px-2.5 py-0.5 rounded cursor-pointer transition-colors"
            style={{
              background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)",
              color: copied ? "#22c55e" : "#0ea5e9",
            }}>
            {copied ? "✓ copied" : "copy"}
          </button>
        </div>

        <div className="flex-1 overflow-auto rounded-lg p-3.5 font-mono text-[11.5px] leading-[1.7]"
          style={{ background: "rgba(6,13,26,0.85)", border: "1px solid rgba(14,165,233,0.12)" }}>
          {loading && <span className="text-text-muted italic">Fetching S-100 response...</span>}
          {!loading && apiData && <pre className="whitespace-pre-wrap break-words">{syntaxHL(apiData)}</pre>}
        </div>
      </div>

      <div className="px-4 py-2.5 border-t font-mono text-[10px] text-text-muted"
        style={{ borderColor: "rgba(14,165,233,0.1)" }}>
        IHO S-102 Bathymetric Surface · WGS84 · MLLW datum
      </div>
    </div>
  );
}

function syntaxHL(obj: unknown): React.ReactNode {
  return JSON.stringify(obj, null, 2).split("\n").map((line, i) => {
    const m = line.match(/^(\s*)("[\w\s]+")(:\s*)(.*)$/);
    if (m) {
      const [, indent, key, colon, val] = m;
      let vc = "#e2e8f0";
      if (val.startsWith('"'))           vc = "#86efac";
      else if (val === "true" || val === "false") vc = "#fbbf24";
      else if (val === "null")            vc = "#94a3b8";
      else if (!isNaN(Number(val.replace(/,\s*$/, "")))) vc = "#7dd3fc";
      return (
        <span key={i}>
          {indent}<span style={{ color: "#93c5fd" }}>{key}</span>
          <span style={{ color: "#475569" }}>{colon}</span>
          <span style={{ color: vc }}>{val}</span>{"\n"}
        </span>
      );
    }
    return <span key={i} style={{ color: "#475569" }}>{line}{"\n"}</span>;
  });
}
