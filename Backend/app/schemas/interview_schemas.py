from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class StartInterviewRequest(BaseModel):
    skills: Optional[List[str]] = Field(default=None)
    targetRole: Optional[str] = Field(default=None)
    resumeId: Optional[str] = Field(default=None)
    round: Optional[str] = Field(default="ROUND_1_TECHNICAL")

class SwitchRoundRequest(BaseModel):
    interviewId: Optional[str] = Field(default=None)
    round: Optional[str] = Field(default="ROUND_1_TECHNICAL")
    targetRole: Optional[str] = Field(default=None)
    skills: Optional[List[str]] = Field(default=None)

class ProceedRoundRequest(BaseModel):
    interviewId: str

class PauseResumeRequest(BaseModel):
    interviewId: str

class SkipQuestionRequest(BaseModel):
    interviewId: str

class MarkReviewRequest(BaseModel):
    interviewId: str

class EndInterviewRequest(BaseModel):
    interviewId: str

class ConfirmSkillsRequest(BaseModel):
    skills: List[str]
    targetRole: Optional[str] = None
    resumeId: Optional[str] = None

class RAGIngestRequest(BaseModel):
    text: str
    domain: Optional[str] = "General"
    topic: Optional[str] = "General"
    subtopic: Optional[str] = ""
    difficulty: Optional[str] = "medium"
    contentType: Optional[str] = "concept"
    source: Optional[str] = "Custom Upload"
    tags: Optional[List[str]] = []

class RAGSearchRequest(BaseModel):
    query: str
    domain: Optional[str] = "General"
    topic: Optional[str] = ""
    difficulty: Optional[str] = ""
    topK: Optional[int] = 3

class GeneratePlanRequest(BaseModel):
    candidateId: Optional[str] = None
    interviewId: Optional[str] = None
    targetRole: Optional[str] = "Software Development Engineer (SDE)"
