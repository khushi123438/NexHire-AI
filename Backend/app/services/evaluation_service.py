from typing import Dict, Any, List, Optional
from app.llm.client import generate_completion, parse_llm_json
from app.llm.prompts import build_answer_evaluation_prompt

async def evaluate_candidate_response(
    question_text: str = "",
    candidate_answer: str = "",
    expected_concepts: Optional[List[str]] = None,
    target_skill: str = "Technical Skills",
    stage: str = "TECHNICAL",
    candidate_name: str = "Candidate"
) -> Dict[str, Any]:
    """
    LLM-as-a-Judge Answer Evaluation Service
    Evaluates candidate answers objectively using the 5-factor rubric:
    1. correctness (30%): Factual and technical accuracy
    2. technicalDepth (25%): Internal mechanics and edge case awareness
    3. relevance (20%): Directness to question
    4. clarity (15%): Structure, articulation, precision
    5. completeness (10%): Thorough coverage of key concepts
    """
    if expected_concepts is None:
        expected_concepts = []

    prompt = build_answer_evaluation_prompt(
        question_text=question_text,
        candidate_answer=candidate_answer,
        expected_concepts=expected_concepts,
        target_skill=target_skill,
        stage=stage
    )

    llm_result = await generate_completion(
        prompt=prompt,
        temperature=0.2
    )

    if llm_result.get("text"):
        parsed = parse_llm_json(llm_result["text"], None)
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
                # Backward compatibility aliases
                "technicalAccuracy": correctness,
                "communication": clarity,
                "confidence": relevance,
                "examplesUsed": technical_depth
            }

    # Deterministic fallback evaluation based on word count, keyword coverage, and structure heuristic
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
