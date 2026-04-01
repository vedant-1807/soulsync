"""src/tools.py — shared LangChain Tool wrappers used by all agents"""
from langchain.tools import Tool
from backend.src.retrieval import hybrid_retrieve_and_rerank, format_context
from backend.src.safety import regex_crisis_check, get_crisis_response
from backend.src.utils import sanitise_input

def build_knowledge_search_tool(category_filter=None):
    def search(query: str) -> str:
        docs = hybrid_retrieve_and_rerank(query, category_filter=category_filter)
        if not docs:
            return "No relevant documents found."
        context, _ = format_context(docs)
        return context
    name = f"knowledge_search_{category_filter}" if category_filter else "knowledge_search"
    return Tool(name=name, func=search,
        description=f"Search the mental health knowledge base{f' ({category_filter} category)' if category_filter else ''}.")

def build_crisis_check_tool():
    def check(text: str) -> str:
        if regex_crisis_check(text):
            return f"CRISIS_DETECTED: {get_crisis_response()}"
        return "NO_CRISIS: Safe to proceed with standard response."
    return Tool(name="crisis_check", func=check,
        description="ALWAYS run first. Detects crisis indicators in user message.")

def build_sanitiser_tool():
    return Tool(name="sanitise_input", func=sanitise_input,
        description="Remove prompt injection attempts and enforce length cap.")
