"""src/memory.py — conversation memory setup"""
import os, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from langchain.memory import ConversationBufferWindowMemory
from backend.config import MEMORY_WINDOW

def build_memory():
    return ConversationBufferWindowMemory(
        k=MEMORY_WINDOW,
        memory_key="chat_history",
        return_messages=True,
        output_key="answer",
    )


def get_history_string(memory_obj) -> str:
    """Formats conversation history from a ConversationBufferWindowMemory as plain text."""
    if memory_obj is None:
        return ""
    try:
        messages = memory_obj.chat_memory.messages
        if not messages:
            return ""
        lines = []
        for msg in messages:
            role = "User" if msg.type == "human" else "Assistant"
            lines.append(f"{role}: {msg.content}")
        return "\n".join(lines)
    except Exception:
        return ""
