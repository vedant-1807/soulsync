/**
 * localStorage helpers for chat session persistence.
 * All data is namespaced per user so different logins never see each other's data.
 * All reads return [] / null on SSR or parse errors.
 */
import { ChatSession } from "./types";

const ANON_ID_KEY  = "soulsync_anon_id";
const USER_KEY     = "soulsync_current_user";

/** Set the current user key. Call this on login / session change. */
export function setCurrentUser(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, userId);
}

/** Get the active user key (falls back to anon device id). */
export function getCurrentUser(): string {
  if (typeof window === "undefined") return "anon";
  return localStorage.getItem(USER_KEY) || getOrCreateAnonId();
}

/** Per-user localStorage key for sessions. */
function sessionsKey(): string {
  return `soulsync_sessions_${getCurrentUser()}`;
}

/* ── Session CRUD ─────────────────────────────────────────── */

export function getSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(sessionsKey());
    return raw ? (JSON.parse(raw) as ChatSession[]) : [];
  } catch {
    return [];
  }
}

export function getSession(id: string): ChatSession | null {
  return getSessions().find((s) => s.id === id) ?? null;
}

export function saveSession(session: ChatSession): void {
  if (typeof window === "undefined") return;
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session); // newest first
  }
  localStorage.setItem(sessionsKey(), JSON.stringify(sessions));
}

export function deleteSession(id: string): void {
  if (typeof window === "undefined") return;
  const sessions = getSessions().filter((s) => s.id !== id);
  localStorage.setItem(sessionsKey(), JSON.stringify(sessions));
}

/* ── Anonymous device ID (fallback for unauthenticated users) */

export function getOrCreateAnonId(): string {
  if (typeof window === "undefined") return "anon";
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

/* ── Remote→local merge (remote wins on conflict) ─────────── */

export function mergeSessions(
  local: ChatSession[],
  remote: ChatSession[]
): ChatSession[] {
  const map = new Map<string, ChatSession>(local.map((s) => [s.id, s]));
  for (const r of remote) {
    const l = map.get(r.id);
    if (!l || r.updatedAt > l.updatedAt) {
      map.set(r.id, r);
    }
  }
  return [...map.values()].sort(
    (a, b) => b.updatedAt.localeCompare(a.updatedAt)
  );
}
