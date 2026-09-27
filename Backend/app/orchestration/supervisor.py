"""
Supervisor Agent Decision Engine for NexHire-AI.
Observes InterviewState and makes autonomous adaptive orchestration decisions.
"""

import json
from typing import Dict, Any, List
from app.orchestration.state import InterviewState
from app.services.llm_service import call_llm, parse_ai_json

ALLOWED_ACTIONS = [
    "START_INTERVIEW",
    "PLAN_INTERVIEW",
    "GENERATE_QUESTION",
    "RETRIEVE_CONTEXT",
    "EVALUATE_ANSWER",
    "UPDATE_MEMORY",
    "REMEDIATION",
    "CHANGE_TOPIC",
    "INCREASE_DIFFICULTY",
    "DECREASE_DIFFICULTY",
    "MAINTAIN_DIFFICULTY",
    "END_ROUND",
    "END_INTERVIEW",
    "GENERATE_CAREER_PLAN",
]

QUESTIONS_PER_ROUND = {
    "ROUND_1_TECHNICAL": 4,
    "ROUND_2_MANAGERIAL": 3,
    "ROUND_3_HR": 3,
}

async def decide_next_action(state: InterviewState) -> Dict[str, Any]:
    """
    Supervisor Agent LLM Decision Logic.
    Analyzes current InterviewState and selects the optimal adaptive action.
    """
    max_questions = QUESTIONS_PER_ROUND.get(state.current_round, 4)

    # 1. Edge Case: If state requires initial plan or question
    if not state.current_question and state.current_question_index == 0:
        return {
            "action": "PLAN_INTERVIEW",
            "topic": state.current_topic or "Core Fundamentals",
            "difficulty": state.difficulty or "medium",
            "reason": "Initial interview setup: formulating topics and opening question.",
            "next_agent": "planner_agent",
            "remediation_needed": False
        }

    # 2. Check if maximum questions reached for current round
    if state.current_question_index >= max_questions:
        if state.current_round == "ROUND_3_HR":
            return {
                "action": "END_INTERVIEW",
                "topic": "Interview Completion",
                "difficulty": state.difficulty,
                "reason": "Final HR round completed. Transitioning to Career Coach Agent.",
                "next_agent": "career_coach_agent",
                "remediation_needed": False
            }
        else:
            return {
                "action": "END_ROUND",
                "topic": "Round Transition",
                "difficulty": state.difficulty,
                "reason": f"Completed {max_questions} questions for {state.current_round}.",
                "next_agent": "interviewer_agent",
                "remediation_needed": False
            }

    # 3. Analyze last evaluation score if present
    eval_score = float(state.current_evaluation.get("overall", 7.5)) if state.current_evaluation else 7.5
    missing_concepts = state.missing_concepts or (state.current_evaluation.get("missingConcepts", []) if state.current_evaluation else [])

    prompt = f"""
You are the Supervisor Agent for NexHire-AI adaptive interview platform.
Observe the current InterviewState and decide the next optimal adaptive action.

Interview State Summary:
- Target Role: {state.target_role}
- Current Round: {state.current_round}
- Question Index: {state.current_question_index} of {max_questions}
- Current Topic: {state.current_topic}
- Current Difficulty: {state.difficulty}
- Last Evaluation Score: {eval_score}/10
- Missing Concepts: {', '.join(missing_concepts) if missing_concepts else 'None'}
- Strengths: {', '.join(state.strengths) if state.strengths else 'None'}
- Candidate Memory Summary: {state.candidate_memory_summary or 'None'}

Available Actions:
- REMEDIATION: Score < 5.0 or critical concepts missed. Retrieve easier context and ask targeted remediation follow-up.
- INCREASE_DIFFICULTY: Score >= 8.0. Progress candidate to higher difficulty on next topic or deep-dive.
- DECREASE_DIFFICULTY: Score < 6.0 without complete failure. Step down difficulty slightly.
- MAINTAIN_DIFFICULTY: Score 6.0-7.9. Maintain current difficulty and move to next planned topic.
- CHANGE_TOPIC: Current topic completed with satisfactory depth.
- END_ROUND: Max questions reached for round.
- END_INTERVIEW: All interview rounds complete.

Return ONLY valid JSON matching this exact structure:
{{
  "action": "REMEDIATION | INCREASE_DIFFICULTY | DECREASE_DIFFICULTY | MAINTAIN_DIFFICULTY | CHANGE_TOPIC",
  "topic": "Topic Name",
  "difficulty": "beginner | medium | advanced | hard",
  "reason": "Concise justification for decision based on candidate score and missing concepts.",
  "next_agent": "question_agent",
  "remediation_needed": true/false
}}
"""

    llm_result = await call_llm(
        prompt=prompt,
        agent_name="SupervisorAgent",
        interview_id=state.interview_id,
        candidate_id=state.candidate_id,
        temperature=0.2
    )

    if llm_result.get("text"):
        parsed = parse_ai_json(llm_result["text"], None)
        if parsed and parsed.get("action") in ALLOWED_ACTIONS:
            return {
                "action": parsed["action"],
                "topic": parsed.get("topic", state.current_topic),
                "difficulty": parsed.get("difficulty", state.difficulty),
                "reason": parsed.get("reason", f"Adaptive supervisor choice based on score {eval_score}."),
                "next_agent": parsed.get("next_agent", "question_agent"),
                "remediation_needed": bool(parsed.get("remediation_needed", False))
            }

    # 4. Deterministic Fallback Rules if LLM unavailable
    if eval_score < 5.0 and missing_concepts:
        return {
            "action": "REMEDIATION",
            "topic": missing_concepts[0],
            "difficulty": "beginner" if state.difficulty == "medium" else "medium",
            "reason": f"Candidate missed key concept '{missing_concepts[0]}' (Score: {eval_score}). Remediation required.",
            "next_agent": "question_agent",
            "remediation_needed": True
        }
    elif eval_score >= 8.0:
        next_diff = "advanced" if state.difficulty == "medium" else ("hard" if state.difficulty == "advanced" else "hard")
        return {
            "action": "INCREASE_DIFFICULTY",
            "topic": state.current_topic,
            "difficulty": next_diff,
            "reason": f"Strong answer score ({eval_score}/10). Increasing difficulty to {next_diff}.",
            "next_agent": "question_agent",
            "remediation_needed": False
        }
    elif eval_score < 6.0:
        return {
            "action": "DECREASE_DIFFICULTY",
            "topic": state.current_topic,
            "difficulty": "beginner" if state.difficulty in ("medium", "advanced") else "beginner",
            "reason": f"Lower score ({eval_score}/10). Stepping down difficulty.",
            "next_agent": "question_agent",
            "remediation_needed": False
        }

    return {
        "action": "MAINTAIN_DIFFICULTY",
        "topic": state.current_topic,
        "difficulty": state.difficulty,
        "reason": f"Solid answer score ({eval_score}/10). Maintaining current difficulty.",
        "next_agent": "question_agent",
        "remediation_needed": False
    }
