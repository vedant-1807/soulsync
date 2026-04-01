"""
src/utils.py — shared utility functions
sanitise_input, safe_response, anonymise_session_id
"""
import re
import hashlib

# ── Mandatory disclaimer ──────────────────────────────────────────
# Hard-coded and non-configurable — appended to every response.
DISCLAIMER = (
    "\n\n---\n"
    "_SoulSync provides psychoeducational support only. "
    "It is not a substitute for professional mental health care. "
    "If you are in crisis, please call or text **988** (US) "
    "or your local crisis line._"
)

# ── Prompt injection patterns ─────────────────────────────────────
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"forget\s+(all\s+)?instructions",
    r"you\s+are\s+now\s+a",
    r"system\s+prompt",
    r"jailbreak",
    r"act\s+as\s+(if\s+you\s+are|a)",
    r"pretend\s+(you\s+are|to\s+be)",
    r"disregard\s+(all\s+)?previous",
]


def sanitise_input(text: str) -> str:
    """
    Remove prompt injection attempts and enforce length cap.
    Called on every user message before anything else.
    """
    for pattern in INJECTION_PATTERNS:
        text = re.sub(pattern, "[removed]", text, flags=re.IGNORECASE)
    return text[:2000]  # Hard cap prevents token flooding


def safe_response(text: str) -> str:
    """
    Appends the mandatory disclaimer to any response text.
    Non-optional — every response must carry the disclaimer.
    """
    return text + DISCLAIMER


def anonymise_session_id(raw_id: str) -> str:
    """
    Hashes a raw session identifier to an anonymised 16-char hex string.
    No PII is stored — mood logs use this anonymised ID only.
    """
    return hashlib.sha256(raw_id.encode()).hexdigest()[:16]


def compute_confidence(top_score: float) -> float:
    """
    Sigmoid-normalises a cross-encoder score to a 0–1 confidence value.
    Cross-encoder scores are real-valued (can be negative) — sigmoid maps
    them to a meaningful 0–1 range for display in the explainability panel.
    """
    import math
    return round(1 / (1 + math.exp(-top_score)), 2)


def format_sources(docs: list) -> list[str]:
    """Extracts unique source filenames from a list of LangChain Documents."""
    seen = set()
    sources = []
    for doc in docs:
        src = doc.metadata.get("source", "unknown")
        if src not in seen:
            seen.add(src)
            sources.append(src)
    return sources


def parse_pydantic_safe(raw_content: str, model_class):
    """
    Safely parses a raw LLM string into a Pydantic model.
    Handles: markdown fences, preamble text, trailing text, invalid enum values.
    Falls back gracefully on total failure.
    """
    import json

    clean = raw_content.strip()

    # Strip markdown fences
    if "```" in clean:
        clean = re.sub(r"^```(?:json)?\s*", "", clean, flags=re.MULTILINE)
        clean = re.sub(r"\s*```\s*$", "", clean, flags=re.MULTILINE)
        clean = clean.strip()

    # Extract the first {...} block from anywhere in the string
    data = None
    try:
        start = clean.index("{")
        depth, end = 0, -1
        for i, ch in enumerate(clean[start:], start):
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    end = i
                    break
        if end != -1:
            data = json.loads(clean[start:end + 1])
    except Exception:
        pass

    if data is None:
        print(f"[parse_pydantic_safe] Could not extract JSON for {model_class.__name__}")
        return model_class.model_construct()

    # Strategy 1: strict validation
    try:
        return model_class.model_validate(data)
    except Exception:
        pass

    # Strategy 2: keep only fields present in data, bypass strict enum validation
    try:
        safe_data = {k: v for k, v in data.items() if k in model_class.model_fields}
        return model_class.model_construct(**safe_data)
    except Exception as e:
        print(f"[parse_pydantic_safe] Fallback construct failed for {model_class.__name__}: {e}")
        return model_class.model_construct()


# Alias used by crisis_agent, mood_tracker, resource_finder
parse_pydantic_from_llm = parse_pydantic_safe


def format_explainability_panel(
    agent_used: str,
    sources: list,
    confidence: float,
    retrieval_method: str,
) -> str:
    """Formats an explainability panel as a markdown string appended to responses."""
    confidence_pct = int(confidence * 100)
    source_lines = ""
    if sources:
        items = "\n".join(f"  - `{s}`" for s in sources[:5])
        source_lines = f"\n**Sources:**\n{items}"
    return (
        f"\n\n---\n"
        f"**Agent:** {agent_used}  ·  "
        f"**Confidence:** {confidence_pct}%  ·  "
        f"**Retrieval:** {retrieval_method}"
        f"{source_lines}"
    )
