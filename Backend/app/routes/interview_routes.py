from typing import Optional
from fastapi import APIRouter, Depends, Request, UploadFile, File, Form, Query
from app.controllers.interview_controller import (
    start_interview_handler,
    get_current_session_handler,
    get_session_by_id_handler,
    switch_round_handler,
    proceed_to_next_round_handler,
    submit_answer_handler,
    pause_interview_handler,
    resume_interview_handler,
    skip_question_handler,
    mark_for_review_handler,
    end_interview_handler,
    get_interview_history_handler,
    delete_interview_handler,
    clear_interview_conversation_handler,
    delete_conversation_message_handler,
    get_stats_handler
)
from app.middleware.auth_middleware import protect

router = APIRouter(tags=["Interview"])

@router.post("/start")
async def start_interview(request: Request, user: dict = Depends(protect)):
    data = await request.json()
    return await start_interview_handler(data, user)

@router.get("/current")
async def get_current_session(
    role: Optional[str] = Query(default=None),
    interviewId: Optional[str] = Query(default=None),
    user: dict = Depends(protect)
):
    return await get_current_session_handler(role, interviewId, user)

@router.get("/session/{id}")
async def get_session_by_id(id: str, user: dict = Depends(protect)):
    return await get_session_by_id_handler(id, user)

@router.post("/switch-round")
async def switch_round(request: Request, user: dict = Depends(protect)):
    data = await request.json()
    return await switch_round_handler(data, user)

@router.post("/proceed-round")
async def proceed_to_next_round(request: Request, user: dict = Depends(protect)):
    data = await request.json()
    return await proceed_to_next_round_handler(data, user)

@router.post("/answer")
async def submit_answer(
    interviewId: str = Form(...),
    text: Optional[str] = Form(default=""),
    duration: Optional[float] = Form(default=None),
    audio: Optional[UploadFile] = File(default=None),
    user: dict = Depends(protect)
):
    return await submit_answer_handler(interviewId, text, duration, audio, user)

@router.post("/pause")
async def pause_interview(request: Request, user: dict = Depends(protect)):
    data = await request.json()
    return await pause_interview_handler(data, user)

@router.post("/resume")
async def resume_interview(request: Request, user: dict = Depends(protect)):
    data = await request.json()
    return await resume_interview_handler(data, user)

@router.post("/skip")
async def skip_question(request: Request, user: dict = Depends(protect)):
    data = await request.json()
    return await skip_question_handler(data, user)

@router.post("/mark-review")
async def mark_for_review(request: Request, user: dict = Depends(protect)):
    data = await request.json()
    return await mark_for_review_handler(data, user)

@router.post("/end")
async def end_interview(request: Request, user: dict = Depends(protect)):
    data = await request.json()
    return await end_interview_handler(data, user)

@router.get("/history")
async def get_interview_history(user: dict = Depends(protect)):
    return await get_interview_history_handler(user)

@router.delete("/{id}/conversation/{messageIndex}")
async def delete_conversation_message(id: str, messageIndex: int, user: dict = Depends(protect)):
    return await delete_conversation_message_handler(id, messageIndex, user)

@router.delete("/{id}/conversation")
async def clear_interview_conversation(id: str, user: dict = Depends(protect)):
    return await clear_interview_conversation_handler(id, user)

@router.delete("/{id}")
async def delete_interview(id: str, user: dict = Depends(protect)):
    return await delete_interview_handler(id, user)

@router.get("/stats")
async def get_stats(user: dict = Depends(protect)):
    return await get_stats_handler(user)
