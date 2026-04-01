"""
src/graph.py — LangGraph multi-agent orchestration for SoulSync.

Graph structure:
  START
    → crisis_precheck   (mandatory, every message)
        → [crisis]  → crisis_agent → END
        → [safe]    → supervisor
            → GREETING → greeting_node   → END
            → CBT      → cbt_agent      → END
            → CRISIS   → crisis_agent   → END
            → MOOD     → mood_tracker   → END
            → RESOURCE → resource_finder → END
            → GENERAL  → general_rag    → END
"""
from typing import TypedDict, Annotated, Optional
import operator

from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq

from src.agents.cbt_agent      import cbt_agent_node
from src.agents.crisis_agent   import crisis_precheck_node, crisis_agent_node
from src.agents.mood_tracker   import mood_tracker_node
from src.agents.resource_finder import resource_finder_node
from config import GROQ_API_KEY, LLM_MODEL


# ── Agent State ────────────────────────────────────────────────────

class AgentState(TypedDict):
    messages:             Annotated[list, operator.add]   # Full conversation history
    next_agent:           str                              # Supervisor routing decision
    crisis_flagged:       bool                             # Stage-1 crisis pre-check result
    mood_score:           float                            # Extracted each turn by mood tracker
    session_id:           str                              # Anonymised session identifier
    final_response:       str                              # Assembled final answer
    sources:              list[str]                        # Retrieved source filenames
    agent_used:           str                              # Which agent generated the response
    confidence:           float                            # Cross-encoder confidence score
    memory_obj:           Optional[object]                 # ConversationBufferWindowMemory (legacy)
    conversation_history: str                              # Formatted prior turns for injection


# ── Supervisor prompt ──────────────────────────────────────────────

SUPERVISOR_PROMPT = """You are a routing agent for SoulSync, a mental health support system.
Classify the user message into exactly one of these categories:

  GREETING   — casual greetings, "hi", "hello", "how are you", "what's up", small talk, introductions. ONLY when the user is NOT sharing emotional content.
  CBT        — user describes negative thought patterns, cognitive distortions, spiralling thoughts, catastrophising, black-and-white thinking, self-blame, or asks about reframing/thought records.
  CRISIS     — self-harm, suicidal ideation, acute distress, hopelessness, wanting to die, overdose references. Err on the side of caution — if in doubt, choose CRISIS.
  MOOD       — user shares how they feel emotionally ("I've been feeling anxious", "I'm sad today", mood check-ins, journaling about emotions, energy levels). This is the most common category for emotional sharing.
  RESOURCE   — user asks for therapists, helplines, apps, local mental health services, support groups, or affordable care options.
  GENERAL    — psychoeducation questions ("what is CBT?", "why do I feel anxious?"), coping strategies, sleep tips, mindfulness, general mental health knowledge. Also use for off-topic or unclear messages.

Routing rules:
  - "How are you?" or "Hey" with NO emotional content → GREETING
  - "I've been feeling really low" or "I'm anxious" → MOOD (they are sharing feelings, not asking a question)
  - "What are cognitive distortions?" → GENERAL (asking for information, not working through a distortion)
  - "I keep thinking everything is my fault" → CBT (active distortion pattern)
  - "Can you help me find a therapist?" → RESOURCE
  - If a message could be MOOD or CBT, choose CBT only if there is a clear distortion pattern. Otherwise choose MOOD.
  - If a message could be MOOD or GENERAL, choose MOOD if the user is sharing personal feelings. Choose GENERAL if they are asking an informational question.

{history_block}
Respond with EXACTLY ONE WORD — the category name. Nothing else.
"""


# ── Node implementations ───────────────────────────────────────────

