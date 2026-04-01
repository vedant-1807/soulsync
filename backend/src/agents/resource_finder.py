"""
src/agents/resource_finder.py — Resource Finder Agent.

Uses Tavily web search to find therapists, helplines, and mental health apps
based on the user's location and needs. Location data is used only for the
search query — never logged or stored.
"""
import os
from langchain_groq import ChatGroq
from backend.src.schemas import ResourceList
from backend.src.utils import parse_pydantic_from_llm
from config import GROQ_API_KEY, TAVILY_API_KEY, LLM_MODEL, LLM_TEMPERATURE


# ── Location extraction prompt ─────────────────────────────────────

LOCATION_EXTRACT_PROMPT = """Extract the location (city and/or country) from this message.
If no location is mentioned, return the string: None
Return ONLY the location string or None. No explanation.

Message: {message}"""


# ── Resource system prompt ─────────────────────────────────────────

RESOURCE_SYSTEM_PROMPT = """You are a caring and thorough mental health resource specialist within SoulSync.

Your job is to help the user find real, actionable mental health support — not just dump a list of links.

RESPONSE STRUCTURE for response_text:
1. **Validate their courage:** Start by affirming that looking for help is genuinely brave. Be specific to what they asked — "Looking for an affordable therapist shows real self-awareness" is better than generic "great step!"
2. **Organise by priority:** Lead with the most relevant resource type for their specific ask. If they asked for a therapist, lead with therapist finders — don't bury it after crisis lines.
3. **Explain fit:** For each resource, explain in 1 sentence WHY it matches their situation. Not just "Psychology Today therapist finder" — instead "Psychology Today's directory lets you filter by insurance, sliding scale, and speciality — so you can find someone who fits both your budget and your specific needs."
4. **Always include a safety net:** Regardless of what they asked, include one crisis resource at the end.
5. **End with a practical next step:** Not just "good luck" — instead "A good first step would be to check [specific resource] today and filter for [their criteria]. Even just browsing profiles can help you feel more in control."

Write a response_text of at least 5-8 sentences. Be warm, organised, and specific to their situation.

Use conversation history to understand location, preferences, or constraints already mentioned.

{history_section}User request: {query}

Search results:
{search_results}

Rules:
- Include at least one crisis helpline regardless of the query.
- Prioritise free or sliding-scale options.
- Never recommend specific medications or treatments.
- Always include a disclaimer that this is not a substitute for professional care.

Respond ONLY with a valid JSON object — no preamble, no markdown fences:
{{
  "resources": [
    {{
      "name": "...",
      "type": "therapist" | "helpline" | "app" | "support_group" | "crisis_service",
      "description": "...",
      "contact": "...",
      "cost": "...",
      "url": "..." | null
    }}
  ],
  "filters_applied": [...],
  "response_text": "...",
  "disclaimer": "These resources are for informational purposes only and are not a substitute for professional mental health care.",
  "sources": [...],
  "confidence": <float 0.0-1.0>
}}"""


# ── Fallback resources (when Tavily is unavailable) ────────────────

FALLBACK_RESPONSE = """Here are some trusted mental health resources:

**Crisis support:**
  • 988 Suicide & Crisis Lifeline — call or text 988 (US, free, 24/7)
  • Crisis Text Line — text HOME to 741741 (US)
  • Samaritans — 116 123 (UK, free, 24/7)

**Finding a therapist:**
  • Psychology Today therapist finder — psychologytoday.com/us/therapists
  • Open Path Collective (affordable) — openpathcollective.org
  • SAMHSA treatment locator — findtreatment.gov

**Mental health apps:**
  • Woebot (CBT-based chatbot, free tier)
  • Headspace (meditation, free trial)
  • Calm (stress & sleep)"""


# ── Agent node ─────────────────────────────────────────────────────

def resource_finder_node(state: dict) -> dict:
    """LangGraph node for the Resource Finder agent."""
    query = state["messages"][-1]["content"]
    llm   = ChatGroq(api_key=GROQ_API_KEY, model=LLM_MODEL, temperature=LLM_TEMPERATURE)

    # Step 1: Extract location from message
    location_prompt = LOCATION_EXTRACT_PROMPT.format(message=query)
    location_raw    = llm.invoke([{"role": "user", "content": location_prompt}])
    location        = location_raw.content.strip()

    # Step 2: Build search query
    if location and location.lower() != "none":
        search_q = f"mental health therapist {location} affordable sliding scale"
    else:
        search_q = "mental health resources helplines online therapy affordable"

    # Step 3: Web search via Tavily
    search_results = ""
    sources        = []
    try:
        if TAVILY_API_KEY:
            from tavily import TavilyClient
            tavily  = TavilyClient(api_key=TAVILY_API_KEY)
            results = tavily.search(
                query=search_q,
                max_results=5,
                include_answer=True,
            )
            answer  = results.get("answer", "")
            snippets = "\n".join(r.get("content", "") for r in results.get("results", []))
            sources  = [r.get("url", "") for r in results.get("results", []) if r.get("url")]
            search_results = f"{answer}\n\n{snippets}".strip()
        else:
            print("[WARN] TAVILY_API_KEY not set — using fallback resources")
    except Exception as e:
        print(f"[WARN] Tavily search failed: {e} — using fallback resources")

    # Step 4: If no search results, return fallback
    if not search_results:
        return {
            "final_response": FALLBACK_RESPONSE,
            "sources":        [],
            "agent_used":     "Resource Finder",
            "confidence":     0.6,
            "messages":       state["messages"] + [{"role": "assistant", "content": FALLBACK_RESPONSE}],
        }

    # Step 5: Ask LLM to structure the results
    history = state.get("conversation_history", "")
    history_section = f"Conversation history:\n{history}\n\n" if history else ""
    prompt = RESOURCE_SYSTEM_PROMPT.format(
        query=query,
        search_results=search_results[:3000],
        history_section=history_section,
    )
    raw    = llm.invoke([{"role": "system", "content": prompt}])
    result = parse_pydantic_from_llm(raw.content, ResourceList)
    result.sources    = sources[:5]
    result.confidence = 0.75

    response = result.response_text + f"\n\n_{result.disclaimer}_"

    return {
        "final_response": response,
        "sources":        result.sources,
        "agent_used":     "Resource Finder",
        "confidence":     result.confidence,
        "messages":       state["messages"] + [{"role": "assistant", "content": response}],
    }
