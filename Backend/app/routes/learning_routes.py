from typing import Optional
from fastapi import APIRouter, Depends, Request
from app.controllers.learning_controller import (
    get_candidate_weaknesses_handler,
    generate_learning_plan_handler,
    get_learning_plans_by_candidate_handler
)
from app.middleware.auth_middleware import protect

router = APIRouter(prefix="/api/learning", tags=["Learning"])

@router.get("/weaknesses")
async def get_weaknesses(user: dict = Depends(protect)):
    return await get_candidate_weaknesses_handler(user)

@router.post("/generate-plan")
async def generate_learning_plan(request: Request, user: dict = Depends(protect)):
    data = await request.json()
    return await generate_learning_plan_handler(data, user)

@router.get("/{candidateId}")
async def get_learning_plans_for_id(candidateId: str, user: dict = Depends(protect)):
    return await get_learning_plans_by_candidate_handler(candidateId, user)

@router.get("/")
async def get_my_learning_plans(user: dict = Depends(protect)):
    return await get_learning_plans_by_candidate_handler(None, user)
