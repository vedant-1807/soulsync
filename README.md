# SoulSync — AI Mental Health Companion

> A multi-agent, knowledge-grounded AI companion for emotional reflection, CBT-style support, mood tracking, and crisis-aware conversation — built with empathy and safety at the core.

**Live Demo:** https://soulsync-hqjz.vercel.app/

---

## Overview

SoulSync is a full-stack AI application that supports mental well-being through thoughtful, context-aware conversation. Rather than routing every message through a single prompt, SoulSync uses a **LangGraph multi-agent system**: a supervisor classifies each message and dispatches it to a specialist agent (CBT, Mood, Crisis, Resource, General, or Greeting), each grounded in a retrieval pipeline over a curated mental-health knowledge base.

The project explores how open models can be applied responsibly in emotionally sensitive contexts, with careful attention to routing, retrieval grounding, response tone, and user safety. Every message passes through a mandatory crisis pre-check before anything else runs.

---

## Features

- **Multi-Agent Routing** — A supervisor LLM classifies each message and routes it to the right specialist agent
- **CBT Agent** — Walks users through evidence-based CBT exercises (thought records, Socratic questioning, behavioural activation, grounding) using their own words
- **Mood Tracking** — Extracts a sentiment score and emotion tag from each message, persists it, and surfaces 7-day trends and patterns
- **Crisis Detection** — Two-stage pipeline (fast regex pre-filter + contextual LLM assessment) that distinguishes genuine crisis from figurative language and surfaces real helplines
- **Resource Finder** — Uses live web search to find therapists, helplines, and apps relevant to the user's location and needs
- **Knowledge-Grounded Answers** — Hybrid retrieval (semantic + keyword) with cross-encoder reranking over a vetted document base
- **Explainability** — Every response reports which agent handled it, which sources were retrieved, and a confidence score
- **Real-time Responses** — Low-latency inference via Groq

---

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | Llama 3 (Llama 3.1 8B / Llama 3.3 70B) via Groq |
| Orchestration | LangGraph, LangChain |
| Retrieval | ChromaDB, hybrid BM25 + semantic search, cross-encoder reranking |
| Embeddings | `all-MiniLM-L6-v2` (sentence-transformers); `ms-marco-MiniLM-L-6-v2` cross-encoder |
| Web Search | Tavily |
| Backend | Python, FastAPI (REST), Gradio (demo UI) |
| Persistence | SQLite (mood log + chat sessions) |
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Auth | NextAuth (Google OAuth) |
| Observability | LangSmith |
| Evaluation | pytest, LLM-as-judge |
| Deployment | Vercel (frontend) · Render (backend) |

> **Note:** SoulSync runs entirely on open Llama models served through Groq — there is no dependency on OpenAI. The model is configurable via the `LLM_MODEL` environment variable (the demo backend runs `llama-3.3-70b-versatile`).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          User                                │
│              Next.js + React (Vercel) · Google OAuth          │
└───────────────────────────────┬──────────────────────────────┘
                                │ REST  (/chat, /mood-history, /chat-sessions)
