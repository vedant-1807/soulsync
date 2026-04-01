"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "../lib/types";
import { AgentPanelView } from "./AgentPanel";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: "1rem" }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div style={{
          width: "30px", height: "30px", borderRadius: "8px",
          background: "linear-gradient(135deg, var(--gold), var(--gold-2))",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginRight: "0.625rem", flexShrink: 0, marginTop: "2px",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191
                 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447
                 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"
              fill="var(--bg-0)"
            />
          </svg>
        </div>
      )}

      <div style={{ maxWidth: "76%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{
          borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          padding: "0.75rem 1rem",
          fontSize: "0.875rem",
          lineHeight: 1.6,
          ...(isUser
            ? {
                background: "var(--gold)",
                color: "var(--bg-0)",
              }
            : {
                background: "var(--bg-2)",
                color: "var(--text-0)",
                border: "1px solid var(--border)",
              }
          ),
        }}>
          {isUser ? (
            <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
          ) : (
            <div className="prose-message">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {!isUser && message.panel && <AgentPanelView panel={message.panel} />}
        </div>

        <span style={{
          fontSize: "0.68rem", color: "var(--text-2)",
          marginTop: "0.25rem", padding: "0 0.25rem",
        }}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit", minute: "2-digit",
          })}
        </span>
      </div>

      {/* User avatar */}
      {isUser && (
        <div style={{
          width: "30px", height: "30px", borderRadius: "8px",
          background: "var(--bg-3)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginLeft: "0.625rem", flexShrink: 0, marginTop: "2px",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      )}
    </motion.div>
  );
}
