import re
from typing import Dict, Any, List
from app.config.db import get_db
from app.services.embedding_service import get_embedding, calculate_cosine_similarity
from app.utils.helpers import serialize_doc

def rewrite_query(raw_query: str = "", domain: str = "", topic: str = "") -> str:
    """Query Rewriter: Enhances the raw query with domain terms & topic context"""
    clean = (raw_query or "").strip()
    parts = []
    if domain and domain != "General":
        parts.append(domain)
    if topic and topic != "General":
        parts.append(topic)
    if clean:
        parts.append(clean)
    return " ".join(parts) or "Software Engineering Fundamentals"

async def retrieve_knowledge(
    query: str = "",
    domain: str = "",
    topic: str = "",
    difficulty: str = "",
    contentType: str = "",
    topK: int = 3
) -> Dict[str, Any]:
    """
    Hybrid Semantic & Keyword Retrieval with Metadata Filtering and Reranking matching Node.js
    """
    try:
        rewritten = rewrite_query(query, domain, topic)
        query_embedding = await get_embedding(rewritten)
        db = get_db()

        # Build metadata filter
        query_filter: Dict[str, Any] = {}
        if domain and domain != "General":
            query_filter["domain"] = {"$regex": f"^{re.escape(domain.strip())}$", "$options": "i"}

        if topic and topic != "General":
            pattern = re.escape(topic.strip())
            query_filter["$or"] = [
                {"topic": {"$regex": pattern, "$options": "i"}},
                {"subtopic": {"$regex": pattern, "$options": "i"}},
                {"tags": {"$in": [{"$regex": pattern, "$options": "i"}]}}
            ]

        if difficulty:
            query_filter["difficulty"] = difficulty
        if contentType:
            query_filter["contentType"] = contentType

        # Fetch candidate chunks
        cursor = db.knowledgechunks.find(query_filter).limit(30)
        candidates = await cursor.to_list(length=30)

        # Fallback if specific filter yielded 0 results: widen filter
        if not candidates and (difficulty or contentType or "$or" in query_filter):
            widen_filter = {"domain": {"$regex": f"^{re.escape(domain.strip())}$", "$options": "i"}} if domain else {}
            cursor = db.knowledgechunks.find(widen_filter).limit(30)
            candidates = await cursor.to_list(length=30)

        if not candidates:
            cursor = db.knowledgechunks.find({}).limit(30)
            candidates = await cursor.to_list(length=30)

        # Compute hybrid relevance score: Cosine Similarity + Keyword Match Bonus + Tag Match Bonus
        query_lower = rewritten.lower()
        query_words = [w for w in query_lower.split() if len(w) > 2]

        scored = []
        for chunk in candidates:
            vector_score = 0.0
            chunk_emb = chunk.get("embedding")
            if chunk_emb and query_embedding:
                vector_score = calculate_cosine_similarity(chunk_emb, query_embedding)

            # Keyword & Tag bonus
            keyword_bonus = 0.0
            text_lower = chunk.get("text", "").lower()
            for word in query_words:
                if word in text_lower:
                    keyword_bonus += 0.08

            tags = chunk.get("tags", [])
            if isinstance(tags, list):
                for tag in tags:
                    if tag.lower() in query_lower:
                        keyword_bonus += 0.12

            diff_bonus = 0.05 if difficulty and chunk.get("difficulty") == difficulty else 0.0

            total_score = vector_score * 0.7 + min(0.3, keyword_bonus) + diff_bonus
            scored.append({
                "chunk": chunk,
                "score": round(total_score, 4),
                "vectorScore": round(vector_score, 4)
            })

        # Rerank by descending score
        scored.sort(key=lambda x: x["score"], reverse=True)
        top_results = scored[:topK]

        formatted_results = []
        context_snippets = []
        for idx, r in enumerate(top_results):
            c = r["chunk"]
            formatted_results.append({
                "id": str(c["_id"]),
                "domain": c.get("domain", ""),
                "topic": c.get("topic", ""),
                "subtopic": c.get("subtopic", ""),
                "difficulty": c.get("difficulty", "medium"),
                "contentType": c.get("contentType", "concept"),
                "text": c.get("text", ""),
                "tags": c.get("tags", []),
                "score": r["score"],
            })
            context_snippets.append(
                f"[Source #{idx + 1}: {c.get('domain', '')} - {c.get('topic', '')} ({c.get('subtopic') or 'Core'}) | Difficulty: {c.get('difficulty', 'medium')}]\n{c.get('text', '')}"
            )

        return {
            "rewrittenQuery": rewritten,
            "results": formatted_results,
            "contextSnippet": "\n\n".join(context_snippets) if context_snippets else "No domain context."
        }
    except Exception as err:
        print(f"[RAG Retrieval] error: {err}")
        return {
            "rewrittenQuery": query,
            "results": [],
            "contextSnippet": "Technical knowledge reference unavailable."
        }
