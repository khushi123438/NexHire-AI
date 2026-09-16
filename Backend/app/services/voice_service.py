import os
from typing import Dict, Any
from app.middleware.upload import save_audio_file

async def process_voice_answer(file) -> Dict[str, Any]:
    """Process uploaded candidate audio recording and return storage metadata"""
    return await save_audio_file(file)
