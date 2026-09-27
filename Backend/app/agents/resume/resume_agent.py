"""
Resume Intelligence Agent for NexHire-AI.
Combines PyPDF text extraction, NLP skill normalization, role matching algorithms,
and LLM profiling with robust offline fallbacks.
"""

from typing import Dict, Any, Optional
from app.nlp.resume_parser import extract_text_from_pdf_bytes, extract_resume_nlp_fallback, extract_skills_nlp
from app.nlp.skill_normalizer import calculate_role_match_scores
from app.services.nlp_service import analyze_candidate_resume as analyze_resume_nlp

async def process_resume_agent(pdf_bytes: bytes, target_role: Optional[str] = None) -> Dict[str, Any]:
    """
    Resume Intelligence Agent Workflow:
    1. Extract PDF raw text
    2. Extract skills using NLP pattern matching & skill normalizer
    3. Run LLM profiling with deterministic NLP fallback
    4. Calculate role match scores across engineering domains
    """
    resume_text = extract_text_from_pdf_bytes(pdf_bytes) if pdf_bytes else ""
    if not resume_text:
        return extract_resume_nlp_fallback("", target_role)

    try:
        parsed_profile = await analyze_resume_nlp(pdf_bytes, target_role)
        return parsed_profile
    except Exception as err:
        print(f"[ResumeAgent] LLM fallback triggered: {err}")
        return extract_resume_nlp_fallback(resume_text, target_role)

__all__ = ["process_resume_agent", "analyze_resume_nlp", "calculate_role_match_scores"]
