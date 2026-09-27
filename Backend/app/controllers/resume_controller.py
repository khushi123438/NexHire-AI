import os
import io
from pathlib import Path
from datetime import datetime
from typing import Optional, List
from fastapi import UploadFile, HTTPException, status
from app.config.db import get_db
from app.utils.helpers import to_object_id, serialize_doc
from app.nlp.resume_parser import extract_text_from_pdf_bytes
from app.services.nlp_service import analyze_candidate_resume
from app.middleware.upload import save_resume_file, BACKEND_DIR

async def upload_resume_handler(file: Optional[UploadFile], target_role: Optional[str], user: dict) -> dict:
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Resume not uploaded"}
        )

    user_id = user["id"]
    u_id = to_object_id(user_id)
    raw_role = (target_role or "").strip()

    # Save uploaded PDF to uploads/resumes
    saved_meta = await save_resume_file(file)
    extracted_text = extract_text_from_pdf_bytes(saved_meta["content_bytes"])

    # Run NLP Resume Processing Pipeline
    structured_profile = await analyze_candidate_resume(
        resume_text=extracted_text,
        user_id=user_id,
        target_role=raw_role or None
    )

    extracted_skills = [s.get("name") for s in structured_profile.get("skills", []) if s.get("name")]
    
    # If no target role was explicitly selected, adopt top recommended role from NLP analysis
    selected_role = raw_role or (structured_profile.get("targetRoles", [None])[0] if structured_profile.get("targetRoles") else None)

    project_items = structured_profile.get("projectSummaries") or [
        (p.get("name", "Project") if isinstance(p, dict) else str(p))
        for p in structured_profile.get("projects", [])
    ]
    cert_items = structured_profile.get("certifications", [])

    db = get_db()

    # Clean up existing resume with same targetRole if role specified
    if selected_role:
        cursor = db.resumes.find({"user": u_id, "targetRole": selected_role})
        async for old_res in cursor:
            old_url = old_res.get("resumeUrl", "")
            if old_url and old_url != saved_meta["url"]:
                old_path = BACKEND_DIR / old_url.lstrip("/")
                if old_path.exists():
                    try:
                        os.remove(old_path)
                    except Exception:
                        pass
        await db.resumes.delete_many({"user": u_id, "targetRole": selected_role})

    # Save new Resume in MongoDB
    new_resume = {
        "user": u_id,
        "fileName": saved_meta["originalname"],
        "targetRole": selected_role,
        "resumeUrl": saved_meta["url"],
        "extractedText": extracted_text,
        "skills": extracted_skills,
        "education": structured_profile.get("educationSummary", ""),
        "experience": structured_profile.get("experienceSummary", ""),
        "projects": project_items,
        "certifications": cert_items,
        "uploadedAt": datetime.utcnow()
    }

    res = await db.resumes.insert_one(new_resume)
    new_resume["_id"] = res.inserted_id

    # Update User model
    await db.users.update_one(
        {"_id": u_id},
        {"$set": {
            "skills": extracted_skills,
            "resume": saved_meta["url"],
            "updatedAt": datetime.utcnow()
        }}
    )

    all_resumes_cursor = db.resumes.find({"user": u_id}).sort("uploadedAt", -1)
    all_resumes = [serialize_doc(r) async for r in all_resumes_cursor]

    role_display = f' for "{selected_role}"' if selected_role else ""
    return {
        "success": True,
        "message": f'Resume{role_display} uploaded and analyzed successfully 🚀',
        "resume": serialize_doc(new_resume),
        "allResumes": all_resumes,
        "skills": extracted_skills,
        "structuredProfile": structured_profile,
        "recommendations": structured_profile.get("recommendations", []),
        "roleRecommendations": structured_profile.get("roleRecommendations", {}),
        "targetRole": selected_role,
    }


async def analyze_resume_text_handler(resume_text: str, target_role: Optional[str], user: dict) -> dict:
    if not resume_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Resume text is required."}
        )

    user_id = user["id"]
    structured_profile = await analyze_candidate_resume(
        resume_text=resume_text,
        user_id=user_id,
        target_role=target_role or None
    )

    return {
        "success": True,
        "structuredProfile": structured_profile,
        "roleRecommendations": structured_profile.get("roleRecommendations", {})
    }

async def get_candidate_profile_handler(user: dict) -> dict:
    user_id = user["id"]
    u_id = to_object_id(user_id)
    db = get_db()

    profile = await db.candidateprofiles.find_one({"userId": u_id})

    if not profile:
        latest_resume = await db.resumes.find_one({"user": u_id}, sort=[("uploadedAt", -1)])
        if latest_resume:
            profile = await analyze_candidate_resume(
                resume_text=latest_resume.get("extractedText", ""),
                user_id=user_id,
                target_role=latest_resume.get("targetRole")
            )

    return {
        "success": True,
        "candidateProfile": serialize_doc(profile)
    }

