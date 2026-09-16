from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field

class DailyMilestone(BaseModel):
    day: int
    title: str
    focusArea: str
    concepts: List[str] = []
    practiceQuestions: List[str] = []
    resources: List[str] = []
    completed: bool = False

class WeaknessReportItem(BaseModel):
    domain: Optional[str] = ""
    topic: Optional[str] = ""
    concept: Optional[str] = ""
    severity: str = "moderate" # "critical", "moderate", "minor"
    evidence: Optional[str] = ""
    score: Optional[float] = 5.0
    recommendation: Optional[str] = ""

class LearningPlan(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    candidateId: Any
    interviewId: str = ""
    targetRole: str = "Software Development Engineer (SDE)"
    overallSummary: str = ""
    readinessScore: float = 70.0
    weaknessReport: List[WeaknessReportItem] = []
    strongConcepts: List[str] = []
    dailyRoadmap: List[DailyMilestone] = []
    nextInterviewStrategy: str = ""
    recommendedTopics: List[str] = []
    createdAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updatedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
