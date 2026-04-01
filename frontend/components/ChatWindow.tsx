"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Send, Brain, HeartPulse, BookOpen, MapPin, Sparkles } from "lucide-react";
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

interface ChatWindowProps {
  sessionId: string;
  initialMessages?: Message[];
  onMessagesUpdate?: (messages: Message[]) => void;
}

export function ChatWindow({ sessionId, initialMessages = [], onMessagesUpdate }: ChatWindowProps) {
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

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { id: uuidv4(), role: "user", content: msg, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const res = await sendMessage(msg, sessionId);
      setMessages((prev) => [
        ...prev,
        { id: uuidv4(), role: "assistant", content: res.answer, panel: res.panel, timestamp: new Date() },
      ]);
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
    <div className="flex flex-col h-full bg-[#f0f6ff]">

      {/* ── Messages ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (

          /* Welcome state */
          <div className="max-w-2xl mx-auto mt-6 animate-fade-in">
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-soul-500 flex items-center justify-center
                mx-auto mb-5 shadow-lg shadow-soul-200">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191
                       5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447
                       5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"
                    fill="white"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-slate-800 mb-2">
                How are you feeling today?
              </h1>
              <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                I&apos;m here to listen and support you with evidence-based techniques.
                Everything stays private. Try one of these to get started:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {EXAMPLE_PROMPTS.map(({ icon: Icon, label, text }) => (
                <button
                  key={label}
                  onClick={() => handleSend(text)}
                  className="group text-left p-4 rounded-2xl bg-white border border-slate-100
                    hover:border-soul-200 hover:shadow-md hover:shadow-soul-100
                    transition-all duration-200 active:scale-[0.98]"
                >
                  <div className="w-8 h-8 rounded-lg bg-soul-50 flex items-center justify-center
                    mb-3 group-hover:bg-soul-100 transition-colors">
                    <Icon size={16} className="text-soul-500" />
                  </div>
                  <p className="text-[10px] font-semibold text-soul-500 mb-1 uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="text-sm text-slate-600 leading-snug">{text}</p>
                </button>
              ))}
            </div>

            <div className="mt-8 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
              <p className="text-xs text-blue-500">
                SoulSync provides psychoeducational support only — not a substitute for
                professional mental health care.
              </p>
            </div>
          </div>

        ) : (

          /* Message thread */
          <div className="max-w-2xl mx-auto">
            {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
            {isLoading && <TypingIndicator />}
            {error && (
              <div className="flex justify-center py-2">
                <span className="text-xs text-red-600 bg-red-50 border border-red-100
                  px-4 py-2 rounded-full">
                  {error}
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ─────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-slate-100 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 items-end p-1.5 rounded-2xl bg-white border border-slate-200
            shadow-sm focus-within:border-soul-300 focus-within:ring-2
            focus-within:ring-soul-100 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share what's on your mind…"
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent resize-none px-3 py-2 text-sm text-slate-800
                placeholder-slate-400 focus:outline-none disabled:opacity-50
                max-h-36 overflow-y-auto leading-relaxed"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-9 h-9 mb-0.5 mr-0.5 rounded-xl bg-soul-500
                hover:bg-soul-600 disabled:bg-slate-100 disabled:text-slate-300
                text-white flex items-center justify-center
                transition-all duration-150 disabled:cursor-not-allowed active:scale-90"
              aria-label="Send"
            >
              <Send size={15} />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Enter to send · Shift+Enter for new line ·{" "}
            <span className="font-medium text-slate-500">Call 988</span> if in crisis
          </p>
        </div>
      </div>
    </div>
  );
}
