"""
Agent Tools Layer for NexHire-AI.
Provides standardized, modular tool execution interfaces for agents.
"""

from typing import Dict, Any, List, Optional
from app.config.db import get_db
from app.utils.helpers import to_object_id, serialize_doc
from app.services.memory_service import (
    get_candidate_weaknesses,
    get_candidate_strengths,
    get_candidate_memory_summary,
    record_evaluation_memory,
    query_relevant_memory,
)
from app.rag.retrieval.retrieval_service import retrieve_knowledge
from app.agents.planner.planner_agent import plan_interview
from app.agents.question.question_agent import generate_question as agent_generate_question
from app.agents.evaluation.evaluation_agent import evaluate_candidate_answer
from app.agents.career_coach.career_coach_agent import generate_career_roadmap

DIFFICULTY_LEVELS = ["beginner", "medium", "advanced", "hard"]

async def get_candidate_profile(user_id: Any) -> Dict[str, Any]:
    """Retrieve structured candidate profile from MongoDB"""
    if not user_id:
        return {}
    try:
        db = get_db()
        u_id = to_object_id(user_id)
        profile = await db.candidateprofiles.find_one({"userId": u_id})
        return serialize_doc(profile) if profile else {}
    except Exception as err:
        print(f"[Tools] get_candidate_profile error: {err}")
        return {}

async def get_candidate_memory(user_id: Any) -> Dict[str, Any]:
    """Retrieve full candidate memory summary, active weaknesses, and strengths"""
    if not user_id:
        return {"summary": "", "weaknesses": [], "strengths": []}
    try:
        summary = await get_candidate_memory_summary(user_id)
        weaknesses = await get_candidate_weaknesses(user_id, limit=10)
        strengths = await get_candidate_strengths(user_id, limit=10)
        return {
            "summary": summary,
            "weaknesses": weaknesses,
            "strengths": strengths,
        }
    except Exception as err:
        print(f"[Tools] get_candidate_memory error: {err}")
        return {"summary": "", "weaknesses": [], "strengths": []}

async def tool_retrieve_knowledge(
    query: str,
    domain: str = "General",
    topic: str = "General",
    difficulty: str = "medium",
    top_k: int = 2
) -> Dict[str, Any]:
    """Retrieve grounded engineering & domain knowledge from RAG system"""
    return await retrieve_knowledge(
        query=query,
        domain=domain,
        topic=topic,
        difficulty=difficulty,
        topK=top_k
    )

async def retrieve_candidate_specific_knowledge(
    user_id: Any,
    topic: str,
    target_role: str = "Software Development Engineer (SDE)",
    difficulty: str = "medium"
) -> Dict[str, Any]:
    """Retrieve candidate-aware RAG context considering candidate memory and topic"""
    relevant_memories = await query_relevant_memory(user_id, query_text=topic, topic=topic, limit=3)
    memory_terms = [m.get("concept", "") for m in relevant_memories if m.get("concept")]
    augmented_query = f"{topic} {' '.join(memory_terms)}" if memory_terms else topic

    return await tool_retrieve_knowledge(
        query=augmented_query,
        domain=target_role,
        topic=topic,
        difficulty=difficulty,
        top_k=2
    )

async def tool_generate_question(
    candidate_name: str,
    target_role: str,
    round_name: str,
    current_topic: str,
    difficulty: str,
    candidate_skills: List[str],
    candidate_projects: List[Any],
    candidate_experience: str,
    previous_answer: str,
    last_evaluation: Optional[Dict[str, Any]],
    weak_areas: List[str],
    candidate_memory_summary: str,
    rag_context: str,
    question_index: int,
    is_follow_up: bool,
    previous_questions: List[str],
    candidate_id: Any = None,
    interview_id: str = ""
) -> Dict[str, Any]:
    """Invoke Question Generation Agent with candidate context & RAG context"""
    return await agent_generate_question(
        candidate_name=candidate_name,
        target_role=target_role,
        round=round_name,
        current_domain=target_role,
        current_topic=current_topic,
        difficulty=difficulty,
        candidate_skills=candidate_skills,
        candidate_projects=candidate_projects,
        candidate_experience=candidate_experience,
        previous_answer=previous_answer,
        last_evaluation=last_evaluation,
        weak_areas=weak_areas,
        candidate_memory_summary=candidate_memory_summary,
        rag_context=rag_context,
        question_index=question_index,
        is_follow_up=is_follow_up,
        previous_questions=previous_questions,
        candidate_id=candidate_id,
        interview_id=interview_id
    )

async def tool_evaluate_answer(
    question_text: str,
    candidate_answer: str,
    expected_concepts: List[str],
    target_skill: str,
    stage: str,
    candidate_name: str,
    candidate_id: Any = None,
    interview_id: str = ""
) -> Dict[str, Any]:
    """Invoke LLM-as-a-Judge Evaluation Agent"""
    return await evaluate_candidate_answer(
        question_text=question_text,
        candidate_answer=candidate_answer,
        expected_concepts=expected_concepts,
        target_skill=target_skill,
        stage=stage,
        candidate_name=candidate_name,
        candidate_id=candidate_id,
        interview_id=interview_id
    )

async def tool_update_memory(
    candidate_id: Any,
    interview_id: str,
    domain: str,
    topic: str,
    concept: str,
    score: float,
    evidence: str,
    missing_concepts: List[str]
) -> Optional[Dict[str, Any]]:
    """Record evaluation outcome into candidate memory"""
    return await record_evaluation_memory(
        candidate_id=candidate_id,
        interview_id=interview_id,
        domain=domain,
        topic=topic,
        concept=concept,
        score=score,
        evidence=evidence,
        missing_concepts=missing_concepts
    )

def update_difficulty(current_difficulty: str, action: str) -> str:
    """Calculates updated difficulty based on supervisor action"""
    curr = (current_difficulty or "medium").lower()
    idx = DIFFICULTY_LEVELS.index(curr) if curr in DIFFICULTY_LEVELS else 1

    if action == "INCREASE_DIFFICULTY" and idx < len(DIFFICULTY_LEVELS) - 1:
        return DIFFICULTY_LEVELS[idx + 1]
    elif action in ("DECREASE_DIFFICULTY", "REMEDIATION") and idx > 0:
        return DIFFICULTY_LEVELS[idx - 1]
    return curr

async def tool_generate_career_plan(
    candidate_id: Any,
    interview_id: str,
    target_role: str,
    evaluations: List[Dict[str, Any]],
    candidate_memories: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Invoke Career Coach Agent to build a 5-day personalized roadmap"""
    return await generate_career_roadmap(
        candidate_id=candidate_id,
        interview_id=interview_id,
        target_role=target_role,
        evaluations=evaluations,
        candidate_memories=candidate_memories
    )

async def get_interview_history(interview_id: str) -> Optional[Dict[str, Any]]:
    """Fetch interview record from DB by interviewId"""
    if not interview_id:
        return None
    try:
        db = get_db()
        doc = await db.interviews.find_one({"interviewId": interview_id})
        return serialize_doc(doc) if doc else None
    except Exception as err:
        print(f"[Tools] get_interview_history error: {err}")
        return None
