"""
Graph Execution Engine for NexHire-AI Agentic Orchestration.
Coordinates state transitions across Candidate Memory, Supervisor Agent, Planner Agent,
RAG Agent, Question Agent, Evaluation Agent, and Career Coach Agent.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from app.config.db import get_db
from app.utils.helpers import to_object_id
from app.orchestration.state import InterviewState
from app.orchestration.supervisor import decide_next_action
from app.orchestration.tools import (
    get_candidate_profile,
    get_candidate_memory,
    tool_retrieve_knowledge,
    retrieve_candidate_specific_knowledge,
    tool_generate_question,
    tool_evaluate_answer,
    tool_update_memory,
    update_difficulty,
    tool_generate_career_plan,
)
from app.agents.rag.rag_agent import retrieve_candidate_aware_rag
from app.agents.planner.planner_agent import plan_interview

QUESTIONS_PER_ROUND = {
    "ROUND_1_TECHNICAL": 4,
    "ROUND_2_MANAGERIAL": 3,
    "ROUND_3_HR": 3,
}

async def run_agentic_interview_start(
    user_id: Any,
    candidate_name: str = "Candidate",
    target_role: Optional[str] = None,
    round_name: str = "ROUND_1_TECHNICAL",
    skills: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Executes the initial Agentic Workflow:
    Profile/Memory Ingestion -> Supervisor Decision -> Topic Planning -> RAG Retrieval -> Question Generation
    """
    if skills is None:
        skills = []

    # 1. Fetch candidate profile & memory
    profile = await get_candidate_profile(user_id)
    memory_data = await get_candidate_memory(user_id)

    effective_role = (
        target_role or
        profile.get("targetRole") or
        (profile.get("targetRoles", [None])[0] if profile.get("targetRoles") else "Software Development Engineer (SDE)")
    )

    candidate_skills = [
        s.get("name") if isinstance(s, dict) else str(s)
        for s in profile.get("skills", [])
    ] or skills

    weaknesses = memory_data.get("weaknesses", [])
    memory_summary = memory_data.get("summary", "")

    # 2. Execute Planner Agent
    interview_plan = await plan_interview(
        candidate_profile=profile,
        target_role=effective_role,
        round=round_name,
        candidate_weaknesses=weaknesses,
        candidate_id=user_id
    )

    initial_topic = (
        interview_plan.get("topics", ["Core Fundamentals"])[0]
        if interview_plan.get("topics")
        else (candidate_skills[0] if candidate_skills else "Core Fundamentals")
    )
    initial_difficulty = interview_plan.get("initialDifficulty", "medium")

    # 3. Initialize InterviewState
    state = InterviewState(
        candidate_id=user_id,
        candidate_name=candidate_name,
        target_role=effective_role,
        current_round=round_name,
        current_topic=initial_topic,
        difficulty=initial_difficulty,
        candidate_profile=profile,
        candidate_memory=memory_data,
        candidate_memory_summary=memory_summary,
        interview_plan=interview_plan,
        weaknesses=weaknesses
    )

    # 4. Supervisor Agent decision on opening turn
    supervisor_decision = await decide_next_action(state)
    state.next_action = supervisor_decision["action"]
    state.action_reason = supervisor_decision["reason"]

    # 5. Candidate-aware RAG Agent retrieval
    rag_result = await retrieve_candidate_aware_rag(
        target_role=effective_role,
        current_topic=initial_topic,
        difficulty=initial_difficulty,
        candidate_id=user_id
    )
    state.retrieved_context = rag_result.get("contextSnippet", "")

    # 6. Question Generation Agent
    first_question = await tool_generate_question(
        candidate_name=candidate_name,
        target_role=effective_role,
        round_name=round_name,
        current_topic=initial_topic,
        difficulty=initial_difficulty,
        candidate_skills=candidate_skills,
        candidate_projects=profile.get("projects", []),
        candidate_experience=profile.get("experienceSummary", ""),
        previous_answer="",
        last_evaluation=None,
        weak_areas=profile.get("weakAreas", []),
        candidate_memory_summary=memory_summary,
        rag_context=state.retrieved_context,
        question_index=0,
        is_follow_up=False,
        previous_questions=[],
        candidate_id=user_id
    )

    state.current_question = first_question
    state.agent_reasoning.append({
        "questionIndex": 0,
        "action": supervisor_decision["action"],
        "reason": supervisor_decision["reason"],
        "topic": initial_topic,
        "ragSource": first_question.get("ragSource", "Grounded Knowledge Corpus"),
        "difficultyShift": "initial",
        "timestamp": datetime.utcnow().isoformat()
    })

    return {
        "interviewPlan": interview_plan,
        "initialTopic": initial_topic,
        "initialDifficulty": initial_difficulty,
        "firstQuestion": first_question,
        "ragContext": state.retrieved_context,
        "effectiveRole": effective_role,
        "state": state.to_dict()
    }

