"""
src/schemas.py — all Pydantic output schemas
Every agent returns one of these validated types.
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal


# ── CBT Agent ─────────────────────────────────────────────────────

class ThoughtRecord(BaseModel):
    situation:          str = Field(description="What triggered the thought?")
    automatic_thought:  str = Field(description="The negative automatic thought")
    distortion_type:    str = Field(description="e.g. catastrophising, all-or-nothing")
    evidence_for:       str = Field(description="Evidence supporting the thought")
    evidence_against:   str = Field(description="Evidence challenging the thought")
    balanced_thought:   str = Field(description="The reframed, balanced perspective")


class CBTResponse(BaseModel):
    technique_used:     Literal["thought_record", "socratic", "behavioural_activation", "grounding"]
    thought_record:     Optional[ThoughtRecord] = None
    response_text:      str = Field(description="What SoulSync says to the user")
    follow_up_question: str = Field(description="Open question to continue the exercise")
    session_note:       str = Field(description="Internal note for mood tracker")
    sources:            list[str] = Field(default_factory=list)
    confidence:         float = Field(default=0.5, ge=0.0, le=1.0)


# ── Crisis Agent ──────────────────────────────────────────────────

class CrisisAssessment(BaseModel):
    risk_level:          Literal["low", "medium", "high", "immediate"]
    confidence:          float = Field(ge=0.0, le=1.0)
    crisis_indicators:   list[str] = Field(default_factory=list)
    recommended_action:  str
    resources:           list[str] = Field(default_factory=list)
    response_text:       str
    escalate_to_human:   bool = False
    sources:             list[str] = Field(default_factory=list)


# ── Mood Tracker Agent ────────────────────────────────────────────

class MoodEntry(BaseModel):
    score:        float = Field(ge=-1.0, le=1.0, description="-1=very negative, +1=very positive")
    emotion:      Literal["anxious", "sad", "angry", "neutral", "content", "hopeful", "overwhelmed", "numb"]
    energy:       Literal["very_low", "low", "moderate", "high"]
    note:         str = Field(description="One-sentence contextual note")
    trend_alert:  Optional[str] = Field(default=None, description="Pattern flag if detected")
    response_text: str
    sources:      list[str] = Field(default_factory=list)
    confidence:   float = Field(default=0.5, ge=0.0, le=1.0)


# ── Resource Finder Agent ─────────────────────────────────────────

class Resource(BaseModel):
    name:        str
    type:        Literal["therapist", "helpline", "app", "support_group", "crisis_service"]
    description: str
    contact:     str
    cost:        str
    url:         Optional[str] = None


class ResourceList(BaseModel):
    resources:        list[Resource] = Field(default_factory=list)
    filters_applied:  list[str] = Field(default_factory=list)
    response_text:    str
    disclaimer:       str
    sources:          list[str] = Field(default_factory=list)
    confidence:       float = Field(default=0.5, ge=0.0, le=1.0)


# ── Explainability Panel (General RAG + all agents) ───────────────

class ExplainabilityPanel(BaseModel):
    agent_used:        str
    sources:           list[str] = Field(default_factory=list)
    confidence:        float = Field(default=0.5, ge=0.0, le=1.0)
    retrieval_method:  Literal["hybrid", "semantic_only", "crisis_override", "web_search"]
    response_text:     str


# ── Supervisor Routing ────────────────────────────────────────────

class RoutingDecision(BaseModel):
    next_agent: Literal["CBT", "CRISIS", "MOOD", "RESOURCE", "GENERAL"]
    reasoning:  str = Field(default="")
