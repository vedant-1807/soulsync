export function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "1rem" }}>
      {/* Avatar */}
      <div style={{
        width: "30px", height: "30px", borderRadius: "8px",
        background: "linear-gradient(135deg, var(--gold), var(--gold-2))",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginRight: "0.625rem", flexShrink: 0,
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

      {/* Bubble */}
      <div style={{
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        borderRadius: "14px 14px 14px 4px",
        padding: "0.625rem 0.875rem",
        display: "flex", alignItems: "center", gap: "0.375rem",
      }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-2)", marginRight: "2px" }}>
          SoulSync is thinking
        </span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: "6px", height: "6px",
              background: "var(--gold)",
              borderRadius: "50%",
              animation: "dot-bounce 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
              display: "inline-block",
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
