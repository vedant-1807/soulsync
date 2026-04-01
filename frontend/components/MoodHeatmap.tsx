"use client";

import { useState, useMemo } from "react";
import type { MoodLogEntry, EnergyLevel } from "../lib/mood-data";
import { EMOTION_META, ENERGY_HEATMAP_COLORS, dateKey } from "../lib/mood-data";

/* ── Layout constants ────────────────────────────────────────── */
const CELL       = 13;   // px per cell
const GAP        = 3;    // px gap
const NUM_WEEKS  = 53;   // columns in the grid
const EMPTY_CLR  = "var(--bg-2)";
const LABEL_W    = 36;   // px for day labels column

const DAY_LABELS: [number, string][] = [
  [1, "Mon"],
  [3, "Wed"],
  [5, "Fri"],
];

/* ── Per-cell data ───────────────────────────────────────────── */
interface CellData {
  date: Date;
  key: string;
  entry: MoodLogEntry | null;
  isFuture: boolean;
}

/* ── Component ───────────────────────────────────────────────── */
interface Props {
  entries: MoodLogEntry[];
}

export function MoodHeatmap({ entries }: Props) {
  const [hovered, setHovered] = useState<{
    rect: DOMRect;
    cell: CellData;
  } | null>(null);

  /* ── Build cells + month labels ──────────────────────────── */
  const { cells, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const entryMap = new Map<string, MoodLogEntry>();
    for (const e of entries) {
      const d = new Date(e.timestamp);
      const k = dateKey(d);
      const prev = entryMap.get(k);
      if (!prev || new Date(e.timestamp) > new Date(prev.timestamp)) {
        entryMap.set(k, e);
      }
    }

    // Start: go back NUM_WEEKS weeks, land on a Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - (NUM_WEEKS - 1) * 7 - start.getDay());
    start.setHours(0, 0, 0, 0);

    const cells: CellData[] = [];
    const monthLabels: { label: string; col: number }[] = [];
    let prevMonth = -1;

    for (let w = 0; w < NUM_WEEKS; w++) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + w * 7);

      if (weekStart.getMonth() !== prevMonth) {
        monthLabels.push({
          label: weekStart.toLocaleDateString("en-US", { month: "short" }),
          col: w,
        });
        prevMonth = weekStart.getMonth();
      }

      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + d);
        const k = dateKey(date);
        cells.push({
          date,
          key: k,
          entry: entryMap.get(k) ?? null,
          isFuture: date > today,
        });
      }
    }

    return { cells, monthLabels };
  }, [entries]);

  /* ── Cell color based on energy ─────────────────────────── */
  const cellColor = (c: CellData): string => {
    if (c.isFuture) return "transparent";
    if (!c.entry) return EMPTY_CLR;
    return ENERGY_HEATMAP_COLORS[c.entry.energy];
  };

  /* ── Tooltip text ───────────────────────────────────────── */
  const tooltipText = (c: CellData): string => {
    const dateStr = c.date.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
    if (!c.entry) return `${dateStr}: No entry`;
    const emo   = c.entry.emotion;
    const emoji = EMOTION_META[emo].emoji;
    const label = emo.charAt(0).toUpperCase() + emo.slice(1);
    const energy = c.entry.energy.replace("_", " ");
    return `${dateStr}: ${emoji} ${label} (${energy})`;
  };

  const gridH    = 7 * CELL + 6 * GAP;
  const gridW    = NUM_WEEKS * (CELL + GAP) - GAP;

  return (
    <div style={{ userSelect: "none", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-start" }}>

        {/* ── Fixed day-of-week labels ────────────────────── */}
        <div style={{
          flexShrink: 0,
          width: `${LABEL_W}px`,
          position: "relative",
          height: `${16 + 4 + gridH}px`, // month row + gap + grid
          marginTop: "0",
        }}>
          {DAY_LABELS.map(([row, label]) => (
            <span
              key={label}
              style={{
                position: "absolute",
                right: "6px",
                top: `${20 + row * (CELL + GAP) + CELL / 2}px`,
                transform: "translateY(-50%)",
                fontSize: "10px",
                color: "var(--text-2)",
                lineHeight: 1,
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* ── Scrollable area: month labels + grid ────────── */}
        <div style={{ flex: 1, overflowX: "auto", overflowY: "visible" }}>
          {/* Month labels row — same coordinate space as the grid */}
          <div style={{
            position: "relative",
            height: "16px",
            marginBottom: "4px",
            width: `${gridW}px`,
          }}>
            {monthLabels.map(({ label, col }) => (
              <span
                key={`ml-${col}`}
                style={{
                  position: "absolute",
                  left: `${col * (CELL + GAP)}px`,
                  fontSize: "10px",
                  color: "var(--text-2)",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Cell grid */}
          <div
            style={{
              display: "grid",
              gridTemplateRows: `repeat(7, ${CELL}px)`,
              gridAutoFlow: "column",
              gap: `${GAP}px`,
              width: `${gridW}px`,
            }}
          >
            {cells.map((cell, idx) => (
              <div
                key={idx}
                style={{
                  width: `${CELL}px`,
                  height: `${CELL}px`,
                  backgroundColor: cellColor(cell),
                  borderRadius: "2px",
                  outline:
                    hovered?.cell.key === cell.key
                      ? "1px solid rgba(196,144,58,0.65)"
                      : "none",
                  outlineOffset: "-1px",
                  cursor: cell.isFuture ? "default" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!cell.isFuture) {
                    setHovered({ rect: e.currentTarget.getBoundingClientRect(), cell });
                  }
                }}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </div>

          {/* Legend */}
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            marginTop: "10px",
          }}>
            <span style={{ fontSize: "10px", color: "var(--text-2)" }}>Less</span>
            <div style={{ display: "flex", gap: `${GAP}px` }}>
              <div style={{ width: "11px", height: "11px", borderRadius: "2px", backgroundColor: EMPTY_CLR }} />
              {(["very_low", "low", "moderate", "high"] as EnergyLevel[]).map((lvl) => (
                <div
                  key={lvl}
                  style={{
                    width: "11px", height: "11px", borderRadius: "2px",
                    backgroundColor: ENERGY_HEATMAP_COLORS[lvl],
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: "10px", color: "var(--text-2)" }}>More</span>
          </div>
        </div>
      </div>

      {/* ── Tooltip (viewport-fixed) ─────────────────────── */}
      {hovered && (
        <div
          style={{
            position: "fixed",
            zIndex: 100,
            pointerEvents: "none",
            left: hovered.rect.left + hovered.rect.width / 2,
            top: hovered.rect.top - 6,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div
            style={{
              whiteSpace: "nowrap",
              borderRadius: "8px",
              padding: "6px 10px",
              fontSize: "11px",
              fontWeight: 500,
              backgroundColor: "var(--bg-3)",
              color: "var(--text-0)",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
            }}
          >
            {tooltipText(hovered.cell)}
          </div>
        </div>
      )}
    </div>
  );
}
