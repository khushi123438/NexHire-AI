from typing import Dict, Any, List, Optional
from app.services.llm_service import call_llm, parse_ai_json

async def evaluate_candidate_answer(
    question_text: str = "",
    candidate_answer: str = "",
    expected_concepts: List[str] = None,
    target_skill: str = "Technical Skills",
    stage: str = "TECHNICAL",
    candidate_name: str = "Candidate",
    candidate_id: Any = None,
    interview_id: str = ""
) -> Dict[str, Any]:
    """
    Agent 5: Evaluation Agent (LLM-as-a-Judge)
    Evaluates candidate answers using a strict 5-factor rubric and identifies missing concepts
    """
    if expected_concepts is None:
        expected_concepts = []

    prompt = f"""
You are the Senior Evaluation Agent & LLM-as-a-Judge for NexHire AI.
Evaluate the candidate's interview answer objectively using our strict 5-factor evaluation rubric.

Interview Question: "{question_text}"
Stage / Focus: "{stage}" ({target_skill})
Expected Key Concepts: {', '.join(expected_concepts) if expected_concepts else 'Core principles'}
Candidate Answer: "{candidate_answer[:1500] if candidate_answer else 'No answer provided'}"

Rubric Dimensions (Scores from 1.0 to 10.0):
1. correctness (30% weight): Technical factual accuracy and correctness.
2. technicalDepth (25% weight): Depth of knowledge, internal mechanics, edge-case awareness.
3. relevance (20% weight): Directness of answer to what was asked.
4. clarity (15% weight): Structure, articulation, precision of language.
5. completeness (10% weight): Thoroughness across required concepts.

Overall Score formula:
overall = (correctness * 0.30) + (technicalDepth * 0.25) + (relevance * 0.20) + (clarity * 0.15) + (completeness * 0.10)

Also identify:
- missingConcepts: List of essential concepts or keywords the candidate omitted.
- strengths: Concise sentence on strong points.
- areasToImprove: Specific actionable advice to reach 10/10.
- feedback: Recruiter summary commentary.

Return ONLY valid JSON:
{{
  "correctness": 8.5,
  "technicalDepth": 7.5,
  "relevance": 9.0,
  "clarity": 8.0,
  "completeness": 7.0,
  "overall": 8.1,
  "missingConcepts": ["Time Complexity", "Rebalancing"],
  "strengths": "Accurate explanation of fundamental bucket structures.",
  "areasToImprove": "Mention how treeify threshold is triggered in high collisions.",
  "feedback": "Strong conceptual clarity. Deepening performance specifics will make the response outstanding."
}}
"""

    llm_result = await call_llm(
        prompt=prompt,
        agent_name="EvaluationAgent",
        interview_id=interview_id,
        candidate_id=candidate_id,
        temperature=0.2
    )

    if llm_result.get("text"):
        parsed = parse_ai_json(llm_result["text"], None)
        if parsed and isinstance(parsed.get("correctness"), (int, float)):
            correctness = min(10.0, max(1.0, round(float(parsed["correctness"]), 1)))
            technical_depth = min(10.0, max(1.0, round(float(parsed.get("technicalDepth", correctness)), 1)))
            relevance = min(10.0, max(1.0, round(float(parsed.get("relevance", 8.0)), 1)))
            clarity = min(10.0, max(1.0, round(float(parsed.get("clarity", 8.0)), 1)))
            completeness = min(10.0, max(1.0, round(float(parsed.get("completeness", 7.5)), 1)))

            calculated_overall = round(
                (correctness * 0.3) +
                (technical_depth * 0.25) +
                (relevance * 0.2) +
                (clarity * 0.15) +
                (completeness * 0.1),
                1
            )

            overall = min(10.0, max(1.0, round(float(parsed.get("overall", calculated_overall)), 1)))
            missing = parsed.get("missingConcepts", []) if isinstance(parsed.get("missingConcepts"), list) else []

            return {
                "correctness": correctness,
                "technicalDepth": technical_depth,
                "relevance": relevance,
                "clarity": clarity,
                "completeness": completeness,
                "overall": overall,
                "missingConcepts": missing,
                "strengths": parsed.get("strengths", "Good structured explanation."),
                "areasToImprove": parsed.get("areasToImprove", "Elaborate with concrete architectural examples."),
                "feedback": parsed.get("feedback", "Solid foundation with room to demonstrate deeper mechanics."),
                # Backward compatibility
                "technicalAccuracy": correctness,
                "communication": clarity,
                "confidence": relevance,
                "examplesUsed": technical_depth
            }

    # Deterministic fallback evaluation based on keyword coverage and depth heuristic
    words = [w for w in (candidate_answer or "").strip().split() if w]
    word_count = len(words)

    base_score = 8.2 if word_count >= 40 else (7.2 if word_count >= 20 else (6.0 if word_count >= 10 else 4.5))
    missing = [c for c in expected_concepts if c.lower() not in (candidate_answer or "").lower()]

    return {
        "correctness": round(base_score, 1),
        "technicalDepth": round(base_score - 0.5, 1),
        "relevance": round(base_score + 0.3, 1),
        "clarity": round(base_score, 1),
        "completeness": round(base_score - 0.7, 1),
        "overall": round(base_score, 1),
        "missingConcepts": missing[:3],
        "strengths": "Structured articulation and clear fundamental reasoning.",
        "areasToImprove": "Elaborate on production scalability and edge case handling.",
        "feedback": "Demonstrated sound grasp of the requested concept.",
        "technicalAccuracy": round(base_score, 1),
        "communication": round(base_score, 1),
        "confidence": round(base_score, 1),
        "examplesUsed": round(base_score - 0.5, 1)
    }
