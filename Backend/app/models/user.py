from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

class User(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    email: str
    password: Optional[str] = None
    avatar: str = ""
    googleId: Optional[str] = None
    provider: str = "local" # "local" | "google"
    role: str = "user"
    isVerified: bool = False
    resume: str = ""
    skills: List[str] = []
    resetPasswordOtp: Optional[str] = None
    resetPasswordExpires: Optional[datetime] = None
    lastLogin: Optional[datetime] = None
    createdAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updatedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}