async def get_current_resume_handler(role: Optional[str], user: dict) -> dict:
    user_id = user["id"]
    u_id = to_object_id(user_id)
    db = get_db()

    cursor = db.resumes.find({"user": u_id}).sort("uploadedAt", -1)
    all_resumes = [serialize_doc(r) async for r in cursor]

    active_resume = None
    if role:
        for r in all_resumes:
            if r.get("targetRole", "").lower() == role.lower():
                active_resume = r
                break

    if not active_resume and all_resumes:
        active_resume = all_resumes[0]

    candidate_profile = await db.candidateprofiles.find_one({"userId": u_id})

    skills = []
    if active_resume:
        skills = active_resume.get("skills", [])
    elif candidate_profile and candidate_profile.get("skills"):
        skills = [s.get("name") for s in candidate_profile.get("skills", []) if s.get("name")]
    elif user.get("skills"):
        skills = user.get("skills", [])

    return {
        "success": True,
        "hasResume": active_resume is not None,
        "resume": active_resume,
        "resumes": all_resumes,
        "skills": skills,
        "candidateProfile": serialize_doc(candidate_profile),
        "targetRole": active_resume.get("targetRole") if active_resume else (role or "Software Development Engineer (SDE)")
    }

async def get_all_resumes_handler(user: dict) -> dict:
    user_id = user["id"]
    u_id = to_object_id(user_id)
    db = get_db()

    cursor = db.resumes.find({"user": u_id}).sort("uploadedAt", -1)
    all_resumes = [serialize_doc(r) async for r in cursor]

    return {
        "success": True,
        "resumes": all_resumes
    }

async def delete_resume_handler(id_or_role: str, user: dict) -> dict:
    user_id = user["id"]
    u_id = to_object_id(user_id)
    db = get_db()

    if id_or_role and id_or_role != "all":
        resume_to_delete = None
        if to_object_id(id_or_role):
            resume_to_delete = await db.resumes.find_one({"_id": to_object_id(id_or_role), "user": u_id})
        if not resume_to_delete:
            resume_to_delete = await db.resumes.find_one({"targetRole": id_or_role, "user": u_id})

        if resume_to_delete:
            if resume_to_delete.get("resumeUrl"):
                file_path = BACKEND_DIR / resume_to_delete["resumeUrl"].lstrip("/")
                if file_path.exists():
                    try:
                        os.remove(file_path)
                    except Exception:
                        pass
            await db.resumes.delete_one({"_id": resume_to_delete["_id"]})
    else:
        # Delete all
        cursor = db.resumes.find({"user": u_id})
        async for old_res in cursor:
            if old_res.get("resumeUrl"):
                file_path = BACKEND_DIR / old_res["resumeUrl"].lstrip("/")
                if file_path.exists():
                    try:
                        os.remove(file_path)
                    except Exception:
                        pass
        await db.resumes.delete_many({"user": u_id})
        await db.users.update_one({"_id": u_id}, {"$set": {"skills": [], "resume": "", "updatedAt": datetime.utcnow()}})
        await db.candidateprofiles.delete_one({"userId": u_id})

    remaining_cursor = db.resumes.find({"user": u_id}).sort("uploadedAt", -1)
    remaining = [serialize_doc(r) async for r in remaining_cursor]

    return {
        "success": True,
        "message": "Resume deleted successfully",
        "resumes": remaining,
        "hasResume": len(remaining) > 0,
        "resume": remaining[0] if remaining else None,
        "skills": remaining[0].get("skills", []) if remaining else []
    }

async def confirm_skills_handler(skills: List[str], target_role: Optional[str], resume_id: Optional[str], user: dict) -> dict:
    if not isinstance(skills, list):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Skills must be an array of strings"}
        )

    user_id = user["id"]
    u_id = to_object_id(user_id)
    db = get_db()

    await db.users.update_one({"_id": u_id}, {"$set": {"skills": skills, "updatedAt": datetime.utcnow()}})

    if resume_id:
        r_id = to_object_id(resume_id)
        update_doc = {"skills": skills}
        if target_role:
            update_doc["targetRole"] = target_role
        await db.resumes.update_one({"_id": r_id}, {"$set": update_doc})
    else:
        latest_res = await db.resumes.find_one({"user": u_id}, sort=[("uploadedAt", -1)])
        if latest_res:
            update_doc = {"skills": skills}
            if target_role:
                update_doc["targetRole"] = target_role
            await db.resumes.update_one({"_id": latest_res["_id"]}, {"$set": update_doc})

    # Update CandidateProfile
    formatted_skills = [{"name": s, "level": "intermediate", "confidence": 0.85} for s in skills]
    await db.candidateprofiles.update_one(
        {"userId": u_id},
        {"$set": {"skills": formatted_skills, "updatedAt": datetime.utcnow()}},
        upsert=True
    )

    return {
        "success": True,
        "message": "Skills confirmed successfully",
        "skills": skills,
        "targetRole": target_role or "Software Development Engineer (SDE)"
    }
