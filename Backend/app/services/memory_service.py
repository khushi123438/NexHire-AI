import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.config.db import get_db
from app.utils.helpers import to_object_id, serialize_doc
from app.services.embedding_service import get_embedding, calculate_cosine_similarity

async def record_evaluation_memory(
    candidate_id: Any,
    interview_id: str = "",
    domain: str = "General",
    topic: str = "General",
    concept: str = "",
    score: float = 5.0,
    evidence: str = "",
    missing_concepts: List[str] = None
) -> Optional[Dict[str, Any]]:
    """Record evaluation outcome into CandidateMemory collection"""
    if not candidate_id:
        return None
    if missing_concepts is None:
        missing_concepts = []

    try:
        db = get_db()
        c_id = to_object_id(candidate_id)
        is_weakness = score < 6.5 or len(missing_concepts) > 0
        is_strength = score >= 8.5
        mem_type = "weakness" if is_weakness else ("strength" if is_strength else "concept_mastery")

        target_concept = concept or (missing_concepts[0] if missing_concepts else topic)
        text_for_embedding = f"{domain} {topic} {target_concept} {evidence}"
        embedding = await get_embedding(text_for_embedding)

        # Check existing memory for this candidate, topic, and concept
        existing = await db.candidatememories.find_one({
            "candidateId": c_id,
            "topic": {"$regex": f"^{re.escape(topic.strip())}$", "$options": "i"},
            "concept": {"$regex": f"^{re.escape(target_concept.strip())}$", "$options": "i"}
        })

        if existing:
            new_score = round((existing.get("score", 5.0) + score) / 2.0, 1)
            reassessed = existing.get("reassessedCount", 0) + 1
            resolved = existing.get("resolved", False)
            if score >= 7.5 and existing.get("type") == "weakness":
                resolved = True

            update_data = {
                "score": new_score,
                "reassessedCount": reassessed,
                "evidence": evidence or existing.get("evidence", ""),
                "resolved": resolved,
                "updatedAt": datetime.utcnow()
            }
            if embedding:
                update_data["embedding"] = embedding

            await db.candidatememories.update_one({"_id": existing["_id"]}, {"$set": update_data})
            updated_doc = await db.candidatememories.find_one({"_id": existing["_id"]})
            return serialize_doc(updated_doc)

        new_doc = {
            "candidateId": c_id,
            "interviewId": interview_id or "",
            "type": mem_type,
            "domain": domain,
            "topic": topic,
            "concept": target_concept,
            "score": score,
            "evidence": evidence,
            "resolved": False,
            "reassessedCount": 1,
            "embedding": embedding,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        res = await db.candidatememories.insert_one(new_doc)
        new_doc["_id"] = res.inserted_id
        return serialize_doc(new_doc)
    except Exception as err:
        print(f"[MemoryService] record_evaluation_memory note: {err}")
        return None

async def get_candidate_weaknesses(candidate_id: Any, limit: int = 10) -> List[Dict[str, Any]]:
    """Get all active unresolved weaknesses for a candidate"""
    if not candidate_id:
        return []
    try:
        db = get_db()
        c_id = to_object_id(candidate_id)
        cursor = db.candidatememories.find({
            "candidateId": c_id,
            "type": "weakness",
            "resolved": {"$ne": True}
        }).sort([("score", 1), ("updatedAt", -1)]).limit(limit)
        
        docs = await cursor.to_list(length=limit)
        return [serialize_doc(d) for d in docs]
    except Exception as err:
        print(f"[MemoryService] get_candidate_weaknesses error: {err}")
        return []

async def get_candidate_strengths(candidate_id: Any, limit: int = 10) -> List[Dict[str, Any]]:
    """Get all strengths for a candidate"""
    if not candidate_id:
        return []
    try:
        db = get_db()
        c_id = to_object_id(candidate_id)
        cursor = db.candidatememories.find({
            "candidateId": c_id,
            "type": "strength"
        }).sort([("score", -1), ("updatedAt", -1)]).limit(limit)
        
        docs = await cursor.to_list(length=limit)
        return [serialize_doc(d) for d in docs]
    except Exception as err:
        print(f"[MemoryService] get_candidate_strengths error: {err}")
        return []

async def query_relevant_memory(
    candidate_id: Any,
    query_text: str = "",
    topic: str = "",
    limit: int = 5
) -> List[Dict[str, Any]]:
    """Query semantically relevant memories using cosine similarity"""
    if not candidate_id:
        return []
    try:
        db = get_db()
        c_id = to_object_id(candidate_id)
        cursor = db.candidatememories.find({"candidateId": c_id}).sort("updatedAt", -1).limit(30)
        all_memories = await cursor.to_list(length=30)
        if not all_memories:
            return []

        query_emb = await get_embedding(f"{topic} {query_text}")
        scored = []
        for mem in all_memories:
            sim = 0.0
            if mem.get("embedding") and query_emb:
                sim = calculate_cosine_similarity(mem["embedding"], query_emb)
            elif topic and topic.lower() in mem.get("topic", "").lower():
                sim = 0.8
            scored.append({"memory": mem, "similarity": sim})

        scored.sort(key=lambda x: x["similarity"], reverse=True)
        return [serialize_doc(s["memory"]) for s in scored[:limit]]
    except Exception as err:
        print(f"[MemoryService] query_relevant_memory error: {err}")
        return []

async def get_candidate_memory_summary(candidate_id: Any) -> str:
    """Format candidate memory summary for prompt inclusion"""
    if not candidate_id:
        return "No previous interview memory recorded for candidate."
    try:
        weaknesses = await get_candidate_weaknesses(candidate_id, 5)
        strengths = await get_candidate_strengths(candidate_id, 5)

        if not weaknesses and not strengths:
            return "Candidate has clean slate / no persistent weaknesses logged."

        lines = ["Candidate Performance Memory:"]
        if weaknesses:
            lines.append("Identified Weak Areas to Proactively Reassess:")
            for w in weaknesses:
                lines.append(f"- [{w.get('domain', 'General')} -> {w.get('topic', '')} -> {w.get('concept', '')}] Score: {w.get('score', 5)}/10. Evidence: '{w.get('evidence', '')}'")
        if strengths:
            lines.append("Demonstrated Strengths:")
            for s in strengths:
                lines.append(f"- [{s.get('domain', 'General')} -> {s.get('topic', '')} -> {s.get('concept', '')}] Score: {s.get('score', 8)}/10")

        return "\n".join(lines)
    except Exception:
        return "Memory retrieval error."
