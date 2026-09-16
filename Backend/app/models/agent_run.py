from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field

class AgentRun(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    agent: str
    interviewId: str = ""
    candidateId: Optional[Any] = None
    status: str = "success" # "success", "error", "fallback"
    latencyMs: float = 0.0
    tokenUsage: int = 0
    modelUsed: str = "gemini-2.5-flash"
    input: Dict[str, Any] = {}
    output: Dict[str, Any] = {}
    errorMessage: str = ""
    createdAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updatedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
