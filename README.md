# SoulSync — AI Mental Health Companion

> A conversational AI companion for emotional reflection, mood tracking, and mindfulness — built with empathy at the core.

**Live Demo:** https://soulsync-hqjz.vercel.app/

---

## Overview

SoulSync is a full-stack AI application designed to support mental well-being through thoughtful, context-aware conversation. Users can talk through their thoughts, log their mood over time, and receive grounding suggestions — all within a calm, private interface.

The project explores how large language models can be applied responsibly in emotionally sensitive contexts, with careful attention to prompt design, response tone, and user safety.

---

## Features

- **AI Reflection Chat** — Conversational companion that maintains context and responds with empathy
- **Mood Tracking** — Log emotional states over time and surface patterns
- **Mindfulness Suggestions** — Contextual grounding techniques based on conversation tone
- **Crisis Detection** — Identifies emotionally sensitive situations and adjusts responses accordingly
- **Real-time Responses** — Low-latency inference via Groq

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI |
| Frontend | React, Next.js, Tailwind CSS |
| AI / LLM | OpenAI API, Groq |
| Deployment | Vercel |

### AI Design
- Prompt engineering for empathetic, non-clinical responses
- Conversation context handling across multi-turn sessions
- Sensitive topic detection with fallback response logic

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                      User                        │
│                  (Browser / Web)                 │
└──────────────────────┬──────────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────────┐
│              Frontend  (Next.js + React)          │
│  ┌────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │  Chat UI   │  │ Mood Tracker│  │ Settings  │ │
│  └────────────┘  └─────────────┘  └───────────┘ │
└──────────────────────┬──────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────┐
│               Backend  (FastAPI)                  │
│  ┌────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │ API Router │→ │Prompt Engine│→ │  Crisis   │ │
│  │            │  │             │  │ Detector  │ │
│  └────────────┘  └─────────────┘  └───────────┘ │
└──────────────────────┬──────────────────────────┘
                       │ API call
┌──────────────────────▼──────────────────────────┐
│                   AI Layer                        │
│  ┌────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │ Groq API   │  │ OpenAI API  │  │  Prompt   │ │
│  │(low latency│  │ (fallback)  │  │ Templates │ │
│  └────────────┘  └─────────────┘  └───────────┘ │
└─────────────────────────────────────────────────┘
                    Deployed on Vercel
```

### How a request flows

1. **User sends a message** in the chat UI (Next.js frontend).
2. The frontend **POSTs to the FastAPI backend** with the message and conversation history.
3. The **API Router** validates the request and passes it to the **Prompt Engine**.
4. The Prompt Engine **constructs a context-aware prompt** — injecting conversation history, user preferences, and tone instructions. It also checks the message against the **Crisis Detector**, which flags sensitive keywords and injects a safety-aware system prompt if needed.
5. The engineered prompt is **sent to the LLM** (Groq for low latency, OpenAI as fallback).
6. The response is **streamed back** to the frontend and rendered in the chat view.
7. Mood data is stored locally and surfaced in the **Mood Tracker** component.

### Key design decisions

| Decision | Reasoning |
|---|---|
| FastAPI over Flask/Django | Async-native, ideal for streaming LLM responses; automatic OpenAPI docs |
| Groq as primary LLM provider | Significantly lower latency than OpenAI for real-time chat feel |
| Prompt engineering layer as separate module | Keeps prompt logic isolated and testable independent of routing |
| Crisis detection at the backend | Prevents bypassing safety logic via direct API calls |
| Stateless backend | Conversation history managed on the client; simplifies scaling |

---

## Project Structure

```
soulsync/
├── backend/          # FastAPI server, LLM integration, prompt logic
├── frontend/         # Next.js app, React components, Tailwind styles
├── data/             # Sample data, mood schemas
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
uvicorn app.main:app --reload
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Environment variables

Create a `.env` file in the `backend/` directory:

```env
TAVILY_API_KEY=your_api_key
GROQ_API_KEY=your_groq_key
```

---

## Motivation

I wanted to build something beyond standard ML pipelines — a production-style application where AI interacts with real users in a meaningful way. Mental health felt like a compelling and responsible space to explore this: responses need to feel human and contextual, not generic or robotic, which pushes you to think carefully about prompt design, failure modes, and tone.

SoulSync was an exercise in building AI that actually serves people, not just demonstrates a capability.

---

## Disclaimer

SoulSync is a personal project and is **not a substitute for professional mental health care**. If you or someone you know is struggling, please reach out to a qualified professional or a trusted person in your life.

---

## Author

**Vedant Bhenia** — MS in Applied Data Science, USC
[GitHub](https://github.com/vedant-1807)

If you found this useful or interesting, a ⭐ on the repo is appreciated.
