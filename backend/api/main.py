"""
api/main.py — FastAPI backend for the Next.js frontend.

Wraps the LangGraph pipeline in a clean REST API.
Run: uvicorn api.main:app --reload --port 8000
"""
import uuid, sqlite3, hashlib, os, json
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from backend.src.graph import build_graph, make_initial_state
from backend.src.utils import sanitise_input, safe_response, format_explainability_panel
from config import MOOD_DB_PATH, CHAT_DB_PATH

app   = FastAPI(title="SoulSync API", version="3.0")
graph = build_graph()

# Allow dev servers + production frontend (set FRONTEND_URL env var on Render)
_allowed_origins = ["http://localhost:3000", "http://localhost:8000"]
_frontend_url = os.environ.get("FRONTEND_URL", "")
if _frontend_url:
    _allowed_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve the static HTML frontend from soulsync/static/
_static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.isdir(_static_dir):
    app.mount("/static", StaticFiles(directory=_static_dir), name="static")


@app.get("/")
async def root():
    index_path = os.path.join(_static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "SoulSync API v3.0 — place index.html in soulsync/static/"}


def _format_history(history: list[dict], max_turns: int = 10) -> str:
    """Formats the last N turns into a plain-text string for prompt injection."""
    lines = []
    for m in history[-max_turns:]:
        role    = "User" if m.get("role") == "user" else "Assistant"
        content = m.get("content", "")[:800]
        lines.append(f"{role}: {content}")
    return "\n".join(lines)


# ── Chat endpoints ────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message:    str
    session_id: str        = ""
    history:    list[dict] = []


class AgentPanelResponse(BaseModel):
    agent_used:       str
    sources:          list[str]
    confidence:       float
    retrieval_method: str


class ChatResponse(BaseModel):
    answer:     str
    session_id: str
    panel:      AgentPanelResponse


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    message    = sanitise_input(req.message)
    session_id = req.session_id or str(uuid.uuid4())
    history    = _format_history(req.history)

    initial_state = make_initial_state(message, session_id, conversation_history=history)
    result        = graph.invoke(initial_state)

    answer = safe_response(result["final_response"])

    return ChatResponse(
        answer=answer,
        session_id=session_id,
        panel=AgentPanelResponse(
            agent_used=result.get("agent_used", "SoulSync"),
            sources=result.get("sources", []),
            confidence=round(result.get("confidence", 0.0), 2),
            retrieval_method="hybrid",
        ),
    )


# ── Mood history ──────────────────────────────────────────────────────────────

@app.get("/mood-history/{session_id}")
async def mood_history(session_id: str):
    """Returns the last 7 days of mood entries for a session."""
    if not os.path.exists(MOOD_DB_PATH):
        return []

    anon_id = hashlib.sha256(session_id.encode()).hexdigest()[:16]
    cutoff  = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    try:
        con = sqlite3.connect(MOOD_DB_PATH)
        rows = con.execute(
            "SELECT timestamp, score, emotion, note FROM mood_log "
            "WHERE session_id = ? AND timestamp >= ? ORDER BY timestamp",
            (anon_id, cutoff),
        ).fetchall()
        con.close()
    except Exception:
        return []

    return [{"timestamp": r[0], "score": r[1], "emotion": r[2], "note": r[3] or ""} for r in rows]


# ── Chat session persistence ──────────────────────────────────────────────────


def _init_chat_db() -> None:
    con = sqlite3.connect(CHAT_DB_PATH)
    con.execute("""
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id         TEXT PRIMARY KEY,
            user_id    TEXT NOT NULL,
            title      TEXT NOT NULL DEFAULT 'New Chat',
            messages   TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    con.execute(
        "CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_sessions(user_id)"
    )
    con.commit()
    con.close()


_init_chat_db()


class ChatSessionUpsert(BaseModel):
    user_id:    str
    title:      str
    messages:   list[dict]
    created_at: str
    updated_at: str


@app.get("/chat-sessions/{user_id}")
async def list_chat_sessions(user_id: str):
    """Return all chat sessions for a user, newest first."""
    con = sqlite3.connect(CHAT_DB_PATH)
    rows = con.execute(
        "SELECT id, title, messages, created_at, updated_at "
        "FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC",
        (user_id,),
    ).fetchall()
    con.close()
    return [
        {
            "id":        r[0],
            "title":     r[1],
            "messages":  json.loads(r[2]),
            "createdAt": r[3],
            "updatedAt": r[4],
        }
        for r in rows
    ]


@app.put("/chat-sessions/{session_id}")
async def upsert_chat_session(session_id: str, body: ChatSessionUpsert):
    """Create or update a chat session."""
    con = sqlite3.connect(CHAT_DB_PATH)
    con.execute(
        """
        INSERT INTO chat_sessions (id, user_id, title, messages, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            title      = excluded.title,
            messages   = excluded.messages,
            updated_at = excluded.updated_at
        """,
        (
            session_id,
            body.user_id,
            body.title,
            json.dumps(body.messages),
            body.created_at,
            body.updated_at,
        ),
    )
    con.commit()
    con.close()
    return {"ok": True}


@app.delete("/chat-sessions/{session_id}")
async def delete_chat_session(session_id: str):
    """Delete a chat session."""
    con = sqlite3.connect(CHAT_DB_PATH)
    con.execute("DELETE FROM chat_sessions WHERE id = ?", (session_id,))
    con.commit()
    con.close()
    return {"ok": True}


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "version": "3.0"}
