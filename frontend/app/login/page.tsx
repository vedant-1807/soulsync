"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/chat");
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#090807",
      }}>
        <div style={{
          width: "24px", height: "24px", borderRadius: "50%",
          border: "2px solid #c4903a", borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#090807", fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>

      {/* ── Left: decorative panel ───────────────────── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
        padding: "3rem",
      }}>
        {/* Background glow orbs */}
        <div style={{
          position: "absolute", width: "500px", height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(196,144,58,0.08) 0%, transparent 70%)",
          top: "10%", left: "20%", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: "400px", height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(103,143,110,0.06) 0%, transparent 70%)",
          bottom: "15%", right: "10%", pointerEvents: "none",
        }} />

        {/* Heart icon */}
        <div style={{
          width: "80px", height: "80px", borderRadius: "20px",
          background: "linear-gradient(135deg, #c4903a, #e8b85a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "2rem",
          boxShadow: "0 12px 40px rgba(196,144,58,0.2)",
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191
                 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447
                 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"
              fill="#090807"
            />
          </svg>
        </div>

        <h1 style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: "2.75rem", fontWeight: 500,
          color: "#f0e8da", marginBottom: "0.75rem",
          letterSpacing: "-0.01em", textAlign: "center",
        }}>
          Soul<span style={{ color: "#c4903a" }}>Sync</span>
        </h1>

        <p style={{
          fontSize: "1.05rem", color: "#7a7060",
          maxWidth: "380px", textAlign: "center",
          lineHeight: 1.7, marginBottom: "3rem",
        }}>
          A safe space to talk, reflect, and find support.
          Your personal AI companion for mental wellness.
        </p>

        {/* Feature pills */}
        <div style={{
          display: "flex", gap: "0.75rem", flexWrap: "wrap",
          justifyContent: "center", maxWidth: "420px",
        }}>
          {[
            { icon: "🧠", text: "CBT-guided support" },
            { icon: "📊", text: "Mood tracking" },
            { icon: "🔒", text: "Private & secure" },
            { icon: "💬", text: "24/7 available" },
          ].map(({ icon, text }) => (
            <div key={text} style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              fontSize: "0.8rem", color: "#b5a98e",
            }}>
              <span style={{ fontSize: "0.9rem" }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>

        {/* Testimonial / quote */}
        <div style={{
          marginTop: "3.5rem", maxWidth: "360px", textAlign: "center",
        }}>
          <p style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: "0.95rem", fontStyle: "italic",
            color: "#4a4438", lineHeight: 1.7,
          }}>
            &ldquo;Sometimes the bravest thing you can do is ask for a little help.&rdquo;
          </p>
        </div>
      </div>

      {/* ── Right: login card ────────────────────────── */}
      <div style={{
        width: "480px", flexShrink: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "3rem 2.5rem",
        background: "#0e0d0b",
        borderLeft: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ width: "100%", maxWidth: "320px" }}>

          {/* Welcome text */}
          <h2 style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: "1.5rem", fontWeight: 500,
            color: "#f0e8da", marginBottom: "0.5rem",
          }}>
            Welcome back
          </h2>
          <p style={{
            fontSize: "0.875rem", color: "#7a7060",
            marginBottom: "2rem", lineHeight: 1.6,
          }}>
            Sign in to continue your journey. Your conversations and mood history are waiting.
          </p>

          {/* Google sign-in button */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/chat" })}
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "0.75rem",
              padding: "0.875rem 1.25rem",
              borderRadius: "12px",
              fontSize: "0.9rem", fontWeight: 500,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              background: "#f0e8da",
              color: "#1a1510",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#ffffff";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(196,144,58,0.2)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#f0e8da";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{
            display: "flex", alignItems: "center", gap: "1rem",
            margin: "1.75rem 0",
          }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
            <span style={{ fontSize: "0.7rem", color: "#4a4438", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              secure login
            </span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Trust signals */}
          <div style={{
            display: "flex", flexDirection: "column", gap: "0.75rem",
          }}>
            {[
              { icon: "🔒", text: "End-to-end encrypted conversations" },
              { icon: "🚫", text: "We never sell or share your data" },
              { icon: "🗑️", text: "Delete your data anytime" },
            ].map(({ icon, text }) => (
              <div key={text} style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                fontSize: "0.78rem", color: "#5a5040",
              }}>
                <span style={{ fontSize: "0.85rem" }}>{icon}</span>
                {text}
              </div>
            ))}
          </div>

          {/* Privacy note */}
          <div style={{
            marginTop: "2rem",
            padding: "1rem",
            borderRadius: "10px",
            background: "rgba(196,144,58,0.04)",
            border: "1px solid rgba(196,144,58,0.1)",
          }}>
            <p style={{
              fontSize: "0.72rem", color: "#7a7060",
              lineHeight: 1.65, margin: 0, textAlign: "center",
            }}>
              SoulSync is an AI support tool, not a substitute for professional mental health care.
              If you&apos;re in crisis, call <span style={{ color: "#c4903a", fontWeight: 600 }}>988</span> (US)
              or text <span style={{ color: "#c4903a", fontWeight: 600 }}>HOME to 741741</span>.
            </p>
          </div>

          {/* Terms */}
          <p style={{
            textAlign: "center", fontSize: "0.68rem",
            color: "#342f26", marginTop: "1.5rem",
          }}>
            By signing in you agree to our Terms&nbsp;of&nbsp;Service and Privacy&nbsp;Policy
          </p>
        </div>
      </div>
    </div>
  );
}