def supervisor_node(state: AgentState) -> AgentState:
    """LLM-powered routing: decides which specialist agent handles this turn."""
    last_message = state["messages"][-1]["content"]
    history      = state.get("conversation_history", "")
    history_block = (
        f"Recent conversation:\n{history}\n\n" if history else ""
    )
    llm = ChatGroq(api_key=GROQ_API_KEY, model=LLM_MODEL, temperature=0.0)
    decision = llm.invoke([
        {"role": "system", "content": SUPERVISOR_PROMPT.format(history_block=history_block)},
        {"role": "user",   "content": last_message},
    ])
    intent = decision.content.strip().upper()
    valid  = {"GREETING", "CBT", "CRISIS", "MOOD", "RESOURCE", "GENERAL"}
    if intent not in valid:
        intent = "GENERAL"
    return {**state, "next_agent": intent}


def greeting_node(state: AgentState) -> AgentState:
    """Handles casual greetings without over-analyzing emotion."""
    from langchain_groq import ChatGroq
    from config import LLM_TEMPERATURE

    query = state["messages"][-1]["content"]
    history = state.get("conversation_history", "")
    history_section = f"\nConversation so far:\n{history}\n" if history else ""

    GREETING_PROMPT = f"""You are SoulSync, a warm and empathetic mental health support assistant.

The user has just greeted you. Respond like a caring friend who is genuinely glad to hear from them.

Rules:
- 2-3 sentences max. Be concise but warm.
- Do NOT say "How can I help you?" or "What brings you here?" — these feel clinical.
- Instead, say something natural like "Hey, it's good to hear from you! How's your day going so far?" or "Hi there! How have things been since we last chatted?"
- If there is conversation history, reference something specific from it to show continuity (e.g., "Last time you mentioned work was stressful — how's that been going?").
- If no history, keep it light and inviting.
- Never extract mood or analyze emotions from a greeting. Just be human.

{history_section}
User message: {query}"""

    llm = ChatGroq(api_key=GROQ_API_KEY, model=LLM_MODEL, temperature=LLM_TEMPERATURE)
    raw = llm.invoke([{"role": "user", "content": GREETING_PROMPT}])
    response = raw.content.strip()

    return {
        "final_response": response,
        "sources": [],
        "agent_used": "Greeting",
        "confidence": 1.0,
        "messages": state["messages"] + [{"role": "assistant", "content": response}],
    }


def general_rag_node(state: AgentState) -> AgentState:
    """Handles GENERAL intent — psychoeducation and general mental health questions."""
    from langchain_groq import ChatGroq
    from src.retrieval import hybrid_retrieve_and_rerank, format_context, get_top_rerank_score
    from src.utils import compute_confidence
    from config import LLM_TEMPERATURE

    query            = state["messages"][-1]["content"]
    docs             = hybrid_retrieve_and_rerank(query, top_k=3)
    context, sources = format_context(docs)
    top_score        = get_top_rerank_score(docs)
    confidence       = compute_confidence(top_score)

    history = state.get("conversation_history", "")
    history_section = f"\nConversation so far:\n{history}\n" if history else ""

    GENERAL_PROMPT = """You are SoulSync, a warm and knowledgeable mental health support assistant.

Your personality: empathetic, thoughtful, and thorough. You write in a conversational but informed tone — like a well-read friend who genuinely cares.

RESPONSE STRUCTURE — follow this for every answer:

**Step 1 — Validate:** Start with 1-2 sentences that show you understood what the user asked or shared. If they shared something personal, reflect it back with empathy. If they asked a factual question, acknowledge why it's a great question.

**Step 2 — Educate with depth:** This is the core of your answer. Draw on the knowledge base context AND your own understanding of psychology. Do not just define a term — explain the mechanism (why it happens), give a concrete real-life example, and connect it to the user's situation. Use markdown formatting (**bold** for key terms, bullet points for lists of techniques) but weave them into flowing prose, not just bullet dumps.

**Step 3 — Make it actionable:** Give the user something specific they can try today. Not vague advice like "practice self-care" — instead, describe a concrete micro-exercise: "Tonight before bed, try writing down three specific moments from your day that went okay, even small ones like finishing a meal or replying to a message."

**Step 4 — Invite continuation:** End with a specific follow-up question that deepens the conversation. Not "How does that make you feel?" — instead, ask something tied to what they shared: "You mentioned this happens mostly at work — is there a particular moment in your day when it tends to hit hardest?"

LENGTH GUIDE:
- Simple factual question → 4-6 sentences
- Personal sharing or complex topic → 3-5 paragraphs with depth
- Never give a 1-2 sentence answer. That feels dismissive.

If the question is off-topic (not about mental health), answer it briefly but warmly, then gently bridge back: "That's a great question! [brief answer]. By the way, is there anything on your mind emotionally that I can help with?"

Boundaries (never cross these):
- Never diagnose or label the user with a disorder.
- Never prescribe or recommend specific medication.
- For serious or ongoing concerns, gently suggest professional help.
- Be honest when something is beyond your scope.
{history_section}
Knowledge base context:
{context}

Current question: {query}"""

    llm    = ChatGroq(api_key=GROQ_API_KEY, model=LLM_MODEL, temperature=LLM_TEMPERATURE)
    raw    = llm.invoke([
        {"role": "system", "content": GENERAL_PROMPT.format(
            context=context, query=query, history_section=history_section
        )},
    ])
    response = raw.content.strip()

    return {
        "final_response": response,
        "sources":        sources,
        "agent_used":     "General RAG",
        "confidence":     confidence,
        "messages":       state["messages"] + [{"role": "assistant", "content": response}],
    }


