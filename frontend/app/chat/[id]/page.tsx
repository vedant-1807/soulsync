"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Message, MoodPoint, ChatSession } from "../../../lib/types";
import { getMoodHistory, loadRemoteSessions, saveRemoteSession, deleteRemoteSession } from "../../../lib/api";
import {
  getSessions, getSession, saveSession, deleteSession,
  getOrCreateAnonId, mergeSessions, setCurrentUser, getCurrentUser,
} from "../../../lib/storage";
import { Sidebar, NavTab } from "../../../components/Sidebar";
import { ChatPanel } from "../../../components/ChatPanel";
import { RightPanel } from "../../../components/RightPanel";
import { MoodLogsView } from "../../../components/MoodLogsView";

export default function ChatPage({ params }: { params: { id: string } }) {
  const chatId = params.id;
  const router = useRouter();
  const { data: session } = useSession();

  const [activeTab, setActiveTab]     = useState<NavTab>("chat");
  const [allSessions, setAllSessions] = useState<ChatSession[]>([]);
  const [moodHistory, setMoodHistory] = useState<MoodPoint[]>([]);
  const [isLoaded, setIsLoaded]       = useState(false);
  const [theme, setTheme]             = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("soulsync_theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });
  const sendMoodRef                   = useRef<((text: string) => void) | null>(null);

  // Resolve userId: authenticated Google sub or local anon device ID
  const userId = useMemo(() => {
    if (session?.user) {
      return (session.user as { id?: string }).id ?? null;
    }
    return null;
  }, [session]);

  // ── Set current user in storage whenever auth changes ───────────────────────
  useEffect(() => {
    const uid = userId ?? getOrCreateAnonId();
    setCurrentUser(uid);
    // Reload sessions scoped to this user
    setAllSessions(getSessions());
    setIsLoaded(true);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    loadRemoteSessions(userId).then((remote) => {
      if (remote.length === 0) return;
      const merged = mergeSessions(getSessions(), remote);
      merged.forEach((s) => saveSession(s));
      setAllSessions(getSessions());
    });
  }, [userId]);

  // ── Reload mood history — scoped to the logged-in user ─────────────────────
  const moodKey = userId ?? getOrCreateAnonId();
  useEffect(() => {
    getMoodHistory(moodKey).then(setMoodHistory);
  }, [moodKey]);

  // ── Theme toggle ──────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("soulsync_theme", theme);
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [theme]);

  // ── Save messages to localStorage + backend after every update ───────────
  const handleMessagesUpdate = useCallback(
    (messages: Message[]) => {
      const now      = new Date().toISOString();
      const existing = getSession(chatId);

      let updated: ChatSession;
      if (!existing) {
        if (messages.length === 0) return;
        const firstUser = messages.find((m) => m.role === "user");
        updated = {
          id:        chatId,
          title:     firstUser?.content.slice(0, 45) ?? "New Chat",
          messages,
          createdAt: now,
          updatedAt: now,
        };
      } else {
        updated = { ...existing, messages, updatedAt: now };
      }

      saveSession(updated);
      setAllSessions(getSessions());

      // Best-effort async backend sync
      const uid = userId ?? getOrCreateAnonId();
      saveRemoteSession(updated, uid);

      // Refresh mood after assistant reply
      const last = messages[messages.length - 1];
      if (last?.role === "assistant") getMoodHistory(moodKey).then(setMoodHistory);
    },
    [chatId, userId, moodKey]
  );

  // ── Navigation handlers ───────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    router.push(`/chat/${crypto.randomUUID()}`);
  }, [router]);

  const handleSelectChat = useCallback(
    (id: string) => {
      setActiveTab("chat");
      router.push(`/chat/${id}`);
    },
    [router]
  );

  const handleDeleteChat = useCallback(
    (id: string) => {
      deleteSession(id);
      deleteRemoteSession(id);           // also remove from backend
      setAllSessions(getSessions());
      if (id === chatId) {
        const remaining = getSessions();
        router.push(
          remaining.length > 0
            ? `/chat/${remaining[0].id}`
            : `/chat/${crypto.randomUUID()}`
        );
      }
    },
    [chatId, router]
  );

  const handleMoodMessage = useCallback((text: string) => {
    sendMoodRef.current?.(text);
    setActiveTab("chat");
  }, []);

  // ── Derive messages for the active chat ───────────────────────────────────
  const currentSession  = allSessions.find((s) => s.id === chatId) ?? null;
  const initialMessages = currentSession?.messages ?? [];

  return (
    <div style={{
      display: "flex", flexDirection: "row",
      width: "100vw", height: "100vh", overflow: "hidden",
      background: "var(--bg-0)",
    }}>

      {/* ── Left sidebar ─────────────────────────────── */}
      <div style={{ width: "240px", flexShrink: 0, height: "100%" }}>
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeChatId={chatId}
          sessions={allSessions}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
        />
      </div>

      {/* ── Centre panel ─────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, height: "100%", overflow: "hidden" }}>

        {activeTab === "chat" && isLoaded && (
          <ChatPanel
            key={chatId}
            sessionId={chatId}
            userId={moodKey}
            initialMessages={initialMessages}
            onMessagesUpdate={handleMessagesUpdate}
            onMoodMessage={(handler) => { sendMoodRef.current = handler; }}
          />
        )}

        {activeTab === "moodlogs" && (
          <div style={{ height: "100%" }}>
            <MoodLogsView moodHistory={moodHistory} />
          </div>
        )}

        {activeTab === "settings" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <div style={{
              background: "var(--bg-2)", border: "1px solid var(--border)",
              borderRadius: "16px", padding: "2rem", width: "360px",
            }}>
              <h2 style={{
                fontFamily: "Lora, serif", color: "var(--text-0)",
                marginBottom: "1.5rem", fontWeight: 500, fontSize: "1.25rem",
              }}>
                Settings
              </h2>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                paddingBottom: "1.25rem", borderBottom: "1px solid var(--border)",
              }}>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-0)", margin: 0 }}>
                    Appearance
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-2)", margin: "2px 0 0" }}>
                    {theme === "dark" ? "Dark theme" : "Light theme"}
                  </p>
                </div>
                <button
                  onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                  style={{
                    padding: "0.5rem 1rem", borderRadius: "8px",
                    border: "1px solid var(--border)", background: "var(--bg-3)",
                    color: "var(--text-0)", cursor: "pointer",
                    fontSize: "0.8rem", fontFamily: "DM Sans, sans-serif", fontWeight: 500,
                  }}
                >
                  {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
                </button>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-2)", marginTop: "1.25rem" }}>
                More preferences coming soon.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Right panel (chat tab only) ───────────────── */}
      {activeTab === "chat" && (
        <div style={{
          width: "300px", flexShrink: 0, height: "100%", overflowY: "auto",
          borderLeft: "1px solid var(--border)",
        }}>
          <RightPanel moodHistory={moodHistory} onSendMoodMessage={handleMoodMessage} />
        </div>
      )}
    </div>
  );
}
