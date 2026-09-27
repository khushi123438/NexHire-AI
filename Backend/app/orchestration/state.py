from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class InterviewState(BaseModel):
    """
    Central InterviewState for NexHire-AI Agentic Architecture.
    Tracks all contextual data across the adaptive interview lifecycle.
    """
    candidate_id: Optional[Any] = None
    interview_id: str = ""
    candidate_name: str = "Candidate"
    target_role: str = "Software Development Engineer (SDE)"
    current_round: str = "ROUND_1_TECHNICAL"
    current_topic: str = "Core Engineering"
    difficulty: str = "medium"
    candidate_profile: Dict[str, Any] = Field(default_factory=dict)
    candidate_memory: Dict[str, Any] = Field(default_factory=dict)
    candidate_memory_summary: str = ""
    current_question_index: int = 0
    current_question: Dict[str, Any] = Field(default_factory=dict)
    current_answer: str = ""
    current_evaluation: Dict[str, Any] = Field(default_factory=dict)
    retrieved_context: str = ""
    missing_concepts: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[Dict[str, Any]] = Field(default_factory=list)
    previous_questions: List[str] = Field(default_factory=list)
    interview_plan: Dict[str, Any] = Field(default_factory=dict)
    next_action: str = "START_INTERVIEW"
    action_reason: str = "Initializing interview session."
    is_round_completed: bool = False
    is_interview_completed: bool = False
    learning_plan: Optional[Dict[str, Any]] = None
    history: List[Dict[str, Any]] = Field(default_factory=list)
    agent_reasoning: List[Dict[str, Any]] = Field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert state model to dictionary for DB persistence or API serialization"""
        return self.model_dump()

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "InterviewState":
        """Reconstruct InterviewState from dictionary"""
        if not isinstance(data, dict):
            return cls()
        return cls(**{k: v for k, v in data.items() if k in cls.model_fields})
