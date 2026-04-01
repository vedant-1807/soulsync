"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

interface MoodPoint {
  timestamp: string;
  score: number;
  emotion: string;
}

interface MoodChartProps {
  data: MoodPoint[];
}

const EMOTION_LABEL: Record<string, string> = {
  anxious:     "😰 Anxious",
  sad:         "😔 Sad",
  angry:       "😠 Angry",
  neutral:     "😐 Neutral",
  content:     "🙂 Content",
  hopeful:     "🌱 Hopeful",
  overwhelmed: "😤 Overwhelmed",
  numb:        "😶 Numb",
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as MoodPoint;
  const date = new Date(d.timestamp).toLocaleDateString([], { month: "short", day: "numeric" });
  const score = (d.score * 100).toFixed(0);
  const sign  = d.score >= 0 ? "+" : "";
  return (
    <div style={{
      background: "#1e1b16", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "10px", padding: "0.5rem 0.75rem",
      fontSize: "0.72rem", boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    }}>
      <p style={{ fontWeight: 600, color: "#f0e8da", margin: "0 0 2px" }}>{date}</p>
      <p style={{ color: "#b5a98e", margin: "0 0 2px" }}>{EMOTION_LABEL[d.emotion] ?? d.emotion}</p>
      <p style={{
        fontWeight: 700, margin: 0,
        color: d.score >= 0 ? "#678f6e" : "#b85448",
      }}>
        {sign}{score}
      </p>
    </div>
  );
}

export function MoodChart({ data }: MoodChartProps) {
  if (!data.length) return null;

  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.timestamp).toLocaleDateString([], { weekday: "short" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={90}>
      <LineChart data={chartData} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#7a7060" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[-1, 1]}
          ticks={[-1, 0, 1]}
          tick={{ fontSize: 9, fill: "#7a7060" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#c4903a"
          strokeWidth={2}
          dot={{ fill: "#c4903a", r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#e8b85a", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
