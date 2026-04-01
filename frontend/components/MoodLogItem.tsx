import type { MoodLogEntry } from "../lib/mood-data";
import {
  EMOTION_META,
  ENERGY_META,
  formatMoodTimestamp,
} from "../lib/mood-data";
import { Zap } from "lucide-react";

interface Props {
  entry: MoodLogEntry;
  isLast: boolean;
}

export function MoodLogItem({ entry, isLast }: Props) {
  const emo    = EMOTION_META[entry.emotion];
  const energy = ENERGY_META[entry.energy];

  return (
    <div className="flex gap-4">
      {/* ── Timeline spine: dot + connecting line ────────── */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: "20px" }}>
        {/* Dot */}
        <div
          className="flex-shrink-0 rounded-full"
          style={{
            width: "12px",
            height: "12px",
            marginTop: "6px",
            border: `2px solid ${emo.color}`,
            backgroundColor: `${emo.color}30`,
          }}
        />
        {/* Line */}
        {!isLast && (
          <div
            className="flex-1"
            style={{
              width: "1px",
              minHeight: "24px",
              backgroundColor: "var(--border)",
            }}
          />
        )}
      </div>

      {/* ── Card ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 pb-5">
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "var(--bg-1)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Header: emotion + timestamp */}
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5">
              <span className="text-lg leading-none">{emo.emoji}</span>
              <span
                className="text-[14px] font-medium capitalize"
                style={{ color: "var(--text-0)" }}
              >
                {entry.emotion}
              </span>
            </div>
            <span
              className="text-[11px] flex-shrink-0 pt-0.5"
              style={{ color: "var(--text-2)" }}
            >
              {formatMoodTimestamp(entry.timestamp)}
            </span>
          </div>

          {/* Energy badge */}
          <div className="mb-3">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[10px] font-semibold"
              style={{
                backgroundColor: energy.bg,
                color: energy.color,
              }}
            >
              <Zap size={9} />
              {energy.label}
            </span>
          </div>

          {/* Note */}
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: "var(--text-1)" }}
          >
            {entry.note}
          </p>
        </div>
      </div>
    </div>
  );
}
