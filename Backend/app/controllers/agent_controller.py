from fastapi import HTTPException, status
from app.rag.retrieval.retrieval_service import retrieve_knowledge
from app.agents.question.question_agent import generate_question
from app.agents.evaluation.evaluation_agent import evaluate_candidate_answer
from app.agents.career_coach.career_coach_agent import generate_learning_roadmap

async def generate_agent_question_handler(data: dict, user: dict) -> dict:
    try:
        candidate_name = data.get("candidateName") or user.get("name") or "Candidate"
        target_role = data.get("targetRole") or "Software Development Engineer (SDE)"
        round_name = data.get("round") or "ROUND_1_TECHNICAL"
        current_topic = data.get("currentTopic") or "Core Engineering"
        difficulty = data.get("difficulty") or "medium"
        previous_answer = data.get("previousAnswer") or ""
        last_evaluation = data.get("lastEvaluation")
        is_follow_up = bool(data.get("isFollowUp", False))
        question_index = int(data.get("questionIndex", 0))

        rag = await retrieve_knowledge(
            query=current_topic or target_role or "Software Engineering",
            domain=current_topic,
            topic=current_topic,
            difficulty=difficulty,
            topK=2
        )

        question = await generate_question(
            candidate_name=candidate_name,
            target_role=target_role,
            round=round_name,
            current_topic=current_topic,
            difficulty=difficulty,
            previous_answer=previous_answer,
            last_evaluation=last_evaluation,
            rag_context=rag.get("contextSnippet", ""),
            question_index=question_index,
            is_follow_up=is_follow_up,
            candidate_id=user.get("id")
        )

        return {
            "success": True,
            "question": question,
            "ragContext": rag.get("contextSnippet", "")
        }
    except Exception as e:
        print(f"[Agent Question Error]: {e}")
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

        evaluation = await evaluate_candidate_answer(
            question_text=question_text,
            candidate_answer=candidate_answer,
            expected_concepts=expected_concepts,
            target_skill=target_skill,
            stage=stage,
            candidate_name=user.get("name", "Candidate"),
            candidate_id=user.get("id")
        )

        return {
            "success": True,
            "evaluation": evaluation
        }
    except Exception as e:
        print(f"[Agent Evaluation Error]: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": str(e)}
        )

async def run_career_coach_handler(data: dict, user: dict) -> dict:
    try:
        target_role = data.get("targetRole", "Software Development Engineer (SDE)")
        evaluations = data.get("evaluations", [])
        candidate_memories = data.get("candidateMemories", [])

        result = await generate_learning_roadmap(
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
        print(f"[Career Coach Error]: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": str(e)}
        )
