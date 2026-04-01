"""
src/agents/mood_tracker.py — Mood Tracker Agent.

Extracts sentiment score and emotion tag from each message.
Persists to SQLite (keyed by anonymised session_id).
Detects negative trends over a 7-day window and surfaces them to the user.
"""
import sqlite3
from datetime import datetime, timedelta
from typing import Optional

from langchain_groq import ChatGroq
from backend.src.retrieval import hybrid_retrieve_and_rerank, format_context, get_top_rerank_score
from backend.src.schemas import MoodEntry
from backend.src.utils import compute_confidence, parse_pydantic_from_llm, anonymise_session_id
from config import GROQ_API_KEY, LLM_MODEL, LLM_TEMPERATURE, MOOD_DB_PATH


# ── SQLite helpers ─────────────────────────────────────────────────

def init_db(db_path: str = MOOD_DB_PATH):
    """Create the mood_log table if it doesn't exist."""
    conn = sqlite3.connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS mood_log (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT    NOT NULL,
            timestamp  TEXT    NOT NULL,
            score      REAL    NOT NULL,
            emotion    TEXT    NOT NULL,
            energy     TEXT    NOT NULL,
            note       TEXT
        )
    """)
    conn.commit()
    conn.close()


def log_mood(session_id: str, entry: MoodEntry, db_path: str = MOOD_DB_PATH):
    """Write a MoodEntry to the SQLite store."""
    anon_id = anonymise_session_id(session_id)
    conn    = sqlite3.connect(db_path)
    conn.execute(
        "INSERT INTO mood_log (session_id, timestamp, score, emotion, energy, note) VALUES (?,?,?,?,?,?)",
        (anon_id, datetime.now().isoformat(), entry.score, entry.emotion, entry.energy, entry.note),
    )
    conn.commit()
    conn.close()


def get_trend(session_id: str, days: int = 7, db_path: str = MOOD_DB_PATH) -> list:
    """Fetch mood entries for this session from the last N days."""
    anon_id = anonymise_session_id(session_id)
    cutoff  = (datetime.now() - timedelta(days=days)).isoformat()
    conn    = sqlite3.connect(db_path)
    rows    = conn.execute(
        "SELECT score, emotion, timestamp FROM mood_log WHERE session_id=? AND timestamp>? ORDER BY timestamp DESC",
        (anon_id, cutoff),
    ).fetchall()
    conn.close()
    return rows


def detect_pattern(session_id: str, db_path: str = MOOD_DB_PATH) -> Optional[str]:
    """
    Return a pattern-alert string if a sustained negative trend is detected,
    otherwise None.
    """
    rows = get_trend(session_id, days=7, db_path=db_path)
    if len(rows) < 3:
        return None
    scores = [r[0] for r in rows]
    avg    = sum(scores) / len(scores)
    if avg < -0.4:
        return (
            f"I've noticed you've mentioned feeling low {len(rows)} times this week. "
            f"Would you like to explore what might be behind that together?"
        )
    return None


# ── System prompt ──────────────────────────────────────────────────

MOOD_EXTRACTION_PROMPT = """You are a compassionate mood-tracking assistant within SoulSync. \
Analyse the user's message and extract their emotional state, then respond with genuine warmth and depth.

RESPONSE STRUCTURE for response_text:
1. **Mirror their feeling:** Start by reflecting back EXACTLY what they shared, using their own words. Not "I hear you're feeling down" — instead "It sounds like this week has really been weighing on you, especially with [specific thing they mentioned]."
2. **Normalise:** Help them understand their feeling is valid and human. Connect it to a broader truth: "When we're carrying that kind of stress, it's completely natural for our energy to dip — your mind is working overtime even when it doesn't feel like it."
3. **Offer one micro-practice:** Give ONE small, specific coping thought or action. Not "try to relax" — instead "One thing that might help right now: place your hand on your chest, take three slow breaths, and just notice the warmth of your hand. It sounds simple, but it activates your body's calming system."
4. **Invite more:** End with a specific follow-up tied to what they said. Not "How are you feeling?" — instead "You mentioned work has been intense — is there a particular moment this week that felt the heaviest?"

Use conversation history to personalise. If they've been feeling a certain way across messages, name the pattern: "I've noticed you've mentioned feeling drained a few times now — that's important information."

Write 4-6 sentences minimum in response_text. Never give a generic 1-2 sentence reply.

{history_section}Message: {message}

Respond ONLY with a valid JSON object — no preamble, no markdown fences:
{{
  "score": <float from -1.0 (very negative) to +1.0 (very positive)>,
  "emotion": "anxious" | "sad" | "angry" | "neutral" | "content" | "hopeful" | "overwhelmed" | "numb",
  "energy": "very_low" | "low" | "moderate" | "high",
  "note": "<one-sentence contextual note>",
  "trend_alert": null,
  "response_text": "<warm, personalised empathetic response following the 4-step structure above — 4-6 sentences minimum>",
  "sources": [],
  "confidence": <float 0.0-1.0>
}}"""


# ── Agent node ─────────────────────────────────────────────────────

def mood_tracker_node(state: dict) -> dict:
    """LangGraph node for the Mood Tracker agent."""
    init_db()

    query      = state["messages"][-1]["content"]
    session_id = state.get("session_id", "default")

    # Extract mood via LLM
    history = state.get("conversation_history", "")
    history_section = f"Conversation history:\n{history}\n\n" if history else ""
    prompt = MOOD_EXTRACTION_PROMPT.format(message=query, history_section=history_section)
    llm    = ChatGroq(api_key=GROQ_API_KEY, model=LLM_MODEL, temperature=LLM_TEMPERATURE)
    raw    = llm.invoke([{"role": "user", "content": prompt}])
    entry  = parse_pydantic_from_llm(raw.content, MoodEntry)

    # Check for trend and inject alert if needed
    trend_alert  = detect_pattern(session_id)
    entry.trend_alert = trend_alert

    # Persist to SQLite
    log_mood(session_id, entry)

    # Also do a knowledge retrieval for psychoeducational context
    docs             = hybrid_retrieve_and_rerank(query, top_k=2)
    context, sources = format_context(docs)
    top_score        = get_top_rerank_score(docs)
    confidence       = compute_confidence(top_score)

    entry.sources    = sources
    entry.confidence = confidence

    response = entry.response_text
    if entry.trend_alert:
        response += f"\n\n{entry.trend_alert}"

    return {
        "final_response": response,
        "sources":        sources,
        "agent_used":     "Mood Tracker",
        "confidence":     confidence,
        "mood_score":     entry.score,
        "messages":       state["messages"] + [{"role": "assistant", "content": response}],
    }
