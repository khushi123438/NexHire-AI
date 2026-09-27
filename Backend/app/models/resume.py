from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field

class Resume(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user: Any # ObjectId or str
    fileName: str = "Resume.pdf"
    targetRole: Optional[str] = None
    resumeUrl: str = ""
    extractedText: str = ""
    skills: List[str] = Field(default_factory=list)
    experience: str = ""
    education: str = ""
    projects: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    uploadedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
