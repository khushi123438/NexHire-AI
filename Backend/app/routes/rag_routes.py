from fastapi import APIRouter, Request
from app.controllers.rag_controller import (
    ingest_knowledge_handler,
    search_knowledge_handler,
    retrieve_context_handler,
    get_knowledge_stats_handler
)

router = APIRouter(prefix="/api/rag", tags=["RAG"])

@router.post("/ingest")
async def ingest_knowledge(request: Request):
    data = await request.json()
    return await ingest_knowledge_handler(data)

@router.post("/search")
async def search_knowledge(request: Request):
    data = await request.json()
    return await search_knowledge_handler(data)

@router.post("/retrieve")
async def retrieve_context(request: Request):
    data = await request.json()
    return await retrieve_context_handler(data)

@router.get("/stats")
async def get_knowledge_stats():
    return await get_knowledge_stats_handler()
