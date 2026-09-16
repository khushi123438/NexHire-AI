import re
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.config.db import get_db
from app.utils.helpers import to_object_id
from app.services.llm_service import call_llm, parse_ai_json
from app.config.role_domains import SUPPORTED_ROLES, ROLE_DOMAINS, normalize_skill_name

# Skill sets per role for algorithmic fit score calculation
ROLE_KEYWORD_PROFILE = {
    "Software Development Engineer (SDE)": [
        "dsa", "data structures", "algorithms", "c++", "java", "python", "oop", "dbms", "sql", "operating systems", "computer networks", "system design", "git"
    ],
    "Frontend Developer": [
        "javascript", "typescript", "react", "html5", "css3", "tailwind css", "next.js", "vue.js", "redux", "web performance", "accessibility", "responsive design", "graphql"
    ],
    "Backend Developer": [
        "node.js", "express.js", "fastapi", "django", "python", "java", "spring boot", "rest apis", "mongodb", "postgresql", "mysql", "redis", "docker", "authentication", "system design"
    ],
    "Full Stack Developer": [
        "react", "javascript", "node.js", "express.js", "mongodb", "sql", "postgresql", "rest apis", "html5", "css3", "next.js", "typescript", "full stack", "git", "system design"
    ],
    "Data Scientist / AI Engineer": [
        "python", "pandas", "numpy", "scikit-learn", "machine learning", "deep learning", "tensorflow", "pytorch", "nlp", "computer vision", "generative ai", "llms", "sql", "statistics", "data science"
    ],
    "DevOps / Cloud Engineer": [
        "docker", "kubernetes", "linux", "aws", "azure", "gcp", "ci/cd", "jenkins", "github actions", "terraform", "ansible", "monitoring", "networking", "git", "bash"
    ],
}

def calculate_role_recommendations(extracted_skills: List[str], text: str = "") -> Dict[str, float]:
    """Calculate percentage fit match score across all 6 supported roles"""
    text_lower = (text or "").lower()
    skill_set = set(s.lower() for s in extracted_skills)

    scores = {}
    for role, keywords in ROLE_KEYWORD_PROFILE.items():
        matched_count = 0
        for kw in keywords:
            if kw in skill_set or re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                matched_count += 1
        
        # Calculate percentage match (scaled between 35% and 95%)
        ratio = matched_count / len(keywords)
        percentage = round(min(96.0, max(30.0, ratio * 100 + (15 if ratio > 0.2 else 0))), 1)
        scores[role] = percentage

    # Sort descending
    return dict(sorted(scores.items(), key=lambda x: x[1], reverse=True))

