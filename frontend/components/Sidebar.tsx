"use client";

import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Activity,
  Settings,
  User,
  LogOut,
  Plus,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { ChatSession } from "../lib/types";

/* ── Types ────────────────────────────────────────────────────── */
export type NavTab = "chat" | "moodlogs" | "settings";

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ElementType }[] = [
  { id: "moodlogs", label: "Mood Logs", icon: Activity },
  { id: "settings", label: "Settings",  icon: Settings },
];

/* ── Props ────────────────────────────────────────────────────── */
interface SidebarProps {
  activeTab:    NavTab;
  onTabChange:  (tab: NavTab) => void;
  activeChatId: string;
  sessions:     ChatSession[];
  onNewChat:    () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

/* ── Component ────────────────────────────────────────────────── */
export function Sidebar({
  activeTab,
  onTabChange,
  activeChatId,
  sessions,
  onNewChat,
  onSelectChat,
  onDeleteChat,
}: SidebarProps) {
  const { data: session, status } = useSession();
  const isLoading  = status === "loading";
  const isSignedIn = status === "authenticated" && !!session?.user;

  return (
    <div style={{
      width: "240px",
      background: "var(--bg-1)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      flexShrink: 0,
    }}>

      {/* ── Top: brand + new chat ─────────────────────── */}
      <div style={{ padding: "1.25rem 1rem 0.75rem", flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "9px",
            background: "linear-gradient(135deg, var(--gold), var(--gold-2))",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191
                   5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447
                   5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"
                fill="var(--bg-0)"
              />
            </svg>
          </div>
          <span style={{
            fontFamily: "Lora, serif", fontSize: "1.05rem",
            fontWeight: 500, color: "var(--text-0)", letterSpacing: "0.01em",
          }}>
            SoulSync
          </span>
        </div>

        {/* + New Chat button */}
        <button
          onClick={onNewChat}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            width: "100%", padding: "0.55rem 0.75rem",
            borderRadius: "8px",
            border: "1px solid rgba(196,144,58,0.35)",
            background: "rgba(196,144,58,0.1)",
            color: "var(--gold)",
            cursor: "pointer",
            fontSize: "0.82rem",
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 500,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(196,144,58,0.2)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(196,144,58,0.1)"; }}
        >
          <Plus size={14} />
          New Chat
        </button>
      </div>

      {/* ── Scrollable middle: chat history + nav ─────── */}
      <div style={{
        flex: 1, minHeight: 0, overflowY: "auto",
        display: "flex", flexDirection: "column",
        padding: "0 0.75rem",
      }}>

        {/* Chat history list */}
        {sessions.length > 0 && (
          <div style={{ marginBottom: "0.5rem" }}>
            <p style={{
              fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "var(--text-2)",
              padding: "0.5rem 0.375rem 0.375rem", margin: 0,
            }}>
              Chats
            </p>
            {sessions.map((s, idx) => {
              const isActive = s.id === activeChatId && activeTab === "chat";
              return (
                <div
                  key={s.id ?? `session-${idx}`}
                  className="chat-history-item"
                  style={{
                    display: "flex", alignItems: "center", gap: "0.375rem",
                    borderRadius: "7px",
                    background: isActive ? "rgba(196,144,58,0.13)" : "transparent",
                    transition: "background 0.12s",
                    marginBottom: "1px",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
                    const btn = e.currentTarget.querySelector(".delete-btn") as HTMLButtonElement | null;
                    if (btn) btn.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    const btn = e.currentTarget.querySelector(".delete-btn") as HTMLButtonElement | null;
                    if (btn) btn.style.opacity = "0";
                  }}
                >
                  <button
                    onClick={() => onSelectChat(s.id)}
                    style={{
                      flex: 1, minWidth: 0,
                      display: "flex", alignItems: "center", gap: "0.5rem",
                      padding: "0.45rem 0.5rem",
                      background: "none", border: "none", cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <MessageSquare
                      size={13}
                      color={isActive ? "var(--gold)" : "var(--text-2)"}
                      style={{ flexShrink: 0 }}
                    />
                    <span style={{
                      fontSize: "0.8rem",
                      color: isActive ? "var(--gold)" : "var(--text-1)",
                      fontWeight: isActive ? 500 : 400,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {s.title}
                    </span>
                  </button>
                  <button
                    className="delete-btn"
                    onClick={(e) => { e.stopPropagation(); onDeleteChat(s.id); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      padding: "0.3rem 0.4rem 0.3rem 0",
                      color: "var(--text-2)",
                      display: "flex", alignItems: "center",
                      opacity: 0,
                      transition: "opacity 0.12s, color 0.12s",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--crisis)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; }}
                    title="Delete chat"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Spacer pushes nav items to bottom */}
        <div style={{ flex: 1 }} />

        {/* Secondary nav: Mood Logs + Settings */}
        <div style={{ paddingBottom: "0.75rem" }}>
          <p style={{
            fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.08em", color: "var(--text-2)",
            padding: "0.5rem 0.375rem 0.375rem", margin: 0,
          }}>
            More
          </p>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.5rem 0.625rem", borderRadius: "7px",
                border: "none", cursor: "pointer",
                fontSize: "0.82rem", fontFamily: "DM Sans, sans-serif",
                fontWeight: activeTab === id ? 500 : 400,
                background: activeTab === id ? "rgba(196,144,58,0.13)" : "transparent",
                color: activeTab === id ? "var(--gold)" : "var(--text-2)",
                width: "100%", textAlign: "left",
                transition: "all 0.12s ease",
                marginBottom: "1px",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== id) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-1)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== id) {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)";
                }
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Footer: auth block ────────────────────────── */}
      <div style={{
        borderTop: "1px solid var(--border)",
        padding: "0.875rem 1rem",
        flexShrink: 0,
      }}>
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "var(--bg-3)" }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: "9px", width: "72px", borderRadius: "4px", background: "var(--bg-3)", marginBottom: "5px" }} />
              <div style={{ height: "7px", width: "52px", borderRadius: "4px", background: "var(--bg-2)" }} />
            </div>
          </div>
        ) : isSignedIn ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {session.user?.image ? (
              <Image
                src={session.user.image}
                alt=""
                width={30}
                height={30}
                style={{ borderRadius: "50%", border: "2px solid var(--gold)", flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: "30px", height: "30px", borderRadius: "50%",
                background: "var(--bg-3)", display: "flex", alignItems: "center",
                justifyContent: "center", flexShrink: 0,
              }}>
                <User size={13} color="var(--text-2)" />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: "0.78rem", fontWeight: 500, color: "var(--text-0)",
                margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {session.user?.name ?? "User"}
              </p>
              <p style={{
                fontSize: "0.68rem", color: "var(--text-2)", margin: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {session.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              aria-label="Sign out"
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "3px", borderRadius: "5px", color: "var(--text-2)",
                display: "flex", alignItems: "center",
                transition: "color 0.12s", flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--crisis)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; }}
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn("google")}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: "none", border: "none", cursor: "pointer",
              width: "100%", textAlign: "left", padding: 0,
            }}
          >
            <div style={{
              width: "30px", height: "30px", borderRadius: "50%",
              background: "var(--bg-3)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <User size={13} color="var(--text-2)" />
            </div>
            <div>
              <p style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--text-1)", margin: 0 }}>
                Private session
              </p>
              <p style={{ fontSize: "0.68rem", color: "var(--text-2)", margin: 0 }}>
                Sign in with Google
              </p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