async def run_agentic_interview_turn(
    interview: Dict[str, Any],
    user_id: Any,
    answer_text: str,
    duration: float,
    audio_url: str = ""
) -> Dict[str, Any]:
    """
    Executes an answer turn in the Agentic Workflow:
    Answer Evaluation -> Memory Update -> Supervisor Action Decision -> Adaptive Difficulty Routing -> Next Question or Career Plan
    """
    current_q_index = interview.get("currentQuestionIndex", 0)
    active_round = interview.get("currentRound", "ROUND_1_TECHNICAL")
    current_diff = interview.get("difficultyLevel", "medium")
    skills = interview.get("skills", ["DSA", "System Architecture"])
    questions = interview.get("questions", [])
    target_role = interview.get("targetRole", "Software Development Engineer (SDE)")

    current_question_obj = questions[current_q_index] if (current_q_index < len(questions)) else {}
    current_topic = (
        current_question_obj.get("targetSkill") or
        current_question_obj.get("topic") or
        (skills[current_q_index % len(skills)] if skills else "Core Fundamentals")
    )
    current_q_text = interview.get("currentQuestionText", "")

    # 1. LLM-as-a-Judge Evaluation Agent
    evaluation = await tool_evaluate_answer(
        question_text=current_q_text,
        candidate_answer=answer_text,
        expected_concepts=current_question_obj.get("expectedConcepts", []),
        target_skill=current_topic,
        stage=interview.get("currentStage", "TECHNICAL"),
        candidate_name=interview.get("candidateName", "Candidate"),
        candidate_id=user_id,
        interview_id=interview.get("interviewId", "")
    )

    eval_score = float(evaluation.get("overall", 7.5))
    missing_concepts = evaluation.get("missingConcepts", [])

    # 2. Candidate Memory Agent Update
    concept_to_record = missing_concepts[0] if missing_concepts else current_topic
    evidence_text = evaluation.get("areasToImprove") or evaluation.get("feedback") or ""

    await tool_update_memory(
        candidate_id=user_id,
        interview_id=interview.get("interviewId", ""),
        domain=target_role,
        topic=current_topic,
        concept=concept_to_record,
        score=eval_score,
        evidence=evidence_text,
        missing_concepts=missing_concepts
    )

    # 3. Construct current InterviewState for Supervisor observation
    memory_data = await get_candidate_memory(user_id)
    profile = await get_candidate_profile(user_id)

    state = InterviewState(
        candidate_id=user_id,
        interview_id=interview.get("interviewId", ""),
        candidate_name=interview.get("candidateName", "Candidate"),
        target_role=target_role,
        current_round=active_round,
        current_topic=current_topic,
        difficulty=current_diff,
        candidate_profile=profile,
        candidate_memory=memory_data,
        candidate_memory_summary=memory_data.get("summary", ""),
        current_question_index=current_q_index,
        current_question=current_question_obj,
        current_answer=answer_text,
        current_evaluation=evaluation,
        missing_concepts=missing_concepts,
        weaknesses=memory_data.get("weaknesses", []),
        interview_plan=interview.get("interviewPlan", {})
    )

    # 4. Supervisor Agent Decision
    supervisor_decision = await decide_next_action(state)
    action = supervisor_decision["action"]
    next_difficulty = supervisor_decision["difficulty"]
    reason = supervisor_decision["reason"]
    is_remediation = supervisor_decision.get("remediation_needed", False)

    # Map supervisor action to legacy difficulty shift string for backward compatibility
    diff_action_map = {
        "INCREASE_DIFFICULTY": "increase",
        "DECREASE_DIFFICULTY": "remediate",
        "REMEDIATION": "remediate",
        "MAINTAIN_DIFFICULTY": "maintain",
    }
    diff_action = diff_action_map.get(action, "maintain")

    # 5. Check round limits
    max_questions = QUESTIONS_PER_ROUND.get(active_round, 4)
    next_q_index = current_q_index + 1
    is_round_completed = next_q_index >= max_questions or action in ("END_ROUND", "END_INTERVIEW")

    next_question = None
    learning_plan = None

    if not is_round_completed:
        # Resolve next topic
        interview_plan_topics = interview.get("interviewPlan", {}).get("topics", [])
        if is_remediation and missing_concepts:
            next_topic = missing_concepts[0]
        elif supervisor_decision.get("topic") and supervisor_decision["topic"] != current_topic:
            next_topic = supervisor_decision["topic"]
        elif next_q_index < len(interview_plan_topics):
            next_topic = interview_plan_topics[next_q_index]
        elif skills:
            next_topic = skills[next_q_index % len(skills)]
        else:
            next_topic = "System Architecture"

        # Gather previous questions for anti-duplication
        all_prev_texts = [q.get("questionText", "") for q in questions if q.get("questionText")]
        if current_q_text and current_q_text not in all_prev_texts:
            all_prev_texts.append(current_q_text)

        # Candidate-aware RAG Agent retrieval
        rag_result = await retrieve_candidate_aware_rag(
            target_role=target_role,
            current_topic=next_topic,
            difficulty=next_difficulty,
            candidate_id=user_id,
            previous_score=eval_score,
            missing_concepts=missing_concepts
        )

        should_follow_up = is_remediation or eval_score < 6.0

        # Question Agent generation
        next_question = await tool_generate_question(
            candidate_name=interview.get("candidateName", "Candidate"),
            target_role=target_role,
            round_name=active_round,
            current_topic=next_topic,
            difficulty=next_difficulty,
            candidate_skills=skills,
            candidate_projects=profile.get("projects", []),
            candidate_experience=profile.get("experienceSummary", ""),
            previous_answer=answer_text,
            last_evaluation=evaluation,
            weak_areas=profile.get("weakAreas", []),
            candidate_memory_summary=memory_data.get("summary", ""),
            rag_context=rag_result.get("contextSnippet", ""),
            question_index=next_q_index,
            is_follow_up=should_follow_up,
            previous_questions=all_prev_texts,
            candidate_id=user_id,
            interview_id=interview.get("interviewId", "")
        )
    else:
        # Final round completion -> Career Coach Agent
        if active_round == "ROUND_3_HR" or interview.get("currentRound") == "ROUND_3_HR":
            all_evals = list(interview.get("evaluations", [])) + [evaluation]
            coach_result = await tool_generate_career_plan(
                candidate_id=user_id,
                interview_id=interview.get("interviewId", ""),
                target_role=target_role,
                evaluations=all_evals,
                candidate_memories=memory_data.get("weaknesses", [])
            )
            learning_plan = coach_result.get("learningPlan")

    # Record agent decision reasoning trace
    agent_reasoning_trace = {
        "questionIndex": next_q_index,
        "action": action,
        "reason": reason,
        "topic": current_topic if is_round_completed else (next_question.get("topic") if next_question else current_topic),
        "difficultyShift": diff_action,
        "ragSource": next_question.get("ragSource", "Knowledge Base") if next_question else "System",
        "timestamp": datetime.utcnow().isoformat()
    }

    return {
        "evaluation": evaluation,
        "nextDifficulty": next_difficulty,
        "diffAction": diff_action,
        "nextQuestion": next_question,
        "isRoundCompleted": is_round_completed,
        "learningPlan": learning_plan,
        "agentReasoning": agent_reasoning_trace
    }
