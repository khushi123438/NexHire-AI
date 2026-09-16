from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field

class CandidateSkill(BaseModel):
    name: str
    level: str = "intermediate" # "beginner", "intermediate", "advanced", "expert"
    confidence: float = 0.8
    yearsOfExperience: float = 0

class CandidateProject(BaseModel):
    name: str
    technologies: List[str] = Field(default_factory=list)
    description: str = ""
    impact: str = ""

class CandidateProfile(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    userId: Any # ObjectId or str
    targetRole: Optional[str] = None
    targetRoles: List[str] = Field(default_factory=list)
    roleRecommendations: Dict[str, float] = Field(default_factory=dict)
    skills: List[CandidateSkill] = Field(default_factory=list)
    projects: List[CandidateProject] = Field(default_factory=list)
    experienceSummary: str = ""
    educationSummary: str = ""
    certifications: List[str] = Field(default_factory=list)
    weakAreas: List[str] = Field(default_factory=list)
    strongAreas: List[str] = Field(default_factory=list)
    overallReadinessScore: float = 70.0
    rawResumeText: str = ""
    createdAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updatedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
