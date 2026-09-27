from typing import Optional, List
from fastapi import APIRouter, Depends, Request, UploadFile, File, Form, Query
from app.controllers.resume_controller import (
    upload_resume_handler,
    analyze_resume_text_handler,
    get_candidate_profile_handler,
    get_current_resume_handler,
    get_all_resumes_handler,
    delete_resume_handler,
    confirm_skills_handler
)
from app.middleware.auth_middleware import protect

router = APIRouter(prefix="/api/resume", tags=["Resume"])

@router.post("/upload")
async def upload_resume(
    resume: UploadFile = File(...),
    targetRole: Optional[str] = Form(default=None),
    user: dict = Depends(protect)
):
    return await upload_resume_handler(resume, targetRole, user)

@router.post("/analyze")
async def analyze_resume_text(request: Request, user: dict = Depends(protect)):
    data = await request.json()
    return await analyze_resume_text_handler(data.get("resumeText", ""), data.get("targetRole", ""), user)

@router.get("/profile")
async def get_candidate_profile(user: dict = Depends(protect)):
    return await get_candidate_profile_handler(user)

@router.get("/current")
async def get_current_resume(role: Optional[str] = Query(default=None), user: dict = Depends(protect)):
    return await get_current_resume_handler(role, user)

@router.get("/all")
async def get_all_resumes(user: dict = Depends(protect)):
    return await get_all_resumes_handler(user)

@router.delete("/{id}")
async def delete_resume(id: str, user: dict = Depends(protect)):
    return await delete_resume_handler(id, user)

@router.put("/skills")
async def confirm_skills(request: Request, user: dict = Depends(protect)):
    data = await request.json()
    return await confirm_skills_handler(
        skills=data.get("skills", []),
        target_role=data.get("targetRole"),
        resume_id=data.get("resumeId"),
        user=user
    )
