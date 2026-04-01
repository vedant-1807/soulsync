import { ChatResponse, ChatSession, MoodPoint } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ── Chat message ─────────────────────────────────────────── */

export async function sendMessage(
  message:   string,
  sessionId: string,
  history:   { role: string; content: string }[] = [],
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ message, session_id: sessionId, history }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || `API error: ${res.status}`);
  }
  return res.json() as Promise<ChatResponse>;
}

/* ── Mood history ─────────────────────────────────────────── */

export async function getMoodHistory(sessionId: string): Promise<MoodPoint[]> {
  try {
    const res = await fetch(`${API_BASE}/mood-history/${encodeURIComponent(sessionId)}`);
    if (!res.ok) return [];
    return res.json() as Promise<MoodPoint[]>;
  } catch {
    return [];
  }
}

/* ── Chat session persistence (backend sync) ──────────────── */

export async function loadRemoteSessions(userId: string): Promise<ChatSession[]> {
  try {
    const res = await fetch(
      `${API_BASE}/chat-sessions/${encodeURIComponent(userId)}`
    );
    if (!res.ok) return [];
    return res.json() as Promise<ChatSession[]>;
  } catch {
    return [];
  }
}

export async function saveRemoteSession(
  session: ChatSession,
  userId:  string
): Promise<void> {
  try {
    await fetch(`${API_BASE}/chat-sessions/${session.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id:    userId,
        title:      session.title,
        messages:   session.messages,
        created_at: session.createdAt,
        updated_at: session.updatedAt,
      }),
    });
  } catch {
    // localStorage is the source of truth; backend sync is best-effort
  }
}

export async function deleteRemoteSession(sessionId: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/chat-sessions/${sessionId}`, { method: "DELETE" });
  } catch {}
}

/* ── Health ───────────────────────────────────────────────── */

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
