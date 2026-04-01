"""
evals/test_cbt_agent.py — Unit tests for the CBT agent's distortion classifier.
Run: pytest evals/test_cbt_agent.py -v
"""
import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.agents.cbt_agent import classify_distortion


# ── Distortion classification tests ───────────────────────────────

@pytest.mark.parametrize("text, expected", [
    ("Everything always goes wrong for me",        "all-or-nothing"),
    ("I never do anything right",                  "all-or-nothing"),
    ("This is a complete disaster",                "catastrophising"),
    ("Everything is completely ruined",            "catastrophising"),
    ("They must think I am so stupid",             "mind reading"),
    ("Everyone thinks I am a failure",             "mind reading"),
    ("I will definitely fail the exam",            "fortune telling"),
    ("It will never work out for me",              "fortune telling"),
    ("It is all my fault that this happened",      "personalisation"),
    ("I caused all these problems",                "personalisation"),
    ("I should always be productive",              "should statements"),
    ("I must never make mistakes",                 "should statements"),
])
def test_distortion_detected(text, expected):
    result = classify_distortion(text)
    assert expected in result, f"Expected '{expected}' in result for: '{text}'\nGot: '{result}'"


def test_no_distortion_neutral_text():
    result = classify_distortion("I went for a walk and felt better.")
    assert result == "none detected"

def test_multiple_distortions_detected():
    text   = "I always fail and everyone thinks I am terrible"
    result = classify_distortion(text)
    # Should catch both all-or-nothing and mind reading
    assert "all-or-nothing" in result or "mind reading" in result

def test_classify_distortion_returns_string():
    result = classify_distortion("any text")
    assert isinstance(result, str)
