// ─── Types ──────────────────────────────────────────────────────

export type Emotion =
  | "anxious"
  | "sad"
  | "angry"
  | "neutral"
  | "content"
  | "hopeful"
  | "overwhelmed"
  | "numb";

export type EnergyLevel = "very_low" | "low" | "moderate" | "high";

export interface MoodLogEntry {
  id: string;
  timestamp: string;
  score: number;
  emotion: Emotion;
  energy: EnergyLevel;
  note: string;
}

// ─── Metadata ───────────────────────────────────────────────────

export const EMOTION_META: Record<Emotion, { emoji: string; color: string }> = {
  anxious:     { emoji: "😰", color: "#8080c0" },
  sad:         { emoji: "😔", color: "#6080a0" },
  angry:       { emoji: "😠", color: "#c07060" },
  neutral:     { emoji: "😐", color: "#7a7165" },
  content:     { emoji: "😌", color: "#7a9060" },
  hopeful:     { emoji: "🌱", color: "#6a9470" },
  overwhelmed: { emoji: "🌊", color: "#7070b0" },
  numb:        { emoji: "🌫️", color: "#606878" },
};

export const ENERGY_META: Record<
  EnergyLevel,
  { label: string; color: string; bg: string }
> = {
  very_low: { label: "Very Low", color: "#c87868", bg: "rgba(184,84,72,0.15)" },
  low:      { label: "Low",      color: "#c8a032", bg: "rgba(200,160,50,0.15)" },
  moderate: { label: "Moderate", color: "#b5a98e", bg: "rgba(181,169,142,0.12)" },
  high:     { label: "High",     color: "#7aac82", bg: "rgba(103,143,110,0.18)" },
};

/** Heatmap cell color scale — energy level maps to gold intensity */
export const ENERGY_HEATMAP_COLORS: Record<EnergyLevel, string> = {
  very_low: "#2a2218",
  low:      "#5a4a28",
  moderate: "#8a6a2e",
  high:     "#c4903a",
};

// ─── Helpers ────────────────────────────────────────────────────

export function formatMoodTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfEntry = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (startOfEntry.getTime() === startOfToday.getTime()) return `Today, ${time}`;
  if (startOfEntry.getTime() === startOfYesterday.getTime()) return `Yesterday, ${time}`;

  return `${d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}, ${time}`;
}

/** Date → "YYYY-MM-DD" key for Map lookups */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// ─── Mock Data (18 entries, ~4 weeks) ───────────────────────────

export const MOCK_MOOD_ENTRIES: MoodLogEntry[] = [
  // ── Current week (late March 2026) ──
  {
    id: "m01", timestamp: "2026-03-29T22:42:00", score: -0.65,
    emotion: "numb", energy: "high",
    note: "Feeling disconnected despite high energy. Been pushing through work without really feeling present.",
  },
  {
    id: "m02", timestamp: "2026-03-29T10:42:00", score: 0.5,
    emotion: "content", energy: "moderate",
    note: "Feeling content today, but quite tired. Prioritizing rest when you need it.",
  },
  {
    id: "m03", timestamp: "2026-03-28T14:30:00", score: -0.6,
    emotion: "sad", energy: "low",
    note: "Feeling down because a friend cancelled plans again. Trying not to take it personally.",
  },
  {
    id: "m04", timestamp: "2026-03-27T09:15:00", score: -0.3,
    emotion: "anxious", energy: "moderate",
    note: "Sleep concerns keeping me up. Tried box breathing before bed — helped a little.",
  },
  {
    id: "m05", timestamp: "2026-03-26T20:00:00", score: 0.0,
    emotion: "neutral", energy: "low",
    note: "Just getting through the day. Nothing particularly good or bad happened.",
  },
  {
    id: "m06", timestamp: "2026-03-25T08:30:00", score: 0.7,
    emotion: "hopeful", energy: "high",
    note: "Morning check-in. Feeling genuinely optimistic about the week ahead for the first time in a while.",
  },

  // ── Previous week ──
  {
    id: "m07", timestamp: "2026-03-23T19:00:00", score: -0.4,
    emotion: "anxious", energy: "moderate",
    note: "Anxiety journal entry. Work deadline approaching fast and I still have so much left to do.",
  },
  {
    id: "m08", timestamp: "2026-03-22T11:00:00", score: 0.5,
    emotion: "content", energy: "moderate",
    note: "Nice brunch with friends. Feeling grounded and connected after a good conversation.",
  },
  {
    id: "m09", timestamp: "2026-03-20T16:45:00", score: -0.5,
    emotion: "overwhelmed", energy: "very_low",
    note: "Everything feels like too much today. Can't focus on anything for more than a few minutes.",
  },
  {
    id: "m10", timestamp: "2026-03-19T10:00:00", score: -0.3,
    emotion: "sad", energy: "low",
    note: "Missing home. The rainy weather is making it worse. Called mom which helped a bit.",
  },

  // ── Two weeks ago ──
  {
    id: "m11", timestamp: "2026-03-16T21:30:00", score: 0.3,
    emotion: "content", energy: "moderate",
    note: "Good evening walk in the park. Fresh air really helped clear my head after a long day.",
  },
  {
    id: "m12", timestamp: "2026-03-15T14:00:00", score: -0.4,
    emotion: "angry", energy: "high",
    note: "Frustrating meeting at work. Felt completely dismissed by my manager during the review.",
  },
  {
    id: "m13", timestamp: "2026-03-13T09:30:00", score: 0.7,
    emotion: "hopeful", energy: "high",
    note: "Great therapy session yesterday. Learned a new reframing technique that really clicked.",
  },

  // ── Three weeks ago ──
  {
    id: "m14", timestamp: "2026-03-10T18:00:00", score: 0.0,
    emotion: "neutral", energy: "moderate",
    note: "Average day. Practiced mindfulness for 10 minutes — getting easier each time.",
  },
  {
    id: "m15", timestamp: "2026-03-08T22:00:00", score: -0.6,
    emotion: "anxious", energy: "low",
    note: "Can't sleep. Mind racing about tomorrow's presentation. Tried counting breaths.",
  },

  // ── Four weeks ago ──
  {
    id: "m16", timestamp: "2026-03-05T12:00:00", score: 0.5,
    emotion: "content", energy: "high",
    note: "Had a really productive morning. Ticked off everything on the to-do list. Feeling accomplished.",
  },
  {
    id: "m17", timestamp: "2026-03-03T07:30:00", score: -0.5,
    emotion: "overwhelmed", energy: "very_low",
    note: "Burnout hitting hard. Need to take a proper break but keep feeling guilty about it.",
  },
  {
    id: "m18", timestamp: "2026-03-01T15:00:00", score: 0.3,
    emotion: "hopeful", energy: "moderate",
    note: "New month, fresh start. Setting intentions for March — more sleep, less screen time.",
  },
];
