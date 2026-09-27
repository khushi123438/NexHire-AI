"""
Supervisor Agent Module for NexHire-AI.
Observes InterviewState and orchestrates adaptive decision loops across agents.
"""

from app.orchestration.supervisor import decide_next_action, ALLOWED_ACTIONS
from app.services.interview_service import (
    initialize_interview_session as start_orchestrated_interview,
    execute_interview_turn as process_orchestrated_answer_turn,
    route_difficulty,
    DIFFICULTY_LEVELS,
)

__all__ = [
    "decide_next_action",
    "ALLOWED_ACTIONS",
    "start_orchestrated_interview",
    "process_orchestrated_answer_turn",
    "route_difficulty",
    "DIFFICULTY_LEVELS",
]
