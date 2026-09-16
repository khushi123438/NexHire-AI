from typing import Optional
from fastapi import HTTPException, status
from app.config.db import get_db
from app.utils.helpers import to_object_id, serialize_doc
from app.services.memory_service import get_candidate_weaknesses, get_candidate_strengths
from app.agents.career_coach.career_coach_agent import generate_learning_roadmap

async def get_candidate_weaknesses_handler(user: dict) -> dict:
    try:
        candidate_id = user["id"]
        weaknesses = await get_candidate_weaknesses(candidate_id, 20)
        strengths = await get_candidate_strengths(candidate_id, 20)

        return {
            "success": True,
            "weaknesses": weaknesses,
            "strengths": strengths
        }
    except Exception as e:
        print(f"[Learning Weaknesses Error]: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": str(e)}
        )

async def generate_learning_plan_handler(data: dict, user: dict) -> dict:
    try:
        candidate_id = user["id"]
        target_role = data.get("targetRole", "Software Development Engineer (SDE)")
        interview_id = data.get("interviewId", "")

        weaknesses = await get_candidate_weaknesses(candidate_id, 10)
        result = await generate_learning_roadmap(
            candidate_id=candidate_id,
            interview_id=interview_id,
            target_role=target_role,
            evaluations=[],
            candidate_memories=weaknesses
        )

        return {
            "success": True,
            "learningPlan": result.get("learningPlan"),
            **result
        }
    except Exception as e:
        print(f"[Learning Plan Generate Error]: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": str(e)}
        )

async def get_learning_plans_by_candidate_handler(candidate_id_param: Optional[str], user: dict) -> dict:
    try:
        candidate_id = candidate_id_param or user["id"]
        c_id = to_object_id(candidate_id)
        db = get_db()

        cursor = db.learningplans.find({"candidateId": c_id}).sort("createdAt", -1)
        plans = [serialize_doc(p) async for p in cursor]
        latest_plan = plans[0] if plans else None

        return {
            "success": True,
            "learningPlan": latest_plan,
            "allPlans": plans
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": str(e)}
        )
