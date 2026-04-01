"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Send, Brain, HeartPulse, BookOpen, MapPin, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Message } from "../lib/types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { sendMessage } from "../lib/api";

const EXAMPLE_PROMPTS = [
  { icon: Brain,      label: "CBT techniques",  text: "I keep catastrophising about everything — how do I stop spiralling?" },
  { icon: HeartPulse, label: "Mood check-in",   text: "I've been feeling really low and drained this week." },
  { icon: BookOpen,   label: "Psychoeducation", text: "Can you explain what cognitive distortions are?" },
  { icon: MapPin,     label: "Find support",    text: "Help me find an affordable therapist in London." },
  { icon: Sparkles,   label: "Coping skills",   text: "What are some grounding techniques for acute anxiety?" },
];

interface ChatPanelProps {
  sessionId:         string;
  userId:            string;
  initialMessages?:  Message[];
  onMessagesUpdate?: (messages: Message[]) => void;
  onMoodMessage?:    (handler: (text: string) => void) => void;
}

export function ChatPanel({
  sessionId,
  userId,
  initialMessages = [],
  onMessagesUpdate,
  onMoodMessage,
}: ChatPanelProps) {
  const [messages, setMessages]   = useState<Message[]>(initialMessages);
  const [input, setInput]         = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => { onMessagesUpdate?.(messages); }, [messages]);

  useEffect(() => {
    onMoodMessage?.((text: string) => handleSend(text));
  }, []);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;

    setInput("");
    setError(null);

    const userMsg: Message = { id: uuidv4(), role: "user", content: msg, timestamp: new Date().toISOString() };
    const updatedMessages  = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res     = await sendMessage(msg, userId, history);
      const botMsg: Message = {
        id: uuidv4(), role: "assistant", content: res.answer,
        panel: res.panel, timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-0)" }}>

      {/* ── Message area ──────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1rem" }}>
        {messages.length === 0 ? (

          /* Welcome state */
          <motion.div
            style={{ maxWidth: "560px", margin: "2rem auto 0" }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "14px",
                background: "linear-gradient(135deg, var(--gold), var(--gold-2))",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1rem",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191
                       5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447
                       5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"
                    fill="var(--bg-0)"
                  />
                </svg>
              </div>
              <h2 style={{
                fontFamily: "Lora, serif", fontSize: "1.35rem", fontWeight: 500,
                color: "var(--text-0)", marginBottom: "0.5rem",
              }}>
                How are you feeling today?
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.6, maxWidth: "320px", margin: "0 auto" }}>
                I&apos;m here to listen and support you. Try one of these to get started:
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
              {EXAMPLE_PROMPTS.map(({ icon: Icon, label, text }, i) => (
                <motion.button
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => handleSend(text)}
                  style={{
                    textAlign: "left",
                    padding: "0.875rem 1rem",
                    borderRadius: "12px",
                    background: "var(--bg-2)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(196,144,58,0.4)";
                    (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-3)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-2)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                    <div style={{
                      width: "26px", height: "26px", borderRadius: "7px",
                      background: "rgba(196,144,58,0.12)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Icon size={13} color="var(--gold)" />
                    </div>
                    <p style={{
                      fontSize: "0.65rem", fontWeight: 600, color: "var(--gold)",
                      textTransform: "uppercase", letterSpacing: "0.08em", margin: 0,
                    }}>
                      {label}
                    </p>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-1)", lineHeight: 1.45, margin: 0, paddingLeft: "34px" }}>
                    {text}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>

        ) : (

          /* Message thread */
          <div style={{ maxWidth: "680px", margin: "0 auto" }}>
            <AnimatePresence initial={false}>
              {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
            </AnimatePresence>
            {isLoading && <TypingIndicator />}
            {error && (
              <div style={{ display: "flex", justifyContent: "center", padding: "0.5rem 0" }}>
                <span style={{
                  fontSize: "0.75rem", color: "var(--crisis)",
                  background: "rgba(184,84,72,0.12)",
                  border: "1px solid rgba(184,84,72,0.3)",
                  padding: "0.4rem 1rem", borderRadius: "999px",
                }}>{error}</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ─────────────────────────────────────── */}
      <div style={{
        background: "var(--bg-1)",
        borderTop: "1px solid var(--border)",
        padding: "0.875rem 1rem",
      }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{
            display: "flex", gap: "0.5rem", alignItems: "flex-end",
            padding: "0.375rem 0.375rem 0.375rem 0.75rem",
            borderRadius: "14px",
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(196,144,58,0.5)";
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
          }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your thoughts..."
              rows={1}
              disabled={isLoading}
              style={{
                flex: 1, background: "transparent", resize: "none",
                border: "none", outline: "none",
                fontSize: "0.875rem", color: "var(--text-0)",
                fontFamily: "DM Sans, sans-serif",
                lineHeight: 1.6, padding: "0.375rem 0",
                maxHeight: "140px", overflowY: "auto",
                opacity: isLoading ? 0.5 : 1,
              }}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              style={{
                flexShrink: 0,
                width: "36px", height: "36px",
                borderRadius: "10px",
                border: "none",
                cursor: !input.trim() || isLoading ? "not-allowed" : "pointer",
                background: !input.trim() || isLoading ? "var(--bg-3)" : "var(--gold)",
                color: !input.trim() || isLoading ? "var(--text-2)" : "var(--bg-0)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s",
                marginBottom: "1px",
              }}
              aria-label="Send"
            >
              <Send size={15} />
            </motion.button>
          </div>
          <p style={{
            fontSize: "0.68rem", color: "var(--text-2)",
            textAlign: "center", marginTop: "0.5rem",
          }}>
            Enter to send · Shift+Enter for new line ·{" "}
            <span style={{ fontWeight: 600, color: "var(--crisis)" }}>Call 988</span> if in crisis
          </p>
        </div>
      </div>
    </div>
  );
}