async def analyze_resume(
    resume_text: str = "",
    user_id: Any = None,
    target_role: Optional[str] = None
) -> Dict[str, Any]:
    """
    Agent 1: Resume Intelligence Agent
    Analyzes resume text using hybrid NLP + LLM structured extraction, normalization, and multi-role recommendation
    """
    selected_role_prompt = f'Target Role context: "{target_role}"' if target_role else "Target Role: General Software & AI Engineering"

    prompt = f"""
You are the expert Resume Intelligence Agent for NexHire AI.
Analyze the following candidate resume text.
{selected_role_prompt}

Extract:
1. "skills": List of objects with "name" (normalized canonical technology name), "level" ("beginner"|"intermediate"|"advanced"|"expert" inferred from project depth and context), "confidence" (0.7 to 0.98), "yearsOfExperience".
2. "projects": List of objects with "name", "technologies" (list of strings), "description" (concise summary of what was built), "impact" (quantifiable metric or architecture highlight).
3. "certifications": List of certification titles or courses mentioned.
4. "experienceSummary": Summary of candidate's professional / project tenure and roles.
5. "educationSummary": Degree, institution, and major.
6. "weakAreas": Potential unmentioned or shallow technical areas relative to their skills.
7. "strongAreas": Core strengths demonstrated with evidence.
8. "overallReadinessScore": Estimated technical readiness (0 to 100).

Resume Content:
{resume_text[:6500]}

Return ONLY valid JSON in this exact structure:
{{
  "skills": [
    {{ "name": "Python", "level": "advanced", "confidence": 0.92, "yearsOfExperience": 2 }},
    {{ "name": "Scikit-learn", "level": "intermediate", "confidence": 0.85, "yearsOfExperience": 1 }},
    {{ "name": "React", "level": "intermediate", "confidence": 0.80, "yearsOfExperience": 1 }}
  ],
  "projects": [
    {{
      "name": "Disease Prediction System",
      "technologies": ["Python", "Scikit-learn", "Pandas", "Random Forest"],
      "description": "Trained predictive models with feature preprocessing and ROC-AUC evaluation.",
      "impact": "Achieved 91% classification accuracy on unseen test clinical records."
    }}
  ],
  "certifications": ["AWS Certified Cloud Practitioner", "DeepLearning.AI Specialization"],
  "experienceSummary": "1+ years experience in software engineering and data applications",
  "educationSummary": "B.Tech in Computer Science & Engineering",
  "weakAreas": ["System Design", "Distributed Caching"],
  "strongAreas": ["Python", "Machine Learning", "Data Preprocessing"],
  "overallReadinessScore": 82
}}
"""

    structured_profile = None
    llm_result = await call_llm(
        prompt=prompt,
        agent_name="ResumeIntelligenceAgent",
        candidate_id=user_id,
        temperature=0.2
    )

    if llm_result.get("text"):
        parsed = parse_ai_json(llm_result["text"], None)
        if parsed and isinstance(parsed.get("skills"), list) and len(parsed["skills"]) > 0:
            structured_profile = parsed

    # Fallback heuristic extraction if LLM output is malformed
    if not structured_profile:
        common_tech_patterns = [
            ("Python", r'\b(python|py)\b', "advanced", 0.88),
            ("JavaScript", r'\b(javascript|js|es6)\b', "intermediate", 0.85),
            ("TypeScript", r'\b(typescript|ts)\b', "intermediate", 0.8),
            ("React", r'\b(react|react\.js|reactjs)\b', "intermediate", 0.82),
            ("Node.js", r'\b(node|node\.js|nodejs)\b', "intermediate", 0.78),
            ("Express.js", r'\b(express|express\.js|expressjs)\b', "intermediate", 0.75),
            ("FastAPI", r'\b(fastapi)\b', "intermediate", 0.78),
            ("MongoDB", r'\b(mongo|mongodb)\b', "intermediate", 0.78),
            ("SQL", r'\b(sql|mysql|postgresql|postgres)\b', "intermediate", 0.75),
            ("Pandas", r'\b(pandas)\b', "intermediate", 0.8),
            ("NumPy", r'\b(numpy)\b', "intermediate", 0.8),
            ("Scikit-learn", r'\b(scikit-learn|sklearn)\b', "intermediate", 0.78),
            ("TensorFlow", r'\b(tensorflow|tf|keras)\b', "beginner", 0.7),
            ("PyTorch", r'\b(pytorch|torch)\b', "beginner", 0.7),
            ("Docker", r'\b(docker|containers)\b', "intermediate", 0.75),
            ("Kubernetes", r'\b(kubernetes|k8s)\b', "beginner", 0.65),
            ("AWS", r'\b(aws|amazon web services|ec2|s3)\b', "intermediate", 0.72),
            ("CI/CD", r'\b(ci/cd|cicd|jenkins|github actions)\b', "intermediate", 0.7),
            ("DSA", r'\b(dsa|data structures|algorithms)\b', "intermediate", 0.75),
            ("DBMS", r'\b(dbms|database)\b', "intermediate", 0.75),
            ("Linux", r'\b(linux|ubuntu|bash)\b', "intermediate", 0.75),
            ("Git", r'\b(git|github)\b', "advanced", 0.85),
        ]

        found_skills = []
        text_lower = (resume_text or "").lower()

        for name, pattern, level, conf in common_tech_patterns:
            if re.search(pattern, text_lower, re.I):
                found_skills.append({
                    "name": normalize_skill_name(name),
                    "level": level,
                    "confidence": conf,
                    "yearsOfExperience": 1
                })

        if not found_skills:
            found_skills = [
                {"name": "Python", "level": "intermediate", "confidence": 0.8, "yearsOfExperience": 1},
                {"name": "JavaScript", "level": "intermediate", "confidence": 0.8, "yearsOfExperience": 1},
                {"name": "SQL", "level": "intermediate", "confidence": 0.75, "yearsOfExperience": 1},
            ]

        # Extract projects heuristically if present
        projects = []
        if "project" in text_lower:
            projects.append({
                "name": "Technical Application Project",
                "technologies": [s["name"] for s in found_skills[:4]],
                "description": "Developed software project with clean architecture and tested workflows.",
                "impact": "Engineered responsive interface and reliable backend processing.",
            })

        structured_profile = {
            "skills": found_skills,
            "projects": projects,
            "certifications": [],
            "experienceSummary": "Demonstrated technical skills across software and engineering projects",
            "educationSummary": "Bachelor's Degree in Computer Science or Technical Field",
            "weakAreas": ["System Design Scalability", "Distributed Concurrency"],
            "strongAreas": [s["name"] for s in found_skills[:3]],
            "overallReadinessScore": 75,
        }

    # Normalize skill names
    normalized_skills = []
    seen_names = set()
    for s in structured_profile.get("skills", []):
        if isinstance(s, dict) and "name" in s:
            norm_name = normalize_skill_name(s["name"])
            if norm_name.lower() not in seen_names:
                seen_names.add(norm_name.lower())
                normalized_skills.append({
                    "name": norm_name,
                    "level": s.get("level", "intermediate"),
                    "confidence": float(s.get("confidence", 0.8)),
                    "yearsOfExperience": float(s.get("yearsOfExperience", 1)),
                })
        elif isinstance(s, str):
            norm_name = normalize_skill_name(s)
            if norm_name.lower() not in seen_names:
                seen_names.add(norm_name.lower())
                normalized_skills.append({
                    "name": norm_name,
                    "level": "intermediate",
                    "confidence": 0.8,
                    "yearsOfExperience": 1,
                })

    structured_profile["skills"] = normalized_skills
    raw_skill_names = [s["name"] for s in normalized_skills]

    # Calculate Role Recommendations across all 6 roles
    role_recs = calculate_role_recommendations(raw_skill_names, resume_text)
    structured_profile["roleRecommendations"] = role_recs

    # Determine recommended target roles
    top_roles = [r for r, score in role_recs.items() if score >= 60.0]
    if not top_roles:
        top_roles = list(role_recs.keys())[:2]
    structured_profile["targetRoles"] = top_roles

    # Persist CandidateProfile if user_id provided
    if user_id:
        try:
            db = get_db()
            u_id = to_object_id(user_id)
            profile_data = {
                "userId": u_id,
                "targetRole": target_role,
                "targetRoles": top_roles,
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
            print(f"[ResumeAgent] CandidateProfile save note: {save_err}")

    return structured_profile
