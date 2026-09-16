from fastapi import APIRouter, Depends, Request
from app.controllers.agent_controller import (
    generate_agent_question_handler,
    evaluate_agent_answer_handler,
    run_career_coach_handler
)
from app.middleware.auth_middleware import protect

router = APIRouter(prefix="/api/agent", tags=["Agent"])

@router.post("/interview")
async def generate_agent_question(request: Request, user: dict = Depends(protect)):
    data = await request.json()
    return await generate_agent_question_handler(data, user)

@router.post("/evaluate")
async def evaluate_agent_answer(request: Request, user: dict = Depends(protect)):
    data = await request.json()
    return await evaluate_agent_answer_handler(data, user)

@router.post("/coach")
async def run_career_coach(request: Request, user: dict = Depends(protect)):
    data = await request.json()
    return await run_career_coach_handler(data, user)
