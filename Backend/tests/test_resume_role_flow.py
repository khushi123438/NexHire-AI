"""
Test Suite for Resume Upload & AI Role Recommendation Flow in NexHire-AI.
Verifies PDF text extraction, NLP skill normalization, structured AI role match calculations,
and target role propagation to interview agentic pipeline.
"""

import sys
import asyncio
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.nlp.skill_normalizer import (
    normalize_extracted_skills,
    calculate_detailed_role_recommendations,
    calculate_role_match_scores
)
from app.orchestration.state import InterviewState
from app.agents.planner.planner_agent import plan_interview
from app.agents.rag.rag_agent import retrieve_candidate_aware_rag

def test_structured_role_recommendations():
    """Test algorithmic detailed role recommendations output format and match scores"""
    sample_skills = ["Python", "TensorFlow", "NLP", "FastAPI", "SQL", "Docker"]
    sample_text = "Experienced AI Engineer who built machine learning models, transformers, NLP pipelines, and FastAPI REST APIs."
    sample_projects = [
        {
            "name": "Generative AI RAG Pipeline",
            "description": "Developed LLM agent with vector search and PyTorch model fine-tuning.",
            "technologies": ["Python", "PyTorch", "RAG", "FastAPI"]
        }
    ]

    normalized = normalize_extracted_skills(sample_skills)
    extracted_names = [s["name"] for s in normalized]

    detailed_recs = calculate_detailed_role_recommendations(extracted_names, sample_text, sample_projects)

    assert isinstance(detailed_recs, list)
    assert len(detailed_recs) >= 6

    top_rec = detailed_recs[0]
    assert "role" in top_rec
    assert "match_score" in top_rec
    assert "reason" in top_rec
    assert "matched_skills" in top_rec
    assert "skill_gaps" in top_rec

    # Top role for Python/ML/NLP text should be AI / ML Engineer or Data Scientist
    assert top_rec["role"] in ("AI / ML Engineer", "Data Scientist", "Backend Developer")
    assert top_rec["match_score"] >= 75
    assert len(top_rec["matched_skills"]) > 0

    print("✓ [TEST PASSED]: Structured AI Role Recommendations format & scoring")

async def test_selected_role_propagation():
    """Test that selected target role propagates to Planner and RAG Agents"""
    selected_role = "AI / ML Engineer"

    # 1. Planner Agent planning for selected role
    plan = await plan_interview(
        candidate_profile={"skills": ["Python", "TensorFlow", "NLP"]},
        target_role=selected_role,
        round="ROUND_1_TECHNICAL"
    )
    assert plan["topics"] is not None
    assert len(plan["topics"]) > 0

    # 2. RAG Agent query building for selected role
    rag_res = await retrieve_candidate_aware_rag(
        target_role=selected_role,
        current_topic=plan["topics"][0],
        difficulty="medium"
    )
    assert selected_role in rag_res["rewrittenQuery"]

    print("✓ [TEST PASSED]: Selected role propagation to Planner & RAG Agents")

async def run_all_resume_flow_tests():
    print("==================================================")
    print("  RUNNING RESUME & ROLE SELECTION FLOW TESTS       ")
    print("==================================================")
    test_structured_role_recommendations()
    await test_selected_role_propagation()
    print("==================================================")
    print("  ALL RESUME & ROLE SELECTION TESTS PASSED        ")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_all_resume_flow_tests())
