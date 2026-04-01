"""
src/safety.py — 2-stage crisis detection pipeline
Stage 1: fast regex pre-filter (zero LLM cost)
Stage 2: contextual LLM assessment (handles figurative language)
"""
import re
from typing import Optional

# ── Stage 1: Regex Patterns ───────────────────────────────────────
# Biased toward sensitivity — false positive cost (minor friction)
# is far lower than false negative cost (missed crisis).

CRISIS_PATTERNS = [
    r"\b(suicid\w*)\b",
    r"\b(self[\s\-]?harm|self[\s\-]?hurt)\b",
    r"\b(hurt\s+myself|harm\s+myself)\b",
    r"\bkill\s+myself\b",
    r"\bend\s+my\s+life\b",
    r"\bwant\s+to\s+die\b",
    r"\b(overdos\w*)\b",
    r"\bcutting\s+myself\b",
    r"\bhurting\s+myself\b",
    r"\bno\s+reason\s+to\s+live\b",
    r"\bnot\s+worth\s+living\b",
    r"\bbetter\s+off\s+dead\b",
    r"\bcan.t\s+go\s+on\b",
    r"\bdon.t\s+want\s+to\s+be\s+here\b",
]

# ── Crisis Resources ──────────────────────────────────────────────
CRISIS_RESOURCES = {
    "US":  [
        "988 Suicide & Crisis Lifeline — call or text 988 (24/7, free)",
        "Crisis Text Line — text HOME to 741741",
    ],
    "UK":  [
        "Samaritans — call 116 123 (free, 24/7)",
        "Crisis Text Line UK — text SHOUT to 85258",
    ],
    "INT": [
        "IASP Crisis Centre directory — https://www.iasp.info/resources/Crisis_Centres/",
    ],
}

CRISIS_RESPONSE_TEXT = """I hear that you're going through something incredibly difficult right now, \
and I want you to know that you matter and you're not alone.

Please reach out to a crisis professional right now — they are trained to help:

  988 Suicide & Crisis Lifeline  —  Call or text 988  (US, free, 24/7)
  Crisis Text Line               —  Text HOME to 741741
  Samaritans (UK)                —  Call 116 123  (free, 24/7)
  International resources        —  https://www.iasp.info/resources/Crisis_Centres/

You deserve real support from someone who can truly be there for you. \
Please reach out to one of these services."""


def regex_crisis_check(text: str) -> bool:
    """
    Stage 1: Fast keyword pre-filter.
    Returns True if any crisis pattern matches.
    Zero LLM cost — runs on every message before anything else.
    """
    text_lower = text.lower()
    return any(re.search(pattern, text_lower) for pattern in CRISIS_PATTERNS)


def get_crisis_response() -> str:
    """Returns the standard crisis resource message."""
    return CRISIS_RESPONSE_TEXT


# ── Stage 2 prompt (used by crisis_agent.py) ──────────────────────
CRISIS_ASSESSMENT_PROMPT = """A message has been flagged by a crisis keyword filter.
Your job is to determine whether this is GENUINE crisis or figurative language.

Examples of figurative (NOT crisis):
  - "This project is killing me"        → figurative, risk: low
  - "I want to kill my sister right now" → frustration, risk: low
  - "I'm dying of boredom"               → figurative, risk: low

Examples of genuine crisis:
  - "I've been cutting myself again"     → genuine, risk: high
  - "I have a plan to end my life"       → genuine, risk: immediate
  - "I took a lot of pills tonight"      → genuine, risk: immediate

Message: {message}
Conversation context (last few turns): {context}

Return ONLY a valid JSON object matching this schema — no preamble, no markdown:
{{
  "risk_level": "low" | "medium" | "high" | "immediate",
  "confidence": 0.0-1.0,
  "crisis_indicators": ["list", "of", "specific", "phrases"],
  "recommended_action": "string",
  "resources": ["list of resource strings"],
  "response_text": "warm, compassionate response text",
  "escalate_to_human": true | false,
  "sources": []
}}"""

