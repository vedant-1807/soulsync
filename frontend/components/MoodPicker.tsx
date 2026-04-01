"use client";

import { motion } from "framer-motion";
import { MoodPoint } from "../lib/types";

const MOODS = [
  { emoji: "😊", label: "Happy",     message: "I'm feeling happy today 😊" },
  { emoji: "😐", label: "Neutral",   message: "I'm feeling okay, pretty neutral today 😐" },
  { emoji: "😔", label: "Sad",       message: "I've been feeling sad today 😔" },
  { emoji: "😡", label: "Angry",     message: "I'm feeling really frustrated and angry right now 😡" },
  { emoji: "😰", label: "Anxious",   message: "I'm feeling anxious and on edge today 😰" },
];

const EMOTION_EMOJI: Record<string, string> = {
  anxious: "😰", sad: "😔", angry: "😡",
  neutral: "😐", content: "😊", hopeful: "🌱",
  overwhelmed: "😤", numb: "😶",
};

interface MoodPickerProps {
  latest?: MoodPoint | null;
  onSelectMood: (message: string) => void;
}

export function MoodPicker({ latest, onSelectMood }: MoodPickerProps) {
  return (
    <div style={{
      background: "var(--bg-2)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      padding: "1rem",
    }}>
      <h3 style={{
        fontSize: "0.8rem", fontWeight: 600,
        color: "var(--text-1)", textTransform: "uppercase",
        letterSpacing: "0.07em", margin: "0 0 0.75rem",
      }}>
        Today&apos;s Mood
      </h3>

      {/* Emoji picker row */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        {MOODS.map(({ emoji, label, message }) => (
          <motion.button
            key={label}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSelectMood(message)}
            title={label}
            style={{
              fontSize: "1.4rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              borderRadius: "8px",
              padding: "0.25rem",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(196,144,58,0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "none";
            }}
          >
            {emoji}
          </motion.button>
        ))}
      </div>

      {/* Latest mood */}
      {latest ? (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          fontSize: "0.75rem", color: "var(--text-2)",
          background: "var(--bg-3)", borderRadius: "8px",
          padding: "0.5rem 0.75rem",
        }}>
          <span style={{ fontSize: "1rem" }}>
            {EMOTION_EMOJI[latest.emotion] ?? "💙"}
          </span>
          <span>
            Latest: <span style={{ fontWeight: 600, color: "var(--text-1)", textTransform: "capitalize" }}>
              {latest.emotion}
            </span>
            {" · "}
            <span style={{ color: latest.score >= 0 ? "var(--sage)" : "var(--crisis)" }}>
              {latest.score >= 0 ? "+" : ""}{Math.round(latest.score * 100)}
            </span>
          </span>
        </div>
      ) : (
        <p style={{ fontSize: "0.75rem", color: "var(--text-2)", textAlign: "center", margin: 0 }}>
          Tap an emoji to log how you feel
        </p>
      )}
    </div>
  );
}