┌───────────────────────────────▼──────────────────────────────┐
│                   FastAPI Backend  (Render)                    │
│   sanitise input → invoke LangGraph → explainability panel     │
└───────────────────────────────┬──────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────┐
│                  LangGraph Multi-Agent Graph                   │
│                                                                │
│   START → crisis_precheck (regex, every message)              │
│              ├─[flagged]→ Crisis Agent ───────────────→ END    │
│              └─[safe]→ Supervisor (LLM router)                 │
│                          ├─ GREETING → Greeting Node → END     │
│                          ├─ CBT      → CBT Agent     → END     │
│                          ├─ CRISIS   → Crisis Agent  → END     │
│                          ├─ MOOD     → Mood Tracker  → END     │
│                          ├─ RESOURCE → Resource Finder → END   │
│                          └─ GENERAL  → General RAG   → END     │
└───────────────────────────────┬──────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────┐
│                       Supporting Layers                        │
│                                                                │
│   LLM:        Llama 3 via Groq                                 │
│   Retrieval:  ChromaDB → BM25 + semantic → cross-encoder rerank│
│   Search:     Tavily (Resource Finder only)                    │
│   Storage:    SQLite (mood_log, chat_sessions)                 │
│   Tracing:    LangSmith                                        │
└───────────────────────────────────────────────────────────────┘
```

### How a request flows

1. **User sends a message** in the chat UI (Next.js frontend), authenticated via Google.
2. The frontend **POSTs to the FastAPI `/chat` endpoint** with the message, session ID, and conversation history.
3. The backend **sanitises the input** (prompt-injection guarding, length capping) and builds the initial graph state.
4. The **crisis pre-check node runs first on every message** — a zero-LLM-cost regex filter. If it flags, the message is routed straight to the **Crisis Agent**, bypassing normal routing.
5. Otherwise the **Supervisor** (an LLM classifier) routes the message into one of six categories and dispatches it to the matching specialist agent.
6. Specialist agents that need grounding run **hybrid retrieval and reranking** against the relevant slice of the ChromaDB knowledge base; the Resource Finder instead queries **Tavily** for live results.
7. The chosen agent produces a structured response (validated against Pydantic schemas). The response is returned with an **explainability panel** (agent used, sources, confidence, retrieval method).
8. **Mood is logged for every message** — either by the Mood Tracker itself, or by a lightweight background extractor for messages routed elsewhere — and surfaced in the mood views.

### The agents

| Agent | Responsibility |
|---|---|
| **Supervisor** | LLM router that classifies each message into GREETING / CBT / CRISIS / MOOD / RESOURCE / GENERAL |
| **Crisis Agent** | Stage-2 contextual assessment of flagged messages; returns warm, resource-rich responses and errs toward caution |
| **CBT Agent** | Detects cognitive distortions and guides the user through a fitting CBT technique step by step |
| **Mood Tracker** | Extracts score/emotion/energy, persists to SQLite, and detects sustained negative trends over a 7-day window |
| **Resource Finder** | Extracts location, searches via Tavily, and structures therapist / helpline / app recommendations |
| **General RAG** | Psychoeducation and general mental-health questions, grounded in the knowledge base |

### Key design decisions

| Decision | Reasoning |
|---|---|
| LangGraph multi-agent over a single prompt | Each concern (CBT, crisis, mood, resources) gets a focused, testable agent with its own prompt and retrieval scope |
| Mandatory regex crisis pre-check on every message | A safety net that runs before routing and at zero LLM cost, so a crisis can never be misrouted |
| Two-stage crisis detection | Regex catches keywords cheaply; a follow-up LLM pass separates genuine crisis from figurative language ("this is killing me") |
| Hybrid retrieval + cross-encoder reranking | Combines keyword (BM25) and semantic recall, then reranks for precision — better grounding than vector search alone |
| Llama via Groq | Open-weight models with very low inference latency for a real-time chat feel; no proprietary-API lock-in |
| Pydantic-validated agent outputs | Structured, schema-checked responses with safe fallbacks when parsing fails |
| FastAPI for the app, Gradio for the demo | FastAPI serves the production Next.js frontend; Gradio gives a zero-frontend way to demo the full pipeline |
| Anonymised session IDs for mood storage | Mood history is keyed by a hashed session ID, never raw identifiers |

---

## Project Structure

```
soulsync/
├── backend/
│   ├── api/main.py          # FastAPI REST API for the Next.js frontend
│   ├── app.py               # Gradio demo app (full pipeline, no frontend)
│   ├── config.py            # Centralised configuration
│   ├── src/
│   │   ├── graph.py         # LangGraph orchestration + supervisor router
│   │   ├── retrieval.py     # Hybrid retrieval + cross-encoder reranking
│   │   ├── safety.py        # Crisis patterns + assessment prompt
│   │   ├── ingest.py        # PDF → ChromaDB ingestion pipeline
│   │   ├── schemas.py       # Pydantic response schemas
│   │   ├── memory.py        # Conversation memory
│   │   ├── utils.py         # Sanitisation, confidence, anonymisation
│   │   └── agents/          # CBT, Crisis, Mood, Resource agents
│   ├── docs/                # Knowledge base (cbt / crisis / general PDFs)
│   └── requirements.txt
├── frontend/                # Next.js app, React components, Tailwind
│   ├── app/                 # Routes: chat, mood, login, auth
│   ├── components/          # Chat UI, mood charts/heatmap, agent panel
│   └── lib/                 # API client, auth, types
├── evals/                   # pytest suites + LLM-as-judge
└── README.md
```

---

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/vedant-1807/soulsync.git
cd soulsync
```

