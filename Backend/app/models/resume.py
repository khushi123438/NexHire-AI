from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field

class Resume(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user: Any # ObjectId or str
    fileName: str = "Resume.pdf"
    targetRole: str = "Software Development Engineer (SDE)"
    resumeUrl: str = ""
    extractedText: str = ""
    skills: List[str] = []
    experience: str = ""
    education: str = ""
    uploadedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
