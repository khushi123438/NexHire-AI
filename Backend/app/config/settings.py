import os
from pydantic_settings import BaseSettings if False else object
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT", 5000))
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/NexHire-AI")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your_super_secret_key")
    JWT_EXPIRE: str = os.getenv("JWT_EXPIRE", "7d")
    CLIENT_URL: str = os.getenv("CLIENT_URL", "http://localhost:5173")
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_CALLBACK_URL: str = os.getenv("GOOGLE_CALLBACK_URL", "http://localhost:5000/api/auth/google/callback")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    EMAIL_USER: str = os.getenv("EMAIL_USER", "")
    EMAIL_PASS: str = os.getenv("EMAIL_PASS", "")

settings = Settings()
