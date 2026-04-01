"use client";

import { useMemo } from "react";
import { MoodPoint } from "../lib/types";
import { MoodPicker } from "./MoodPicker";

const EMOTION_EMOJI: Record<string, string> = {
  anxious: "😰", sad: "😔", angry: "😡",
  neutral: "😐", content: "😊", hopeful: "🌱",
  overwhelmed: "😤", numb: "😶",
};

function computeInsight(history: MoodPoint[]): string {
  if (!history.length) return "Chat with SoulSync to start tracking your wellbeing.";
  const avg       = history.reduce((s, m) => s + m.score, 0) / history.length;
  const recent    = history.slice(-3);
  const recentAvg = recent.reduce((s, m) => s + m.score, 0) / recent.length;
  if (avg < -0.3)              return "You've been going through a tough stretch. Be kind to yourself today. 💙";
  if (recentAvg > avg + 0.2)   return "Your mood seems to be improving — keep it up! 🌱";
  if (avg > 0.3)               return "You've had a positive stretch recently. Great work! ✨";
  return "Your mood has been steady. Small daily check-ins help build clarity over time.";
}

function moodScoreColor(score: number): string {
  if (score >= 0.3) return "var(--sage)";
  if (score <= -0.3) return "var(--crisis)";
  return "var(--gold)";
}

const cardStyle: React.CSSProperties = {
  background: "var(--bg-2)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "1rem",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "var(--text-1)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.07em",
  margin: "0 0 0.75rem",
};

interface RightPanelProps {
  moodHistory: MoodPoint[];
  onSendMoodMessage: (message: string) => void;
}

export function RightPanel({ moodHistory, onSendMoodMessage }: RightPanelProps) {
  const todayStr = new Date().toDateString();
  const todayEntries = moodHistory.filter(
    (m) => new Date(m.timestamp).toDateString() === todayStr
  );
  const latest  = todayEntries[todayEntries.length - 1] ?? null;
  const insight = computeInsight(moodHistory);

  // Today's summary stats
  const todaySummary = useMemo(() => {
    if (todayEntries.length === 0) return null;
    const avgScore = todayEntries.reduce((s, m) => s + m.score, 0) / todayEntries.length;
    // Dominant emotion
    const counts: Record<string, number> = {};
    for (const e of todayEntries) counts[e.emotion] = (counts[e.emotion] ?? 0) + 1;
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    return { avgScore, dominant, count: todayEntries.length };
  }, [todayEntries]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "0.75rem",
      padding: "1rem", overflowY: "auto", height: "100%",
      background: "var(--bg-1)",
    }}>

      {/* Mood Picker */}
      <MoodPicker latest={latest} onSelectMood={onSendMoodMessage} />

      {/* Today's Mood Card */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Today&apos;s Summary</h3>

        {!todaySummary ? (
          <p style={{ fontSize: "0.75rem", color: "var(--text-2)", margin: 0, textAlign: "center", padding: "0.5rem 0" }}>
            No check-ins yet today. Tap an emoji above to start.
          </p>
        ) : (
          <>
            {/* Score + dominant emotion header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: "0.75rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>
                  {EMOTION_EMOJI[todaySummary.dominant] ?? "😐"}
                </span>
                <div>
                  <p style={{
                    fontSize: "0.85rem", fontWeight: 600, color: "var(--text-0)",
                    margin: 0, textTransform: "capitalize",
                  }}>
                    {todaySummary.dominant}
                  </p>
                  <p style={{ fontSize: "0.68rem", color: "var(--text-2)", margin: "1px 0 0" }}>
                    {todaySummary.count} check-in{todaySummary.count !== 1 ? "s" : ""} today
                  </p>
                </div>
              </div>
              <div style={{
                background: "var(--bg-3)", borderRadius: "8px",
                padding: "0.35rem 0.6rem", textAlign: "center",
              }}>
                <p style={{
                  fontSize: "0.95rem", fontWeight: 700, margin: 0,
                  color: moodScoreColor(todaySummary.avgScore),
                }}>
                  {todaySummary.avgScore >= 0 ? "+" : ""}{Math.round(todaySummary.avgScore * 100)}
                </p>
                <p style={{ fontSize: "0.6rem", color: "var(--text-2)", margin: 0 }}>AVG</p>
              </div>
            </div>

            {/* Score bar */}
            <div style={{
              height: "4px", borderRadius: "2px",
              background: "var(--bg-3)", marginBottom: "0.75rem",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: "2px",
                width: `${Math.round((todaySummary.avgScore + 1) / 2 * 100)}%`,
                background: moodScoreColor(todaySummary.avgScore),
                transition: "width 0.3s ease",
              }} />
            </div>

            {/* Timeline of today's entries */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {todayEntries.map((m, i) => {
                const time = new Date(m.timestamp).toLocaleTimeString([], {
                  hour: "numeric", minute: "2-digit", hour12: true,
                });
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.4rem 0.6rem", borderRadius: "8px",
                    background: "var(--bg-3)",
                  }}>
                    <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>
                      {EMOTION_EMOJI[m.emotion] ?? "💙"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: "0.75rem", color: "var(--text-1)", margin: 0,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {m.note || m.emotion}
                      </p>
                    </div>
                    <span style={{
                      fontSize: "0.65rem", color: "var(--text-2)", flexShrink: 0,
                    }}>
                      {time}
                    </span>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 600, flexShrink: 0,
                      color: moodScoreColor(m.score),
                    }}>
                      {m.score >= 0 ? "+" : ""}{Math.round(m.score * 100)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Insights */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Insights</h3>
        <p style={{ fontSize: "0.825rem", color: "var(--text-1)", lineHeight: 1.6, margin: 0 }}>
          {insight}
        </p>
      </div>
    </div>
  );
}
