"""
Candidate-Aware RAG Agent for NexHire-AI.
Constructs targeted context queries combining role domain, current topic,
candidate memory weaknesses, previous score, and missing concepts.
"""

from typing import Dict, Any, List, Optional
from app.rag.retrieval.retrieval_service import retrieve_knowledge
from app.services.memory_service import query_relevant_memory

async def retrieve_candidate_aware_rag(
    target_role: str = "Software Development Engineer (SDE)",
    current_topic: str = "Core Engineering",
    difficulty: str = "medium",
    candidate_id: Optional[Any] = None,
    previous_score: Optional[float] = None,
    missing_concepts: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    RAG Agent: Generates candidate-aware retrieval queries and fetches grounded knowledge chunks.
    Considers candidate score, historical weaknesses, missing concepts, and target role.
    """
    if missing_concepts is None:
        missing_concepts = []

    # 1. Build query terms
    query_parts = [current_topic]

    if missing_concepts:
        query_parts.append(" ".join(missing_concepts[:2]))

    # 2. Retrieve historical memory for candidate if candidate_id provided
    memory_context_str = ""
    if candidate_id:
        memories = await query_relevant_memory(candidate_id, query_text=current_topic, topic=current_topic, limit=2)
        if memories:
            concepts = [m.get("concept", "") for m in memories if m.get("concept")]
            if concepts:
                memory_context_str = f" Historical weakness: {', '.join(concepts)}"
                query_parts.extend(concepts[:2])

    augmented_query = " ".join(query_parts)

    # 3. Perform hybrid semantic vector search + reranking
    rag_result = await retrieve_knowledge(
        query=augmented_query,
        domain=target_role,
        topic=current_topic,
        difficulty=difficulty,
        topK=2
    )

    context_snippet = rag_result.get("contextSnippet", "")
    if memory_context_str:
        context_snippet = f"[Candidate Memory Context:{memory_context_str}]\n\n" + context_snippet

    return {
        "rewrittenQuery": rag_result.get("rewrittenQuery", augmented_query),
        "results": rag_result.get("results", []),
        "contextSnippet": context_snippet
    }