### 2. Backend setup

```bash
cd backend
python -m venv venv

# Activate virtual environment
source venv/bin/activate      # macOS / Linux
venv\Scripts\activate         # Windows

pip install -r requirements.txt
```

Build the vector index from the knowledge base (run once, or whenever the docs change):

```bash
python src/ingest.py
```

Run the API for the frontend:

```bash
uvicorn api.main:app --reload --port 8000
```

Or run the standalone Gradio demo (full pipeline, no frontend needed):

```bash
python app.py        # opens at http://localhost:7860
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev          # opens at http://localhost:3000
```

### 4. Environment variables

**`backend/.env`**

```env
GROQ_API_KEY=your_groq_key
TAVILY_API_KEY=your_tavily_key
LLM_MODEL=llama-3.3-70b-versatile     # or llama-3.1-8b-instant
LLM_TEMPERATURE=0.4
FRONTEND_URL=http://localhost:3000     # comma-separate for multiple origins
```

**`frontend/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## Testing & Evaluation

SoulSync ships with a test and evaluation suite under `evals/`:

```bash
pytest evals/
```

- **`test_safety.py`** — crisis-detection true/false positives, input sanitisation, and session-ID anonymisation
- **`test_routing.py`** — supervisor routing accuracy across intent categories
- **`test_cbt_agent.py`** — cognitive-distortion classification
- **`llm_judge.py`** — LLM-as-judge scoring of responses on **empathy**, **safety**, and **grounding**, with a disclaimer check (a response passes only if all three score ≥ 0.7 and a disclaimer is present)

---

## Knowledge Base

The retrieval layer is grounded in a curated set of mental-health documents organised into three categories — `cbt/`, `crisis/`, and `general/` — including clinical guides and research literature (e.g. CBT manuals and 988 Lifeline clinical standards). Documents are chunked, embedded, and indexed into ChromaDB by `src/ingest.py`, with category metadata used for per-agent filtered retrieval. See `backend/docs/SOURCES.txt` for attribution.

---

## Motivation

I built SoulSync while my mother was living with cancer and the depression that came with it. I saw how much of that weight is carried in the quiet hours — the moments between appointments when there's no one to talk to. I wanted to make something that could simply be present in those moments: a gentle companion to reflect with, not a replacement for the doctors, family, and professionals who actually care for someone.

That motivation shaped every engineering decision. Responses had to feel human and contextual, never generic or robotic. Safety could not be an afterthought — which is why a crisis pre-check runs on every single message, why answers are grounded in vetted sources rather than improvised, and why an evaluation loop scores responses on empathy, safety, and grounding. The multi-agent architecture exists because supporting someone well means doing several different things carefully, not one thing vaguely.

SoulSync is an exercise in building AI that actually serves people — and in taking the engineering of safety, grounding, and evaluation as seriously as the conversation itself.

---

## Disclaimer

SoulSync is a personal project and is **not a substitute for professional mental health care**. If you or someone you know is struggling, please reach out to a qualified professional or a trusted person in your life. In the US, you can call or text **988** (Suicide & Crisis Lifeline) any time.

---

## Author

**Vedant Bhenia** — MS in Applied Data Science, USC
[GitHub](https://github.com/vedant-1807)

If you found this useful or interesting, a ⭐ on the repo is appreciated.
