"""
config.py — centralised configuration
"""

from dotenv import load_dotenv
import os

load_dotenv()

# ── LLM ───────────────────────────────────────────────────────────
GROQ_API_KEY      = os.getenv("GROQ_API_KEY")
LLM_MODEL         = os.getenv("LLM_MODEL", "llama3-8b-8192")
LLM_TEMPERATURE   = float(os.getenv("LLM_TEMPERATURE", "0.3"))

# ── Web Search ────────────────────────────────────────────────────
TAVILY_API_KEY    = os.getenv("TAVILY_API_KEY")

# ── Embeddings + Retrieval ────────────────────────────────────────
EMBEDDING_MODEL   = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
RETRIEVER_TOP_K   = int(os.getenv("RETRIEVER_TOP_K", "3"))

# ── Memory ────────────────────────────────────────────────────────
MEMORY_WINDOW     = int(os.getenv("MEMORY_WINDOW", "6"))

# ── Paths (ROBUST) ────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))   # backend/
PROJECT_ROOT = os.path.dirname(BASE_DIR)                # soulsync/

DATA_DIR      = os.path.join(BASE_DIR, "data")   # backend/data/
DOCS_BASE_DIR = os.path.join(BASE_DIR, "docs")   # backend/docs/

# ── Storage (FINAL) ───────────────────────────────────────────────
CHROMA_PERSIST_DIR = os.getenv(
    "CHROMA_PERSIST_DIR",
    os.path.join(DATA_DIR, "chroma_db")
)

DOCS_DIR = os.getenv(
    "DOCS_DIR",
    DOCS_BASE_DIR
)

MOOD_DB_PATH = os.getenv(
    "MOOD_DB_PATH",
    os.path.join(DATA_DIR, "mood_store.db")
)

CHAT_DB_PATH = os.getenv(
    "CHAT_DB_PATH",
    os.path.join(DATA_DIR, "chat_sessions.db")
)

# Ensure directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)