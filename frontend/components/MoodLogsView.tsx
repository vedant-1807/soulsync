"use client";

import { useMemo } from "react";
import { Calendar, TrendingUp, TrendingDown, Minus, Hash } from "lucide-react";
import { MoodHeatmap } from "./MoodHeatmap";
import { MoodLogItem } from "./MoodLogItem";
import {
  EMOTION_META,
  type MoodLogEntry,
} from "../lib/mood-data";

/* ── Stat card (internal) ────────────────────────────────────── */
function StatCard({
  icon: Icon,
  title,
  value,
  sub,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: "var(--bg-1)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={12} style={{ color: "var(--text-2)" }} />
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-2)" }}
        >
          {title}
        </span>
      </div>
      <div
        className="text-lg font-semibold capitalize"
        style={{ color: "var(--text-0)" }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[11px] mt-0.5" style={{ color: "var(--text-2)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

interface MoodLogsViewProps {
  moodHistory: import("../lib/types").MoodPoint[];
}

/* ── Main view ───────────────────────────────────────────────── */
export function MoodLogsView({ moodHistory }: MoodLogsViewProps) {
  // Convert MoodPoint[] to MoodLogEntry[] format
  const entries: MoodLogEntry[] = useMemo(() => {
    if (!moodHistory || moodHistory.length === 0) return [];
    const validEmotions = ["anxious", "sad", "angry", "neutral", "content", "hopeful", "overwhelmed", "numb"];
    return moodHistory.map((point, idx) => ({
      id: `mood-${idx}`,
      timestamp: point.timestamp,
      score: point.score,
      emotion: (validEmotions.includes(point.emotion) ? point.emotion : "neutral") as any,
      energy: "moderate" as const,
      note: point.note || "",
    }));
  }, [moodHistory]);

  const sorted = useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [entries]
  );

  /* ── Stats ───────────────────────────────────────────────── */
  const avgScore = useMemo(
    () => entries.reduce((s, e) => s + e.score, 0) / (entries.length || 1),
    [entries]
  );

  const dominantEmotion = useMemo(() => {
    const counts: Partial<Record<string, number>> = {};
    for (const e of entries) counts[e.emotion] = (counts[e.emotion] ?? 0) + 1;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : "neutral";
  }, [entries]);

  const dominantEmoji = EMOTION_META[dominantEmotion as keyof typeof EMOTION_META]?.emoji ?? "😐";

  const trendIcon =
    avgScore > 0.1 ? TrendingUp : avgScore < -0.1 ? TrendingDown : Minus;
  const trendWord =
    avgScore > 0.1 ? "Positive" : avgScore < -0.1 ? "Low" : "Neutral";

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ backgroundColor: "var(--bg-0)", color: "var(--text-0)" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-8 pb-20">
        {/* ── Page header ──────────────────────────────────── */}
        <h1
          className="text-2xl font-semibold mb-1"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          Mood Logs
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>
          Your emotional journey, tracked over time
        </p>

        {/* ── Stats grid ───────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard
            icon={Hash}
            title="Total Entries"
            value={String(entries.length)}
            sub="This year"
          />
          <StatCard
            icon={trendIcon}
            title="Avg Mood"
            value={`${avgScore >= 0 ? "+" : ""}${avgScore.toFixed(2)}`}
            sub={trendWord}
          />
          <StatCard
            icon={Calendar}
            title="Most Frequent"
            value={`${dominantEmoji} ${dominantEmotion}`}
          />
          <StatCard
            icon={Calendar}
            title="Last Entry"
            value={
              sorted[0]
                ? new Date(sorted[0].timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "—"
            }
            sub={
              sorted[0]
                ? new Date(sorted[0].timestamp).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })
                : undefined
            }
          />
        </div>

        {/* ── Heatmap card ─────────────────────────────────── */}
        <div
          className="rounded-xl p-5 mb-10"
          style={{
            backgroundColor: "var(--bg-1)",
            border: "1px solid var(--border)",
          }}
        >
          <h2
            className="text-[10px] font-semibold uppercase tracking-widest mb-4"
            style={{ color: "var(--text-2)" }}
          >
            Activity
          </h2>
          <MoodHeatmap entries={entries} />
        </div>

        {/* ── Timeline ─────────────────────────────────────── */}
        <h2
          className="text-[10px] font-semibold uppercase tracking-widest mb-5"
          style={{ color: "var(--text-2)" }}
        >
          All Entries
        </h2>

        <div>
          {sorted.map((entry, i) => (
            <MoodLogItem
              key={entry.id}
              entry={entry}
              isLast={i === sorted.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
