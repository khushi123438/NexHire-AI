from fastapi import HTTPException, status
from app.config.db import get_db
from app.rag.ingestion.ingestion_service import seed_knowledge_base, ingest_document
from app.rag.retrieval.retrieval_service import retrieve_knowledge

async def ingest_knowledge_handler(data: dict) -> dict:
    try:
        text = data.get("text")
        domain = data.get("domain", "General")
        topic = data.get("topic", "General")
        subtopic = data.get("subtopic", "")
        difficulty = data.get("difficulty", "medium")
        content_type = data.get("contentType", "concept")
        tags = data.get("tags", [])
        force_seed = bool(data.get("forceSeed", False))

        if text:
            chunk = await ingest_document(
                text=text,
                domain=domain,
                topic=topic,
                subtopic=subtopic,
                difficulty=difficulty,
                contentType=content_type,
                tags=tags
            )
            return {
                "success": True,
                "message": "Document chunk ingested successfully",
                "chunk": chunk
            }

        result = await seed_knowledge_base(force=force_seed)
        return {
            "success": True,
            **result
        }
    except Exception as e:
        print(f"[RAG Ingestion Controller Error]: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": str(e)}
        )

async def search_knowledge_handler(data: dict) -> dict:
    try:
        query = data.get("query", "")
        domain = data.get("domain", "")
        topic = data.get("topic", "")
        difficulty = data.get("difficulty", "")
        content_type = data.get("contentType", "")
        top_k = int(data.get("topK", 4))

        result = await retrieve_knowledge(
            query=query,
            domain=domain,
            topic=topic,
            difficulty=difficulty,
            contentType=content_type,
            topK=top_k
        )

        return {
            "success": True,
            **result
        }
    except Exception as e:
        print(f"[RAG Search Error]: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": str(e)}
        )

async def retrieve_context_handler(data: dict) -> dict:
    try:
        query = data.get("query") or data.get("topic") or data.get("domain") or "Core Fundamentals"
        domain = data.get("domain", "")
        topic = data.get("topic", "")
        difficulty = data.get("difficulty", "")
        top_k = int(data.get("topK", 3))

        result = await retrieve_knowledge(
            query=query,
            domain=domain,
            topic=topic,
            difficulty=difficulty,
            topK=top_k
        )

        return {
            "success": True,
            "contextSnippet": result.get("contextSnippet", ""),
            "chunks": result.get("results", [])
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": str(e)}
        )

async def get_knowledge_stats_handler() -> dict:
    try:
        db = get_db()
        total_chunks = await db.knowledgechunks.count_documents({})
        domains = await db.knowledgechunks.distinct("domain")
        return {
            "success": True,
            "stats": {
                "totalChunks": total_chunks,
                "domains": domains
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": str(e)}
        )
