"use client";

import { useState } from "react";
import { ChevronDown, FileText, Zap, Globe } from "lucide-react";
import { AgentPanel } from "../lib/types";

const AGENT_COLORS: Record<string, { badge: string; dot: string }> = {
  "CBT Agent":       { badge: "rgba(165,109,214,0.15)", dot: "#a56dd6" },
  "Crisis Agent":    { badge: "rgba(184,84,72,0.15)",   dot: "var(--crisis)" },
  "Mood Tracker":    { badge: "rgba(196,144,58,0.15)",  dot: "var(--gold)" },
  "Resource Finder": { badge: "rgba(103,143,110,0.15)", dot: "var(--sage)" },
  "General RAG":     { badge: "rgba(181,169,142,0.1)",  dot: "var(--text-2)" },
};

interface AgentPanelProps { panel: AgentPanel }

export function AgentPanelView({ panel }: AgentPanelProps) {
  const [open, setOpen] = useState(false);
  const cfg = AGENT_COLORS[panel.agent_used] ?? AGENT_COLORS["General RAG"];
  const pct = Math.round(panel.confidence * 100);
  const barColor = pct >= 80 ? "var(--sage)" : pct >= 60 ? "var(--gold)" : "var(--crisis)";
  const confColor = pct >= 80 ? "var(--sage)" : pct >= 60 ? "var(--gold)" : "var(--crisis)";

  return (
    <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
      {/* Collapsed row */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "0.5rem",
          background: "none", border: "none", cursor: "pointer", padding: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            padding: "2px 8px", borderRadius: "999px",
            fontSize: "0.68rem", fontWeight: 600,
            background: cfg.badge, color: "var(--text-1)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
            {panel.agent_used}
          </span>
          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: confColor }}>
            {pct}% confidence
          </span>
        </div>
        <ChevronDown
          size={12}
          color="var(--text-2)"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        />
      </button>

      {/* Expanded panel */}
      {open && (
        <div style={{ marginTop: "0.625rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {/* Confidence bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "var(--text-2)", marginBottom: "4px" }}>
              <span>Retrieval confidence</span>
              <span>{pct}%</span>
            </div>
            <div style={{ height: "4px", borderRadius: "999px", background: "var(--bg-3)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: "999px",
                background: barColor,
                width: `${pct}%`,
                transition: "width 0.5s ease",
              }} />
            </div>
          </div>

          {/* Retrieval method */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.7rem", color: "var(--text-2)" }}>
            <Zap size={10} color="var(--text-2)" />
            <span style={{ textTransform: "capitalize" }}>{panel.retrieval_method} retrieval</span>
          </div>

          {/* Sources */}
          {panel.sources.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.7rem", fontWeight: 600, color: "var(--text-2)" }}>
                <FileText size={10} />
                Sources
              </div>
              {panel.sources.slice(0, 4).map((src) => (
                <div key={src} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.68rem", color: "var(--text-2)" }}>
                  <Globe size={9} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                    {src}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
