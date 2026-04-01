"""
src/agents/crisis_agent.py — Crisis Specialist Agent.

Two-stage pipeline:
  Stage 1: Regex pre-filter (runs before LangGraph even routes here — in graph.py)
  Stage 2: Contextual LLM assessment (runs inside this node)

Retrieves from docs/crisis/ knowledge base (SAFE-T, 988 Lifeline, WHO mhGAP).
"""
from langchain_groq import ChatGroq
from src.retrieval import hybrid_retrieve_and_rerank, format_context, get_top_rerank_score
from src.schemas import CrisisAssessment
from src.safety import CRISIS_ASSESSMENT_PROMPT, get_crisis_response, CRISIS_RESOURCES
from src.utils import compute_confidence, parse_pydantic_from_llm
from config import GROQ_API_KEY, LLM_MODEL


def crisis_precheck_node(state: dict) -> dict:
    """
    LangGraph entry node — runs on EVERY message before routing.
    Fast regex check only. Zero LLM cost.
    Sets crisis_flagged=True to route to crisis_agent if triggered.
    """
    from src.safety import regex_crisis_check
    query  = state["messages"][-1]["content"]
    flagged = regex_crisis_check(query)
    return {**state, "crisis_flagged": flagged}


def crisis_agent_node(state: dict) -> dict:
    """
    LangGraph node for the Crisis agent.
    Runs Stage 2 contextual LLM assessment to distinguish
    genuine crisis from figurative language.
    """
    query   = state["messages"][-1]["content"]
    history = state.get("conversation_history", "")

    # Hybrid retrieval — crisis knowledge base only (for sources + confidence)
    docs             = hybrid_retrieve_and_rerank(query, category_filter="crisis", top_k=3)
    _, sources       = format_context(docs)
    top_score        = get_top_rerank_score(docs)
    confidence       = compute_confidence(top_score)

    # Stage 2: Contextual LLM assessment
    prompt = CRISIS_ASSESSMENT_PROMPT.format(
        message=query,
        context=history or "No prior conversation.",
    )

    llm    = ChatGroq(api_key=GROQ_API_KEY, model=LLM_MODEL, temperature=0.0)
    raw    = llm.invoke([{"role": "user", "content": prompt}])
    result = parse_pydantic_from_llm(raw.content, CrisisAssessment)

    # If parse fails or risk is high/immediate, always return full crisis resources
    risk = getattr(result, "risk_level", None)
    resp_text = getattr(result, "response_text", None)
    if risk in ("high", "immediate") or not resp_text:
        response = get_crisis_response()
    else:
        response = resp_text
        # Always append resources regardless of assessed risk
        resources = CRISIS_RESOURCES.get("US", []) + CRISIS_RESOURCES.get("INT", [])
        if resources:
            resource_lines = "\n".join(f"  • {r}" for r in resources[:3])
            response += f"\n\nIf you ever need support, these resources are always available:\n{resource_lines}"

    result.sources    = sources
    result.confidence = confidence

    return {
        "final_response": response,
        "sources":        sources,
        "agent_used":     "Crisis Agent",
        "confidence":     confidence,
        "messages":       state["messages"] + [{"role": "assistant", "content": response}],
    }
