from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field

class CandidateMemory(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    candidateId: Any # ObjectId or str
    interviewId: str = ""
    type: str = "weakness" # "weakness", "strength", "repeated_mistake", "concept_mastery"
    domain: str = "General"
    topic: str
    concept: str
    score: float = 5.0
    evidence: str = ""
    reassessedCount: int = 0
    resolved: bool = False
    embedding: List[float] = []
    createdAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updatedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
