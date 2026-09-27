import re
from typing import Dict, Any, List, Optional
from app.config.db import get_db
from app.rag.retrieval.retrieval_service import retrieve_knowledge, rewrite_query
from app.rag.ingestion.ingestion_service import seed_knowledge_base, ingest_document
from app.services.embedding_service import get_embedding, calculate_cosine_similarity
from app.utils.helpers import serialize_doc

async def get_rag_context(
    query: str = "",
    domain: str = "",
    topic: str = "",
    difficulty: str = "",
    top_k: int = 2
) -> Dict[str, Any]:
    """
    RAG Retrieval Service: Retrieve grounded technical concepts and rubrics.
    """
    return await retrieve_knowledge(
        query=query,
        domain=domain,
        topic=topic,
        difficulty=difficulty,
        topK=top_k
    )

async def search_knowledge_base(
    query: str,
    domain: Optional[str] = "General",
    topic: Optional[str] = "",
    difficulty: Optional[str] = "",
    top_k: int = 3
) -> Dict[str, Any]:
    """Search knowledge base with similarity scoring"""
    return await retrieve_knowledge(
        query=query,
        domain=domain or "General",
        topic=topic or "",
        difficulty=difficulty or "",
        topK=top_k
    )

async def add_knowledge_document(
    text: str,
    domain: str = "General",
    topic: str = "General",
    subtopic: str = "",
    difficulty: str = "medium",
    content_type: str = "concept",
    source: str = "Custom Ingestion",
    tags: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Ingest custom technical knowledge document"""
    return await ingest_document(
        text=text,
        domain=domain,
        topic=topic,
        subtopic=subtopic,
        difficulty=difficulty,
        contentType=content_type,
        source=source,
        tags=tags or []
    )

async def get_rag_statistics() -> Dict[str, Any]:
    """Get statistics about vector store knowledge chunks"""
    db = get_db()
    total = await db.knowledgechunks.count_documents({})
    domains = await db.knowledgechunks.distinct("domain")
    return {
        "success": True,
        "totalChunks": total,
        "domainsCount": len(domains),
        "activeDomains": domains
    }
