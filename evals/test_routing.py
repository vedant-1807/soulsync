"""
evals/test_routing.py — Routing accuracy tests for the SoulSync supervisor.

Tests that the supervisor LLM routes each message to the correct specialist agent.
Run:  pytest evals/test_routing.py -v
      pytest evals/test_routing.py -v --tb=short   (compact output)
"""
import json
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.graph import supervisor_node, AgentState


# ── Helpers ────────────────────────────────────────────────────────

FIXTURES_PATH = os.path.join(os.path.dirname(__file__), "fixtures", "routing_cases.json")


def _make_state(message: str) -> AgentState:
    """Minimal AgentState for supervisor testing — no history needed."""
    return AgentState(
        messages=[{"role": "user", "content": message}],
        next_agent="",
        crisis_flagged=False,
        mood_score=0.0,
        session_id="eval-session",
        final_response="",
        sources=[],
        agent_used="",
        confidence=0.0,
        memory_obj=None,
        conversation_history="",
    )


def _load_cases():
    with open(FIXTURES_PATH) as f:
        return json.load(f)


# ── Parametrised routing test ──────────────────────────────────────

def _case_id(case: dict) -> str:
    """Short ID shown in pytest output: first 6 words of the input."""
    words = case["input"].split()[:6]
    return " ".join(words)


@pytest.mark.parametrize("case", _load_cases(), ids=_case_id)
def test_supervisor_routing(case):
    """Supervisor must route each message to the expected agent."""
    state  = _make_state(case["input"])
    result = supervisor_node(state)
    actual = result["next_agent"]

    assert actual == case["expected_agent"], (
        f"\nMessage : {case['input']!r}"
        f"\nExpected: {case['expected_agent']}"
        f"\nActual  : {actual}"
        f"\nNote    : {case.get('note', '')}"
    )


# ── Summary report (run directly) ──────────────────────────────────

if __name__ == "__main__":
    cases   = _load_cases()
    passed  = 0
    failed  = 0
    by_agent: dict[str, dict] = {}

    print(f"\n=== Routing Accuracy Eval ({len(cases)} cases) ===\n")

    for case in cases:
        state  = _make_state(case["input"])
        result = supervisor_node(state)
        actual = result["next_agent"]
        ok     = actual == case["expected_agent"]

        agent = case["expected_agent"]
        if agent not in by_agent:
            by_agent[agent] = {"total": 0, "correct": 0}
        by_agent[agent]["total"]   += 1
        by_agent[agent]["correct"] += int(ok)

        status = "PASS" if ok else "FAIL"
        if not ok:
            print(f"  [{status}] {case['input'][:60]!r}")
            print(f"         expected={case['expected_agent']}  got={actual}")
        else:
            print(f"  [{status}] {case['input'][:60]!r}")

        passed += int(ok)
        failed += int(not ok)

    total = len(cases)
    print(f"\n=== Results ===")
    print(f"  Overall accuracy : {passed}/{total} ({passed/total:.0%})")
    print(f"\n  Per-agent breakdown:")
    for agent, counts in sorted(by_agent.items()):
        acc = counts["correct"] / counts["total"]
        print(f"    {agent:<12} {counts['correct']}/{counts['total']}  ({acc:.0%})")
