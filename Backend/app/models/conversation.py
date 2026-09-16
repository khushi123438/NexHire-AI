from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field

class Conversation(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    interviewId: str
    targetRole: str = "Software Development Engineer (SDE)"
    user: Any # ObjectId or str
    speaker: str # "AI_RECRUITER", "CANDIDATE"
    text: str
    audioUrl: str = ""
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)
    duration: float = 0.0
    stage: str = "HR" # "HR", "TECHNICAL", "MANAGERIAL", "FOLLOWUP"
    createdAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updatedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
