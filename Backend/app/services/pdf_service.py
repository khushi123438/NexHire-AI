import io
from typing import Optional
from pypdf import PdfReader

def extract_pdf_text(file_bytes: bytes) -> str:
    """Extract text from PDF file bytes"""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        parts = []
        for page in reader.pages:
            txt = page.extract_text()
            if txt:
                parts.append(txt)
        return "\n".join(parts)
    except Exception as e:
        print(f"[PDF Service Error]: {e}")
        return ""
