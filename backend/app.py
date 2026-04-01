"""

Working demo with:
- Full multi-agent pipeline (via LangGraph)
- Explainability panel (agent name, sources, confidence)
- Mandatory disclaimer on every response
- Session state for mood tracking continuity

Run: python app.py
Opens at: http://localhost:7860 (+ auto-generated public share link)
"""
import uuid
import gradio as gr

from src.graph import build_graph, make_initial_state
from src.utils import sanitise_input, safe_response, format_explainability_panel

# Build the graph once at startup
print("Building SoulSync graph...")
graph = build_graph()
print("Graph ready.\n")


def respond(message: str, history: list, session_state: dict) -> tuple[str, dict]:
    """
    Main chat handler. Called by Gradio on every user message.

    Returns:
        (response_text, updated_session_state)
    """
    # Ensure session ID exists
    if "id" not in session_state:
        session_state["id"] = str(uuid.uuid4())

    # Sanitise input
    message    = sanitise_input(message)
    session_id = session_state["id"]

    # Run through LangGraph
    initial_state = make_initial_state(message, session_id)
    result        = graph.invoke(initial_state)

    # Assemble response with explainability panel + disclaimer
    panel = format_explainability_panel(
        agent_used=result.get("agent_used", "SoulSync"),
        sources=result.get("sources", []),
        confidence=result.get("confidence", 0.0),
        retrieval_method="hybrid",
    )
    full_response = safe_response(result["final_response"] + panel)

    return full_response, session_state


# ── Gradio UI ──────────────────────────────────────────────────────

with gr.Blocks(
    theme=gr.themes.Soft(
        primary_hue="teal",
        neutral_hue="slate",
    ),
    title="SoulSync — Mental Health Support",
) as demo:

    gr.Markdown(
        """
        # SoulSync
        ### AI-Powered Mental Health Support
        > Powered by **LLaMA-3** via Groq  ·  Multi-Agent  ·  Knowledge-Grounded  ·  Not a therapy replacement

        _This chatbot provides psychoeducational support only. For emergencies, call or text **988**._
        """
    )

    session = gr.State({})

    chat = gr.ChatInterface(
        fn=lambda msg, hist: respond(msg, hist, session.value)[0],
        examples=[
            "I keep thinking everything will go wrong — how do I stop catastrophising?",
            "Can you explain what CBT is and how it helps anxiety?",
            "I've been feeling really low this week and don't know why.",
            "Can you help me find an affordable therapist in London?",
            "I feel overwhelmed and don't know where to start.",
        ],
        retry_btn=None,
        undo_btn=None,
        submit_btn="Send",
    )

    gr.Markdown(
        """
        ---
        **How SoulSync works:**
        Every response shows which agent handled your query (CBT, Mood Tracker, Resource Finder, etc.),
        which documents were retrieved, and a confidence score.
        """
    )


if __name__ == "__main__":
    demo.launch(
        share=True,          # Generates a public URL for sharing/demo
        server_port=7860,
        show_error=True,
    )
