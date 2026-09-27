import re
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.config.db import get_db
from app.utils.helpers import to_object_id
from app.nlp.skill_normalizer import (
    normalize_extracted_skills,
    calculate_role_match_scores,
    calculate_detailed_role_recommendations
)
from app.nlp.resume_parser import extract_resume_nlp_fallback
from app.llm.client import generate_completion, parse_llm_json
from app.llm.prompts import build_resume_analysis_prompt

async def analyze_candidate_resume(
    resume_text: str = "",
    user_id: Any = None,
    target_role: Optional[str] = None
) -> Dict[str, Any]:
    """
    NLP Resume Analysis Service
    Extracts candidate skills, technologies, projects, experience, and calculates multi-role fit recommendations.
    Uses hybrid NLP + LLM structured extraction with heuristic fallback.
    """
    structured_profile = None

    if resume_text and len(resume_text.strip()) > 20:
        prompt = build_resume_analysis_prompt(resume_text, target_role or "")
        llm_result = await generate_completion(
            prompt=prompt,
            temperature=0.2
        )

        if llm_result.get("text"):
            parsed = parse_llm_json(llm_result["text"], None)
            if parsed and isinstance(parsed.get("skills"), list) and len(parsed["skills"]) > 0:
                structured_profile = parsed

    # NLP Fallback extraction if LLM is unavailable
    if not structured_profile:
        structured_profile = extract_resume_nlp_fallback(resume_text, target_role)

    # Clean & normalize extracted skills
    normalized_skills = normalize_extracted_skills(structured_profile.get("skills", []))
    structured_profile["skills"] = normalized_skills
    raw_skill_names = [s["name"] for s in normalized_skills]

    # Clean & normalize projects
    cleaned_projects = []
    project_summary_strings = []
    for proj in structured_profile.get("projects", []):
        if isinstance(proj, dict):
            raw_techs = proj.get("technologies", [])
            norm_techs = [t for t in raw_techs if t]
            cleaned_proj = {
                "name": proj.get("name", "Project"),
                "technologies": norm_techs,
                "description": proj.get("description", ""),
                "impact": proj.get("impact", "")
            }
            cleaned_projects.append(cleaned_proj)
            tech_str = f" ({', '.join(norm_techs)})" if norm_techs else ""
            project_summary_strings.append(f"{cleaned_proj['name']}{tech_str}: {cleaned_proj['description']}")
        elif isinstance(proj, str) and proj.strip():
            cleaned_projects.append({
                "name": proj.strip(),
                "technologies": [],
                "description": proj.strip(),
                "impact": ""
            })
            project_summary_strings.append(proj.strip())

    structured_profile["projects"] = cleaned_projects
    structured_profile["projectSummaries"] = project_summary_strings

    # Calculate detailed recommendations and legacy role map
    detailed_recs = calculate_detailed_role_recommendations(raw_skill_names, resume_text, cleaned_projects)
    role_recs = {rec["role"]: float(rec["match_score"]) for rec in detailed_recs}

    structured_profile["recommendations"] = detailed_recs
    structured_profile["roleRecommendations"] = role_recs

    top_roles = [rec["role"] for rec in detailed_recs if rec["match_score"] >= 60]
    if not top_roles:
        top_roles = [rec["role"] for rec in detailed_recs[:2]]
    structured_profile["targetRoles"] = top_roles

    # Persist CandidateProfile if user_id is provided
    if user_id:
        try:
            db = get_db()
            u_id = to_object_id(user_id)
            profile_data = {
                "userId": u_id,
                "targetRole": target_role,
                "targetRoles": top_roles,
                "recommendations": detailed_recs,
                "roleRecommendations": role_recs,
                "skills": structured_profile.get("skills", []),
                "projects": structured_profile.get("projects", []),
                "certifications": structured_profile.get("certifications", []),
                "experienceSummary": structured_profile.get("experienceSummary", ""),
                "educationSummary": structured_profile.get("educationSummary", ""),
                "weakAreas": structured_profile.get("weakAreas", []),
                "strongAreas": structured_profile.get("strongAreas", []),
                "overallReadinessScore": float(structured_profile.get("overallReadinessScore", 75)),
                "rawResumeText": resume_text[:4000],
                "updatedAt": datetime.utcnow()
            }
            await db.candidateprofiles.update_one(
                {"userId": u_id},
                {"$set": profile_data, "$setOnInsert": {"createdAt": datetime.utcnow()}},
                upsert=True
            )
        except Exception as save_err:
            print(f"[NLP Service] CandidateProfile save note: {save_err}")

    return structured_profile
