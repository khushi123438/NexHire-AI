from datetime import datetime
from typing import Dict, Any, List
from app.config.db import get_db
from app.rag.knowledge_base.curated_data import CURATED_KNOWLEDGE
from app.services.embedding_service import get_embedding, is_valid_embedding, generate_deterministic_vector
from app.utils.helpers import serialize_doc

async def seed_knowledge_base(force: bool = False) -> Dict[str, Any]:
    """
    Seed knowledge base idempotently with validation and safe upserts matching Node.js ingestion
    """
    try:
        db = get_db()

        # 1. Clean up corrupted chunks with invalid embeddings
        try:
            cursor = db.knowledgechunks.find({})
            corrupted_ids = []
            async for chunk in cursor:
                emb = chunk.get("embedding")
                if not is_valid_embedding(emb):
                    corrupted_ids.append(chunk["_id"])

            if corrupted_ids:
                print(f"[RAG Ingestion] Removing {len(corrupted_ids)} corrupted knowledge chunks...")
                await db.knowledgechunks.delete_many({"_id": {"$in": corrupted_ids}})
        except Exception as cleanup_err:
            print(f"[RAG Ingestion] Cleanup check note: {cleanup_err}")

        if force:
            await db.knowledgechunks.delete_many({})

        print(f"[RAG Ingestion] Syncing {len(CURATED_KNOWLEDGE)} curated technical chunks...")

        synced_count = 0
        skipped_count = 0

        for item in CURATED_KNOWLEDGE:
            try:
                existing = await db.knowledgechunks.find_one({
                    "domain": item["domain"],
                    "topic": item["topic"],
                    "subtopic": item.get("subtopic", "")
                })

                if existing and is_valid_embedding(existing.get("embedding")) and not force:
                    synced_count += 1
                    continue

                text_to_embed = f"{item['domain']} {item['topic']} {item.get('subtopic', '')} {' '.join(item.get('tags', []))} {item['text']}"
                embedding = await get_embedding(text_to_embed)

                if not is_valid_embedding(embedding):
                    embedding = generate_deterministic_vector(text_to_embed, 128)

                if not is_valid_embedding(embedding):
                    print(f"[RAG Ingestion] Skipping invalid chunk: {item['domain']} -> {item['topic']}")
                    skipped_count += 1
                    continue

                doc_data = {
                    "text": item["text"],
                    "domain": item["domain"],
                    "topic": item["topic"],
                    "subtopic": item.get("subtopic", ""),
                    "difficulty": item.get("difficulty", "medium"),
                    "contentType": item.get("contentType", "concept"),
                    "source": "NexHire AI Curated Corpus",
                    "tags": item.get("tags", []),
                    "embedding": embedding,
                    "updatedAt": datetime.utcnow()
                }

                if existing:
                    await db.knowledgechunks.update_one({"_id": existing["_id"]}, {"$set": doc_data})
                else:
                    doc_data["createdAt"] = datetime.utcnow()
                    await db.knowledgechunks.insert_one(doc_data)

                synced_count += 1
            except Exception as item_err:
                print(f"[RAG Ingestion] Error processing chunk '{item.get('topic')}': {item_err}")
                skipped_count += 1

        total_count = await db.knowledgechunks.count_documents({})
        print(f"[RAG Ingestion] Knowledge base ready: {total_count} valid chunks active.")
        return {
            "seeded": True,
            "count": total_count,
            "syncedCount": synced_count,
            "skippedCount": skipped_count,
            "message": f"Knowledge base synced successfully ({total_count} chunks)."
        }
    except Exception as err:
        print(f"[RAG Ingestion] Safe error handler note: {err}")
        return {"seeded": False, "error": str(err)}

async def ingest_document(
    text: str,
    domain: str = "General",
    topic: str = "General",
    subtopic: str = "",
    difficulty: str = "medium",
    contentType: str = "concept",
    source: str = "Custom Upload",
    tags: List[str] = None
) -> Dict[str, Any]:
    """Ingest a custom single document or snippet into vector store with strict validation"""
    if not text or not isinstance(text, str):
        raise ValueError("Text content is required for ingestion.")

    if tags is None:
        tags = []

    text_to_embed = f"{domain} {topic} {subtopic} {' '.join(tags)} {text}"
    embedding = await get_embedding(text_to_embed)

    if not is_valid_embedding(embedding):
        embedding = generate_deterministic_vector(text_to_embed, 128)

    if not is_valid_embedding(embedding):
        raise ValueError("Failed to generate a valid numeric embedding for the document.")

    db = get_db()
    new_chunk = {
        "text": text,
        "domain": domain,
        "topic": topic,
        "subtopic": subtopic,
        "difficulty": difficulty,
        "contentType": contentType,
        "source": source,
        "tags": tags,
        "embedding": embedding,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }

    res = await db.knowledgechunks.insert_one(new_chunk)
    new_chunk["_id"] = res.inserted_id
    return serialize_doc(new_chunk)
