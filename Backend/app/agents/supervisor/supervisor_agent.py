import random
from typing import Dict, Any, List, Optional
from app.config.db import get_db
from app.utils.helpers import to_object_id
from app.agents.planner.planner_agent import plan_interview
from app.agents.question.question_agent import generate_question
from app.agents.evaluation.evaluation_agent import evaluate_candidate_answer
from app.agents.career_coach.career_coach_agent import generate_learning_roadmap
from app.rag.retrieval.retrieval_service import retrieve_knowledge
from app.services.memory_service import (
    record_evaluation_memory,
    get_candidate_weaknesses,
    get_candidate_memory_summary,
)

DIFFICULTY_LEVELS = ["beginner", "medium", "advanced", "hard"]

def route_difficulty(current_difficulty: str = "medium", score: float = 7.5) -> Dict[str, str]:
    """
    Deterministic Difficulty Router
    Computes next difficulty level strictly based on rubric evaluation score
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

async def start_orchestrated_interview(
    user_id: Any,
    candidate_name: str = "Candidate",
    target_role: str = "Software Development Engineer (SDE)",
    round: str = "ROUND_1_TECHNICAL",
    skills: List[str] = None
) -> Dict[str, Any]:
    """
    Supervisor: Orchestrate Interview Initialization matching Node.js
    """
    if skills is None:
        skills = []

    db = get_db()
    u_id = to_object_id(user_id)

    # 1. Fetch Candidate Profile & Historical Memory
    candidate_profile = await db.candidateprofiles.find_one({"userId": u_id})
    if not candidate_profile and skills:
        candidate_profile = {
            "skills": [{"name": s, "level": "intermediate", "confidence": 0.8} for s in skills],
            "targetRoles": [target_role]
        }

    candidate_weaknesses = await get_candidate_weaknesses(user_id, 5)
    memory_summary = await get_candidate_memory_summary(user_id)

    # 2. Planner Agent builds topic & difficulty roadmap
    interview_plan = await plan_interview(
        candidate_profile=candidate_profile,
        target_role=target_role,
        round=round,
        candidate_weaknesses=candidate_weaknesses,
        candidate_id=user_id
    )

    initial_topic = interview_plan.get("topics", ["Core Fundamentals"])[0] if interview_plan.get("topics") else (skills[0] if skills else "Core Fundamentals")
    initial_difficulty = interview_plan.get("initialDifficulty", "medium")

    # 3. RAG Retrieval for initial topic
    domain_val = "Java" if "Java" in initial_topic else ("React" if "React" in initial_topic else "General")
    rag_result = await retrieve_knowledge(
        query=initial_topic,
        domain=domain_val,
        topic=initial_topic,
        difficulty=initial_difficulty,
        topK=2
    )

    # 4. Question Generation Agent crafts first question
    first_question = await generate_question(
        candidate_name=candidate_name,
        target_role=target_role,
        round=round,
        current_topic=initial_topic,
        difficulty=initial_difficulty,
        previous_answer="",
        last_evaluation=None,
        rag_context=rag_result.get("contextSnippet", ""),
        candidate_memory_summary=memory_summary,
        question_index=0,
        is_follow_up=False,
        candidate_id=user_id
    )

    return {
        "interviewPlan": interview_plan,
        "initialTopic": initial_topic,
        "initialDifficulty": initial_difficulty,
        "firstQuestion": first_question,
        "ragContext": rag_result.get("contextSnippet", "")
    }

async def process_orchestrated_answer_turn(
    interview: Dict[str, Any],
    user_id: Any,
    answer_text: str,
    duration: float,
    audio_url: str = ""
) -> Dict[str, Any]:
    """
    Supervisor: Process Candidate Answer Turn with Closed-Loop Orchestration matching Node.js
    """
    current_q_index = interview.get("currentQuestionIndex", 0)
    active_round = interview.get("currentRound", "ROUND_1_TECHNICAL")
    current_diff = interview.get("difficultyLevel", "medium")
    skills = interview.get("skills", ["DSA", "System Architecture"])
    questions = interview.get("questions", [])

    current_question_obj = questions[current_q_index] if (current_q_index < len(questions)) else {}
    current_topic = (
        current_question_obj.get("targetSkill") or
        current_question_obj.get("topic") or
        (skills[current_q_index % len(skills)] if skills else "Core Fundamentals")
    )

    current_q_text = interview.get("currentQuestionText", "")

    # 1. Evaluation Agent scores answer via 5-factor rubric
    evaluation = await evaluate_candidate_answer(
        question_text=current_q_text,
        candidate_answer=answer_text,
        expected_concepts=current_question_obj.get("expectedConcepts", []),
        target_skill=current_topic,
        stage=interview.get("currentStage", "TECHNICAL"),
        candidate_name=interview.get("candidateName", "Candidate"),
        candidate_id=user_id,
        interview_id=interview.get("interviewId", "")
    )

    # 2. Deterministic Difficulty Adjustment
    route_res = route_difficulty(current_diff, evaluation.get("overall", 7.5))
    next_difficulty = route_res["nextDifficulty"]
    diff_action = route_res["action"]

    # 3. Update Candidate Memory with weaknesses or strengths
    missing_concepts = evaluation.get("missingConcepts", [])
    concept_to_record = missing_concepts[0] if missing_concepts else current_topic
    evidence_text = evaluation.get("areasToImprove") or evaluation.get("feedback") or ""

    await record_evaluation_memory(
        candidate_id=user_id,
        interview_id=interview.get("interviewId", ""),
        domain=current_topic,
        topic=current_topic,
        concept=concept_to_record,
        score=evaluation.get("overall", 7.0),
        evidence=evidence_text,
        missing_concepts=missing_concepts
    )

    # Check round limits
    max_questions = 4 if active_round == "ROUND_1_TECHNICAL" else 3
    next_q_index = current_q_index + 1
    is_round_completed = next_q_index >= max_questions

    next_question = None
    learning_plan = None

    if not is_round_completed:
        # 4. Retrieve RAG Context for the next question topic
        interview_plan_topics = interview.get("interviewPlan", {}).get("topics", [])
        if next_q_index < len(interview_plan_topics):
            next_topic = interview_plan_topics[next_q_index]
        elif skills:
            next_topic = skills[next_q_index % len(skills)]
        else:
            next_topic = "System Architecture"

        memory_summary = await get_candidate_memory_summary(user_id)

        rag_result = await retrieve_knowledge(
            query=next_topic,
            domain=next_topic,
            topic=next_topic,
            difficulty=next_difficulty,
            topK=2
        )

        should_follow_up = evaluation.get("overall", 8.0) < 6.0 or (len(missing_concepts) > 0 and random.random() > 0.4)

        # 5. Question Generation Agent produces grounded next question
        next_question = await generate_question(
            candidate_name=interview.get("candidateName", "Candidate"),
            target_role=interview.get("targetRole", "Software Development Engineer (SDE)"),
            round=active_round,
            current_topic=next_topic,
            difficulty=next_difficulty,
            previous_answer=answer_text,
            last_evaluation=evaluation,
            rag_context=rag_result.get("contextSnippet", ""),
            candidate_memory_summary=memory_summary,
            question_index=next_q_index,
            is_follow_up=should_follow_up,
            candidate_id=user_id,
            interview_id=interview.get("interviewId", "")
        )
    else:
        # Final round completion check
        if active_round == "ROUND_3_HR" or interview.get("currentRound") == "ROUND_3_HR":
            all_weaknesses = await get_candidate_weaknesses(user_id, 10)
            all_evals = list(interview.get("evaluations", [])) + [evaluation]
            coach_result = await generate_learning_roadmap(
                candidate_id=user_id,
                interview_id=interview.get("interviewId", ""),
                target_role=interview.get("targetRole", "Software Development Engineer (SDE)"),
                evaluations=all_evals,
                candidate_memories=all_weaknesses
            )
            learning_plan = coach_result.get("learningPlan")

    return {
        "evaluation": evaluation,
        "nextDifficulty": next_difficulty,
        "diffAction": diff_action,
        "nextQuestion": next_question,
        "isRoundCompleted": is_round_completed,
        "learningPlan": learning_plan
    }
