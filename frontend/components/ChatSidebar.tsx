"use client";

import { useState } from "react";
import { PlusCircle, MessageCircle, ChevronRight, Phone } from "lucide-react";
import { ChatSession } from "../lib/types";
import { MoodChart } from "./MoodChart";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  moodHistory: { timestamp: string; score: number; emotion: string }[];
}

function groupByDate(sessions: ChatSession[]) {
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const groups: Record<string, ChatSession[]> = { Today: [], Yesterday: [], Earlier: [] };
  for (const s of sessions) {
    const d = new Date(s.createdAt); d.setHours(0, 0, 0, 0);
    if      (d.getTime() === today.getTime())     groups["Today"].push(s);
    else if (d.getTime() === yesterday.getTime()) groups["Yesterday"].push(s);
    else                                          groups["Earlier"].push(s);
  }
  return groups;
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  moodHistory,
}: ChatSidebarProps) {
  const [moodOpen, setMoodOpen] = useState(false);
  const grouped = groupByDate(sessions);

  return (
    <aside className="w-72 flex flex-col h-full bg-white border-r border-slate-100 shadow-sm">

      {/* ── Logo ──────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-soul-500 flex items-center justify-center shadow-md shadow-soul-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191
                   5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447
                   5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"
                fill="white"
              />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-[15px] leading-tight">SoulSync</p>
            <p className="text-[11px] text-slate-400 leading-tight">Mental Health Support</p>
          </div>
        </div>
      </div>

      {/* ── New conversation ──────────────────────────────── */}
      <div className="px-4 pb-3">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4
            rounded-xl bg-soul-500 hover:bg-soul-600 text-white text-sm font-medium
            transition-all duration-150 shadow-sm active:scale-[0.98]"
        >
          <PlusCircle size={15} />
          New conversation
        </button>
      </div>

      {/* ── Session list ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {sessions.length === 0 ? (
          <div className="text-center mt-8 px-4">
            <MessageCircle size={28} className="mx-auto text-slate-200 mb-2" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Your conversations will appear here
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([label, items]) =>
            items.length === 0 ? null : (
              <div key={label} className="mb-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                  {label}
                </p>
                <ul className="space-y-0.5">
                  {items.map((session) => (
                    <li key={session.id}>
                      <button
                        onClick={() => onSelectSession(session.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm
                          transition-all duration-100 group
                          ${session.id === activeSessionId
                            ? "bg-soul-50 text-soul-700 font-medium"
                            : "text-slate-600 hover:bg-slate-50"
                          }`}
                      >
                        <div className="flex items-start gap-2">
                          <MessageCircle
                            size={13}
                            className={`mt-0.5 flex-shrink-0 ${
                              session.id === activeSessionId
                                ? "text-soul-400"
                                : "text-slate-300 group-hover:text-slate-400"
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="truncate leading-snug">
                              {session.title || "New conversation"}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {session.messages.length} messages
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )
        )}
      </div>

      {/* ── Mood trend (collapsible) ──────────────────────── */}
      {moodHistory.length > 0 && (
        <div className="mx-3 mb-2 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
          <button
            onClick={() => setMoodOpen((o) => !o)}
            className="w-full flex items-center justify-between px-3 py-2.5
              text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-soul-400 inline-block" />
              Mood trend · 7 days
            </span>
            <ChevronRight
              size={13}
              className={`transition-transform duration-200 ${moodOpen ? "rotate-90" : ""}`}
            />
          </button>
          {moodOpen && (
            <div className="px-2 pb-3 animate-fade-in">
              <MoodChart data={moodHistory} />
            </div>
          )}
        </div>
      )}

      {/* ── Crisis footer ─────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-slate-100">
        <div className="flex items-start gap-2">
          <Phone size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            In crisis? Call or text{" "}
            <span className="font-semibold text-slate-600">988</span> (US) or
            your local crisis line.
          </p>
        </div>
      </div>
    </aside>
  );
}
