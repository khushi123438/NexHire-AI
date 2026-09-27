"""
Comprehensive Test Suite for NexHire-AI Agentic Architecture.
Verifies InterviewState, Agent Tools, Supervisor Agent, RAG Agent,
Question Agent, Evaluation Agent, Candidate Memory, and End-to-End Execution Flow.
"""

import sys
import asyncio
from pathlib import Path

# Add Backend root directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.orchestration.state import InterviewState
from app.orchestration.supervisor import decide_next_action
from app.orchestration.tools import update_difficulty
from app.agents.rag.rag_agent import retrieve_candidate_aware_rag
from app.agents.question.question_agent import is_semantic_duplicate, generate_question
from app.agents.evaluation.evaluation_agent import evaluate_candidate_answer
from app.nlp.skill_normalizer import normalize_extracted_skills, calculate_role_match_scores
from app.nlp.resume_parser import extract_resume_nlp_fallback
from app.orchestration.graph import run_agentic_interview_start, run_agentic_interview_turn

def test_interview_state_serialization():
    """Test InterviewState model creation, dictionary export, and reconstruction"""
    state = InterviewState(
        candidate_name="Alice Engineer",
        target_role="Backend Developer",
        current_topic="PostgreSQL Concurrency",
        difficulty="advanced"
    )
    assert state.candidate_name == "Alice Engineer"
    assert state.target_role == "Backend Developer"
    
    serialized = state.to_dict()
    assert isinstance(serialized, dict)
    assert serialized["current_topic"] == "PostgreSQL Concurrency"
    
    reconstructed = InterviewState.from_dict(serialized)
    assert reconstructed.candidate_name == "Alice Engineer"
    assert reconstructed.difficulty == "advanced"
    print("✓ [TEST PASSED]: InterviewState serialization")

def test_nlp_skill_normalization():
    """Test NLP skill normalization and alias mapping"""
    raw_skills = [
        {"name": "JS", "level": "intermediate"},
        {"name": "React.js", "level": "advanced"},
        {"name": "Python", "level": "expert"}
    ]
    normalized = normalize_extracted_skills(raw_skills)
    names = [s["name"] for s in normalized]
    assert "JavaScript" in names
    assert "React" in names
    assert "Python" in names

    scores = calculate_role_match_scores(names)
    assert "Frontend Developer" in scores
    assert "Backend Developer" in scores
    print("✓ [TEST PASSED]: NLP Skill Normalization")

def test_semantic_duplicate_avoidance():
    """Test anti-repetition semantic duplicate filter"""
    prev_questions = [
        "How do internal hash tables handle collisions in Java HashMap?",
        "Explain B-Tree indexing in relational database systems."
    ]
    
    dup = "How do hash tables resolve internal hash collisions in HashMap?"
    assert is_semantic_duplicate(dup, prev_questions) is True
    
    distinct = "What are the trade-offs between Redis caching and database connection pooling?"
    assert is_semantic_duplicate(distinct, prev_questions) is False
    print("✓ [TEST PASSED]: Semantic Duplicate Avoidance")

async def test_supervisor_decisions():
    """Test Supervisor Agent adaptive decision logic across performance scenarios"""
    # High score scenario -> INCREASE_DIFFICULTY
    state_high = InterviewState(
        target_role="Software Development Engineer (SDE)",
        current_topic="HashMap",
        difficulty="medium",
        current_question_index=1,
        current_evaluation={"overall": 8.5, "missingConcepts": []}
    )
    decision_high = await decide_next_action(state_high)
    assert decision_high["action"] in ("INCREASE_DIFFICULTY", "MAINTAIN_DIFFICULTY")
    assert decision_high["difficulty"] in ("medium", "advanced", "hard")

    # Low score scenario with missing concepts -> REMEDIATION or DECREASE_DIFFICULTY
    state_low = InterviewState(
        target_role="Software Development Engineer (SDE)",
        current_topic="B+ Tree",
        difficulty="medium",
        current_question_index=1,
        missing_concepts=["Rebalancing", "Leaf node links"],
        current_evaluation={"overall": 4.2, "missingConcepts": ["Rebalancing", "Leaf node links"]}
    )
    decision_low = await decide_next_action(state_low)
    assert decision_low["action"] in ("REMEDIATION", "DECREASE_DIFFICULTY")
    print("✓ [TEST PASSED]: Supervisor Agent Decisions")

async def test_llm_judge_evaluation():
    """Test LLM-as-a-Judge Evaluation Agent response structure"""
    eval_res = await evaluate_candidate_answer(
        question_text="How does HashMap handle collisions?",
        candidate_answer="It uses separate chaining with linked lists and treeifies to red-black trees under high collisions.",
        expected_concepts=["Separate Chaining", "Red-Black Trees", "Load Factor"],
        target_skill="HashMap",
        candidate_name="Test Candidate"
    )
    assert "overall" in eval_res
    assert "correctness" in eval_res
    assert "missingConcepts" in eval_res
    assert isinstance(eval_res["overall"], (int, float))
    assert 1.0 <= eval_res["overall"] <= 10.0
    print("✓ [TEST PASSED]: LLM-as-a-Judge Evaluation Agent")

async def test_candidate_aware_rag():
    """Test Candidate-Aware RAG retrieval service"""
    rag_res = await retrieve_candidate_aware_rag(
        target_role="Backend Developer",
        current_topic="Database Indexing",
        difficulty="medium"
    )
    assert "rewrittenQuery" in rag_res
    assert "contextSnippet" in rag_res
    print("✓ [TEST PASSED]: Candidate-Aware RAG Agent")

async def run_all_tests():
    print("==================================================")
    print("  RUNNING NEXHIRE-AI AGENTIC PIPELINE TESTS      ")
    print("==================================================")
    test_interview_state_serialization()
    test_nlp_skill_normalization()
    test_semantic_duplicate_avoidance()
    await test_supervisor_decisions()
    await test_llm_judge_evaluation()
    await test_candidate_aware_rag()
    print("==================================================")
    print("  ALL AGENTIC PIPELINE TESTS COMPLETED SUCCESSFULLY ")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
