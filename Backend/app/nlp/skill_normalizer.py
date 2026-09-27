import re
from typing import Dict, List, Any

# Expanded Keyword and Concept Profiles per role for accurate algorithmic recommendation
ROLE_KEYWORD_PROFILE: Dict[str, List[str]] = {
    "AI / ML Engineer": [
        "python", "machine learning", "deep learning", "tensorflow", "pytorch", "nlp", "natural language processing",
        "computer vision", "generative ai", "llm", "rag", "transformers", "embeddings", "scikit-learn", "numpy", "pandas",
        "model deployment", "mlops", "neural networks", "feature engineering"
    ],
    "Data Scientist": [
        "python", "pandas", "numpy", "scikit-learn", "sql", "statistics", "data analysis", "data visualization",
        "machine learning", "random forest", "xgboost", "exploratory data analysis", "eda", "r", "tableau",
        "power bi", "hypothesis testing", "data mining"
    ],
    "Software Development Engineer (SDE)": [
        "dsa", "data structures", "algorithms", "c++", "java", "python", "oop", "object oriented",
        "dbms", "sql", "operating systems", "os", "computer networks", "networking", "system design",
        "concurrency", "multithreading", "git", "clean code", "design patterns"
    ],
    "Frontend Developer": [
        "javascript", "typescript", "react", "next.js", "vue.js", "html", "css", "tailwind css",
        "redux", "web performance", "accessibility", "a11y", "responsive design", "graphql", "dom",
        "webpack", "vite", "ui/ux", "browser rendering", "core web vitals"
    ],
    "Backend Developer": [
        "node.js", "express.js", "fastapi", "django", "flask", "python", "java", "spring boot", "golang",
        "rest apis", "restful", "mongodb", "postgresql", "mysql", "redis", "caching", "docker",
        "authentication", "jwt", "oauth", "system design", "microservices", "message queues", "kafka", "rabbitmq"
    ],
    "Full Stack Developer": [
        "react", "javascript", "typescript", "node.js", "express.js", "fastapi", "mongodb", "sql",
        "postgresql", "rest apis", "html", "css", "next.js", "mern stack", "mean stack", "full stack",
        "git", "system design", "authentication", "docker", "web sockets", "client-server"
    ],
    "DevOps / Cloud Engineer": [
        "docker", "kubernetes", "k8s", "linux", "bash", "aws", "azure", "gcp", "google cloud", "ci/cd",
        "jenkins", "github actions", "terraform", "ansible", "monitoring", "prometheus", "grafana",
        "networking", "dns", "load balancer", "git", "infrastructure as code", "cloud"
    ],
}

def calculate_role_match_scores(extracted_skills: List[str], text: str = "", projects: List[Any] = None) -> Dict[str, float]:
    """
    NLP calculation of match percentage across supported roles.
    Uses skill matching, n-gram lexical overlap, and project domain analysis.
    """
    detailed = calculate_detailed_role_recommendations(extracted_skills, text, projects)
    scores = {rec["role"]: float(rec["match_score"]) for rec in detailed}
    return dict(sorted(scores.items(), key=lambda x: x[1], reverse=True))

def calculate_detailed_role_recommendations(extracted_skills: List[str], text: str = "", projects: List[Any] = None) -> List[Dict[str, Any]]:
    """
    Algorithmic calculation of detailed role match objects based on actual resume profile.
    Returns:
    [
        {
            "role": "AI / ML Engineer",
            "match_score": 91,
            "reason": "...",
            "matched_skills": ["Python", "Machine Learning", "NLP"],
            "skill_gaps": ["MLOps", "Model Deployment"]
        }
    ]
    """
    text_lower = (text or "").lower()
    skill_set = set(s.lower() for s in extracted_skills)

    project_text = ""
    if projects:
        for p in projects:
            if isinstance(p, dict):
                project_text += " " + p.get("name", "") + " " + p.get("description", "") + " " + " ".join(p.get("technologies", []))
            elif isinstance(p, str):
                project_text += " " + p
    full_context = f"{text_lower} {project_text.lower()}"

    recommendations = []

    for role, keywords in ROLE_KEYWORD_PROFILE.items():
        matched_kw = []
        missing_kw = []

        for kw in keywords:
            if kw in skill_set or re.search(r'\b' + re.escape(kw) + r'\b', full_context):
                matched_kw.append(kw)
            else:
                missing_kw.append(kw)

        match_ratio = len(matched_kw) / len(keywords)
        # Calculate realistic, non-random match score based on keyword coverage
        if match_ratio > 0:
            match_score = int(round(min(96, max(45, match_ratio * 100 + 25))))
        else:
            match_score = 35

        # Format skill names nicely
        matched_skills_formatted = [kw.title() if len(kw) > 3 else kw.upper() for kw in matched_kw[:6]]
        if not matched_skills_formatted:
            matched_skills_formatted = [s for s in extracted_skills[:3]]

        skill_gaps_formatted = [kw.title() if len(kw) > 3 else kw.upper() for kw in missing_kw[:4]]

        if match_score >= 80:
            reason = f"Strong alignment with {len(matched_kw)} key technical requirements including {', '.join(matched_skills_formatted[:3])}."
        elif match_score >= 60:
            reason = f"Moderate fit demonstrating core concepts in {', '.join(matched_skills_formatted[:2])}."
        else:
            reason = f"Foundational match with potential development opportunities in {', '.join(skill_gaps_formatted[:2])}."

        recommendations.append({
            "role": role,
            "match_score": match_score,
            "reason": reason,
            "matched_skills": matched_skills_formatted,
            "skill_gaps": skill_gaps_formatted
        })

    # Sort descending by match_score
    recommendations.sort(key=lambda x: x["match_score"], reverse=True)
    return recommendations

def normalize_extracted_skills(raw_skills: List[Any]) -> List[Dict[str, Any]]:
    """
    Normalizes a list of extracted skills into canonical format with deduplication.
    """
    from app.config.role_domains import normalize_skill_name
    normalized_skills = []
    seen = set()

    for s in raw_skills:
        if isinstance(s, dict) and "name" in s:
            canonical = normalize_skill_name(s["name"])
            if canonical and canonical.lower() not in seen:
                seen.add(canonical.lower())
                normalized_skills.append({
                    "name": canonical,
                    "level": s.get("level", "intermediate"),
                    "confidence": float(s.get("confidence", 0.85)),
                    "yearsOfExperience": float(s.get("yearsOfExperience", 1.0))
                })
        elif isinstance(s, str) and s.strip():
            canonical = normalize_skill_name(s.strip())
            if canonical and canonical.lower() not in seen:
                seen.add(canonical.lower())
                normalized_skills.append({
                    "name": canonical,
                    "level": "intermediate",
                    "confidence": 0.85,
                    "yearsOfExperience": 1.0
                })

    return normalized_skills
