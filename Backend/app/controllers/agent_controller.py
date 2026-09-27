from fastapi import HTTPException, status
from app.services.rag_service import get_rag_context
from app.services.genai_service import generate_interview_question, generate_candidate_learning_roadmap
from app.services.evaluation_service import evaluate_candidate_response

async def generate_agent_question_handler(data: dict, user: dict) -> dict:
    try:
        from app.config.db import get_db
        from app.utils.helpers import to_object_id
        from app.services.memory_service import get_candidate_memory_summary

        user_id = user.get("id")
        candidate_name = data.get("candidateName") or user.get("name") or "Candidate"
        target_role = data.get("targetRole") or "Software Development Engineer (SDE)"
        round_name = data.get("round") or "ROUND_1_TECHNICAL"
        current_topic = data.get("currentTopic") or "Core Engineering"
        difficulty = data.get("difficulty") or "medium"
        previous_answer = data.get("previousAnswer") or ""
        last_evaluation = data.get("lastEvaluation")
        is_follow_up = bool(data.get("isFollowUp", False))
        question_index = int(data.get("questionIndex", 0))
        previous_questions = data.get("previousQuestions", [])

        db = get_db()
        candidate_profile = await db.candidateprofiles.find_one({"userId": to_object_id(user_id)}) if user_id else None
        skills = [s.get("name") if isinstance(s, dict) else str(s) for s in (candidate_profile.get("skills", []) if candidate_profile else [])] or data.get("skills", [])
        projects = candidate_profile.get("projects", []) if candidate_profile else []
        experience = candidate_profile.get("experienceSummary", "") if candidate_profile else ""
        weak_areas = candidate_profile.get("weakAreas", []) if candidate_profile else []
        memory_summary = await get_candidate_memory_summary(user_id) if user_id else ""

        rag = await get_rag_context(
            query=current_topic,
            domain=target_role,
            topic=current_topic,
            difficulty=difficulty,
            top_k=2
        )

        question = await generate_interview_question(
            candidate_name=candidate_name,
            target_role=target_role,
            round_name=round_name,
            current_domain=target_role,
            current_topic=current_topic,
            difficulty=difficulty,
            candidate_skills=skills,
            candidate_projects=projects,
            candidate_experience=experience,
            previous_answer=previous_answer,
            last_evaluation=last_evaluation,
            weak_areas=weak_areas,
            candidate_memory_summary=memory_summary,
            rag_context=rag.get("contextSnippet", ""),
            question_index=question_index,
            is_follow_up=is_follow_up,
            previous_questions=previous_questions
        )

        return {
            "success": True,
            "question": question,
            "ragContext": rag.get("contextSnippet", "")
        }
    except Exception as e:
        print(f"[Question Generator Error]: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": str(e)}
        )

async def evaluate_agent_answer_handler(data: dict, user: dict) -> dict:
    try:
        question_text = data.get("questionText", "")
        candidate_answer = data.get("candidateAnswer", "")
        expected_concepts = data.get("expectedConcepts", [])
        target_skill = data.get("targetSkill", "Technical Skills")
        stage = data.get("stage", "TECHNICAL")

        evaluation = await evaluate_candidate_response(
            question_text=question_text,
            candidate_answer=candidate_answer,
            expected_concepts=expected_concepts,
            target_skill=target_skill,
            stage=stage,
            candidate_name=user.get("name", "Candidate")
        )

        return {
            "success": True,
            "evaluation": evaluation
        }
    except Exception as e:
        print(f"[Answer Evaluation Error]: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": str(e)}
        )

async def run_career_coach_handler(data: dict, user: dict) -> dict:
    try:
        target_role = data.get("targetRole", "Software Development Engineer (SDE)")
        evaluations = data.get("evaluations", [])
        candidate_memories = data.get("candidateMemories", [])

        result = await generate_candidate_learning_roadmap(
            candidate_id=user.get("id"),
            target_role=target_role,
            evaluations=evaluations,
            candidate_memories=candidate_memories
        )

        return {
            "success": True,
            **result
        }
    except Exception as e:
        print(f"[Career Guidance Error]: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": str(e)}
        )
