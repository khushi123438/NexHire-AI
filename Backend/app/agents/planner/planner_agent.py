from typing import Dict, Any, List, Optional
from app.services.llm_service import call_llm, parse_ai_json
from app.config.role_domains import ROLE_DOMAINS

async def plan_interview(
    candidate_profile: Optional[Dict[str, Any]] = None,
    target_role: str = "Software Development Engineer (SDE)",
    round: str = "ROUND_1_TECHNICAL",
    candidate_weaknesses: List[Dict[str, Any]] = None,
    candidate_id: Any = None
) -> Dict[str, Any]:
    """
    Agent 2: Interview Planner Agent
    Formulates a role-specific interview topic distribution, difficulty strategy, and priority reassessment areas.
    Strictly focuses on conceptual, architectural, practical, and project-based topics (NON-CODING).
    """
    if candidate_weaknesses is None:
        candidate_weaknesses = []

    skills_list = []
    projects_list = []
    if candidate_profile:
        if isinstance(candidate_profile.get("skills"), list):
            for s in candidate_profile["skills"]:
                if isinstance(s, dict) and "name" in s:
                    skills_list.append(s["name"])
                elif isinstance(s, str):
                    skills_list.append(s)

        if isinstance(candidate_profile.get("projects"), list):
            projects_list = [str(p) for p in candidate_profile["projects"] if p]

    # Resolve default domain topics for target role from ROLE_DOMAINS
    default_role_topics = ROLE_DOMAINS.get(
        target_role,
        ROLE_DOMAINS.get("Software Development Engineer (SDE)", [
            "Core Programming & Architecture",
            "Database Systems & Optimization",
            "Concurrency & Scalability",
            "System Design & Reliability"
        ])
    )

    if not skills_list:
        skills_list = default_role_topics[:4]

    weakness_list = [f"{w.get('topic', '')} ({w.get('concept', '')})" for w in candidate_weaknesses if w.get("topic")]

    prompt = f"""
You are the Interview Planner Agent for NexHire AI.
Formulate a personalized, strictly NON-CODING interview plan for a candidate applying for "{target_role}" in round "{round}".

Candidate Profile Skills: {', '.join(skills_list)}
Candidate Resume Projects: {', '.join(projects_list) if projects_list else 'Standard industry projects'}
Identified Weaknesses from Previous Interviews: {', '.join(weakness_list) if weakness_list else 'None recorded'}
Role Domain Areas: {', '.join(default_role_topics)}

Requirements:
- Proactively incorporate previously failed/weak topics for reassessment if present.
- Define a realistic topic distribution across 4 questions for Round 1 (or 3 questions for Round 2 / Round 3).
- Choose initial difficulty level: "beginner", "medium", "advanced", or "hard".
- Outline clear strategy for the interviewer.
- Strictly NON-CODING: Focus on conceptual understanding, system architecture, performance optimization, real-world project debugging, trade-offs, and design decisions.

Return ONLY valid JSON:
{{
  "topics": ["{default_role_topics[0]}", "{default_role_topics[1]}", "{default_role_topics[2]}", "{default_role_topics[3] if len(default_role_topics) > 3 else default_role_topics[0]}"],
  "distribution": {{
    "Technical Fundamentals": 1,
    "Core Domain & Reassessment": 2,
    "Architecture & Trade-offs": 1
  }},
  "initialDifficulty": "medium",
  "strategy": "Evaluate candidate on domain concepts, project architecture, and trade-offs tailored to {target_role}.",
  "priorityFocus": ["{default_role_topics[0]}", "{default_role_topics[1]}"]
}}
"""

    llm_result = await call_llm(
        prompt=prompt,
        agent_name="InterviewPlannerAgent",
        candidate_id=candidate_id,
        temperature=0.3
    )

    if llm_result.get("text"):
        parsed = parse_ai_json(llm_result["text"], None)
        if parsed and isinstance(parsed.get("topics"), list) and len(parsed["topics"]) > 0:
            return {
                "topics": parsed["topics"],
                "distribution": parsed.get("distribution", {}),
                "initialDifficulty": parsed.get("initialDifficulty", "medium"),
                "strategy": parsed.get("strategy", f"Personalized adaptive assessment for {target_role}."),
                "priorityFocus": parsed.get("priorityFocus", [])
            }

    # Fallback defaults by round
    if round == "ROUND_2_MANAGERIAL":
        return {
            "topics": [
                "Teamwork & Cross-functional Collaboration",
                "Handling Production Incidents & Deadlines",
                "Technical Ownership & Architecture Trade-offs",
            ],
            "distribution": {"Behavioral": 1, "Leadership": 1, "IncidentManagement": 1},
            "initialDifficulty": "medium",
            "strategy": f"STAR method behavioral probing on ownership, leadership, and crisis management in {target_role}.",
            "priorityFocus": ["Conflict Resolution", "Production Incident Response"],
        }

    if round == "ROUND_3_HR":
        return {
            "topics": [
                "Career Goals & Role Motivation",
                "Salary Expectations & Workplace Logistics",
                "Culture Fit, Ethics & Candidate Questions",
            ],
            "distribution": {"CultureFit": 1, "Logistics": 1, "Values": 1},
            "initialDifficulty": "beginner",
            "strategy": f"Evaluation of long-term retention, compensation alignment, and workplace culture fit for {target_role}.",
            "priorityFocus": ["Culture Fit", "Career Aspirations"],
        }

    # Technical Round fallback using role domains
    primary_topic = weakness_list[0] if weakness_list else default_role_topics[0]
    secondary_topic = default_role_topics[1] if len(default_role_topics) > 1 else (skills_list[0] if skills_list else "Core Fundamentals")
    tertiary_topic = default_role_topics[2] if len(default_role_topics) > 2 else (skills_list[1] if len(skills_list) > 1 else "Architecture & Scalability")
    quaternary_topic = default_role_topics[3] if len(default_role_topics) > 3 else "System Architecture & Performance Trade-offs"

    return {
        "topics": [primary_topic, secondary_topic, tertiary_topic, quaternary_topic],
        "distribution": {"Fundamentals": 1, "DeepDive": 2, "ArchitectureAndTradeoffs": 1},
        "initialDifficulty": "medium",
        "strategy": f"Re-evaluating previous weakness in {weakness_list[0]} before advancing to {target_role} architecture." if weakness_list else f"Structured progression from core {target_role} fundamentals to practical project architecture and optimization.",
        "priorityFocus": [primary_topic, secondary_topic],
    }
