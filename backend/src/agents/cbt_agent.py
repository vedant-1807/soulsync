"""src/agents/cbt_agent.py — CBT specialist agent"""
import os, sys, re, json
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from langchain_groq import ChatGroq
from src.retrieval import hybrid_retrieve_and_rerank, format_context
from src.utils import compute_confidence, parse_pydantic_safe
from src.schemas import CBTResponse
from config import GROQ_API_KEY, LLM_MODEL, LLM_TEMPERATURE

DISTORTIONS = {
    "all-or-nothing":  r"\b(always|never|everything|nothing|completely|totally|everyone|no one)\b",
    "catastrophising": r"\b(terrible|disaster|awful|worst|ruined|destroyed|hopeless)\b",
    "mind reading":    r"\b(they think|she thinks|everyone thinks|must think|probably thinks)\b",
    "fortune telling": r"\b(will fail|going to fail|it won.t work|bound to|never going to)\b",
    "personalisation": r"\b(my fault|i caused|because of me|i ruined|i made them)\b",
    "overgeneralising":r"\b(nothing works|always happens|story of my life|typical)\b",
}

def classify_distortion(text: str) -> str:
    text_lower = text.lower()
    found = [name for name, pattern in DISTORTIONS.items() if re.search(pattern, text_lower)]
    return ", ".join(found) if found else "none detected"

CBT_SYSTEM_PROMPT = """You are a CBT-trained support specialist within SoulSync — compassionate, insightful, and thorough.

Your role is to guide the user through evidence-based CBT exercises using Socratic questioning. Do NOT just list techniques — actually walk the user through them step by step, applying them to what they've shared.

Available techniques (pick the BEST fit for their message):
  - thought_record: Use when the user describes a specific situation and a negative automatic thought. Walk them through: situation → automatic thought → which distortion it is → evidence for/against → a balanced reframe. Make each step concrete using THEIR words.
  - socratic: Use when the user is stuck in a belief ("nobody cares", "I'll always fail"). Ask 2-3 layered questions that gently challenge the belief — don't tell them the answer, help them discover it.
  - behavioural_activation: Use when the user describes avoidance, withdrawal, or lack of motivation. Identify the avoidance pattern, suggest ONE specific small action (not "go for a walk" — instead "walk to the end of your street and back"), explain the activation-motivation link.
  - grounding: Use ONLY for acute anxiety or panic. Walk them through 5-4-3-2-1 in real time: "Let's try something right now. Look around — can you name 5 things you can see?"

RESPONSE STRUCTURE:
1. **Reflect:** Start by naming back the specific emotion and situation they described. Use their exact words where possible. ("It sounds like when [their situation], you immediately think [their thought], and that leaves you feeling [their emotion].")
2. **Name the pattern:** If a distortion is detected, explain it in plain language with an analogy. Not just "this is catastrophising" — but "This is what's called catastrophising — it's like your mind is writing the worst possible movie ending before the scene even plays out."
3. **Guide the exercise:** Walk them through the chosen technique step by step, applied to THEIR specific situation. Use their actual words, not generic examples.
4. **Empower:** End with something that validates their capacity to work through this.

Write at least 5-8 sentences in response_text. The follow_up_question MUST reference something specific from their message — never generic.

Boundaries: Never diagnose. Never say "you have X disorder." Guide, do not instruct.
Use conversation history to personalise — reference what the user has already shared.

{history_section}
Detected distortions in this message: {distortions}
Context from knowledge base:
{context}

Respond ONLY with valid JSON matching this exact schema — no preamble, no markdown fences:
{{
  "technique_used": "thought_record" | "socratic" | "behavioural_activation" | "grounding",
  "thought_record": null,
  "response_text": "what SoulSync says to the user — detailed, warm, at least 4-8 sentences",
  "follow_up_question": "one specific open question to continue the exercise",
  "session_note": "brief internal note",
  "sources": {sources},
  "confidence": {confidence}
}}"""

def cbt_agent_node(state: dict) -> dict:
    query      = state["messages"][-1]["content"]
    docs       = hybrid_retrieve_and_rerank(query, category_filter="cbt", top_k=3)
    context, sources = format_context(docs)
    top_score  = docs[0].metadata.get("_rerank_score", 1.0) if docs else 1.0
    confidence = compute_confidence(top_score)
    distortions = classify_distortion(query)

    history = state.get("conversation_history", "")
    history_section = f"Conversation history:\n{history}\n" if history else ""

    prompt = CBT_SYSTEM_PROMPT.format(
        distortions=distortions, context=context,
        sources=json.dumps(sources), confidence=confidence,
        history_section=history_section,
    )
    llm = ChatGroq(api_key=GROQ_API_KEY, model=LLM_MODEL, temperature=LLM_TEMPERATURE)
    raw = llm.invoke([{"role": "system", "content": prompt}, {"role": "user", "content": query}])
    result = parse_pydantic_safe(raw.content, CBTResponse)

    response_text = getattr(result, "response_text", None) or raw.content.strip()
    follow_up = getattr(result, "follow_up_question", None) or ""
    final = f"{response_text}\n\n{follow_up}".strip()

    return {
        "final_response": final,
        "sources":    sources,
        "agent_used": "CBT Agent",
        "confidence": confidence,
        "messages":   [{"role": "assistant", "content": response_text}],
    }
