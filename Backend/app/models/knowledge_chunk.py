from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class KnowledgeChunk(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    text: str
    domain: str
    topic: str
    subtopic: str = ""
    difficulty: str = "medium" # "beginner", "medium", "advanced", "hard"
    contentType: str = "concept" # "concept", "code", "tradeoff", "scenario", "deepdive"
    source: str = "NexHire AI Curated Corpus"
    tags: List[str] = []
    embedding: List[float] = []
    createdAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updatedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