# ── Routing functions ──────────────────────────────────────────────

def route_after_crisis_check(state: AgentState) -> str:
    """After crisis precheck: escalate if flagged, else go to supervisor."""
    return "crisis" if state.get("crisis_flagged") else "safe"


def route_by_intent(state: AgentState) -> str:
    """After supervisor: route to the correct specialist node."""
    intent_map = {
        "GREETING":  "greeting_node",
        "CBT":       "cbt_agent",
        "CRISIS":    "crisis_agent",
        "MOOD":      "mood_tracker",
        "RESOURCE":  "resource_finder",
        "GENERAL":   "general_rag",
    }
    return intent_map.get(state.get("next_agent", "GENERAL"), "general_rag")


# ── Graph construction ─────────────────────────────────────────────

def build_graph():
    """Build and compile the full LangGraph multi-agent graph."""
    wf = StateGraph(AgentState)

    # Register all nodes
    wf.add_node("crisis_precheck",   crisis_precheck_node)
    wf.add_node("supervisor",        supervisor_node)
    wf.add_node("cbt_agent",         cbt_agent_node)
    wf.add_node("crisis_agent",      crisis_agent_node)
    wf.add_node("mood_tracker",      mood_tracker_node)
    wf.add_node("resource_finder",   resource_finder_node)
    wf.add_node("general_rag",       general_rag_node)
    wf.add_node("greeting_node",    greeting_node)

    # Entry: always run crisis precheck first
    wf.set_entry_point("crisis_precheck")

    # After crisis precheck: escalate or route to supervisor
    wf.add_conditional_edges(
        "crisis_precheck",
        route_after_crisis_check,
        {"crisis": "crisis_agent", "safe": "supervisor"},
    )

    # After supervisor: route to specialist
    wf.add_conditional_edges(
        "supervisor",
        route_by_intent,
        {
            "greeting_node":   "greeting_node",
            "cbt_agent":       "cbt_agent",
            "crisis_agent":    "crisis_agent",
            "mood_tracker":    "mood_tracker",
            "resource_finder": "resource_finder",
            "general_rag":     "general_rag",
        },
    )

    # All specialist agents end the graph
    for node in ["greeting_node", "cbt_agent", "crisis_agent", "mood_tracker", "resource_finder", "general_rag"]:
        wf.add_edge(node, END)

    return wf.compile()


def make_initial_state(
    message: str,
    session_id: str,
    memory_obj=None,
    conversation_history: str = "",
) -> AgentState:
    """Helper to create a clean initial AgentState for each new message."""
    return AgentState(
        messages=[{"role": "user", "content": message}],
        next_agent="",
        crisis_flagged=False,
        mood_score=0.0,
        session_id=session_id,
        final_response="",
        sources=[],
        agent_used="",
        confidence=0.0,
        memory_obj=memory_obj,
        conversation_history=conversation_history,
    )
