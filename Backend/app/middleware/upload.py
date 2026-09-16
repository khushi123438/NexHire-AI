import os
import time
import random
import aiofiles
from pathlib import Path
from fastapi import UploadFile

# Base directory for uploads relative to Backend
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
RESUME_UPLOAD_DIR = BACKEND_DIR / "uploads" / "resumes"
AUDIO_UPLOAD_DIR = BACKEND_DIR / "uploads" / "audio"

RESUME_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
AUDIO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

async def save_resume_file(file: UploadFile) -> dict:
    """Saves uploaded PDF resume file to uploads/resumes and returns path and metadata"""
    original_name = file.filename or "resume.pdf"
    timestamp = int(time.time() * 1000)
    filename = f"{timestamp}-{original_name}"
    file_path = RESUME_UPLOAD_DIR / filename
    
    content = await file.read()
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)
        
    return {
        "filename": filename,
        "originalname": original_name,
        "path": str(file_path),
        "url": f"/uploads/resumes/{filename}",
        "content_bytes": content
    }

async def save_audio_file(file: UploadFile) -> dict:
    """Saves uploaded audio file to uploads/audio and returns path and metadata"""
    original_name = file.filename or "answer.webm"
    ext = Path(original_name).suffix or ".webm"
    timestamp = int(time.time() * 1000)
    rand_suffix = random.randint(100000000, 999999999)
    filename = f"candidate-answer-{timestamp}-{rand_suffix}{ext}"
    file_path = AUDIO_UPLOAD_DIR / filename
    
    content = await file.read()
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)
        
    return {
        "filename": filename,
        "originalname": original_name,
        "path": str(file_path),
        "url": f"/uploads/audio/{filename}",
        "content_bytes": content
    }
