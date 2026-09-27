"""
Interview Service Engine for NexHire-AI.
Delegates orchestration to the Agentic Workflow Graph (app.orchestration.graph)
while maintaining 100% backward-compatible function contracts.
"""

from typing import Dict, Any, List, Optional
from app.orchestration.graph import run_agentic_interview_start, run_agentic_interview_turn

DIFFICULTY_LEVELS = ["beginner", "medium", "advanced", "hard"]

QUESTIONS_PER_ROUND = {
    "ROUND_1_TECHNICAL": 4,
    "ROUND_2_MANAGERIAL": 3,
    "ROUND_3_HR": 3,
}

def route_difficulty(current_difficulty: str = "medium", score: float = 7.5) -> Dict[str, str]:
    """
    Deterministic Difficulty Router fallback helper
    """
    diff_lower = (current_difficulty or "medium").lower()
    current_index = DIFFICULTY_LEVELS.index(diff_lower) if diff_lower in DIFFICULTY_LEVELS else 1

    next_difficulty = current_difficulty
    action = "maintain"

    if score >= 8.0:
        if current_index < len(DIFFICULTY_LEVELS) - 1:
            current_index += 1
            next_difficulty = DIFFICULTY_LEVELS[current_index]
            action = "increase"
        else:
            next_difficulty = "hard"
            action = "maintain_peak"
    elif score < 5.0:
        if current_index > 0:
            current_index -= 1
            next_difficulty = DIFFICULTY_LEVELS[current_index]
            action = "remediate"
        else:
            next_difficulty = "beginner"
            action = "maintain_floor"
    else:
        action = "maintain"

    return {"nextDifficulty": next_difficulty, "action": action}

async def initialize_interview_session(
    user_id: Any,
    candidate_name: str = "Candidate",
    target_role: Optional[str] = None,
    round_name: str = "ROUND_1_TECHNICAL",
    skills: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Initializes a new interview session using Agentic Orchestration Graph
    """
    return await run_agentic_interview_start(
        user_id=user_id,
        candidate_name=candidate_name,
        target_role=target_role,
        round_name=round_name,
        skills=skills
    )

async def execute_interview_turn(
    interview: Dict[str, Any],
    user_id: Any,
    answer_text: str,
    duration: float,
    audio_url: str = ""
) -> Dict[str, Any]:
    """
    Executes an answer turn using Agentic Orchestration Graph
    """
    return await run_agentic_interview_turn(
        interview=interview,
        user_id=user_id,
        answer_text=answer_text,
        duration=duration,
        audio_url=audio_url
    )
