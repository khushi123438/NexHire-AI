import os
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "your_super_secret_key")
JWT_EXPIRE = os.getenv("JWT_EXPIRE", "7d")

def parse_expire_duration(expire_str: str) -> timedelta:
    expire_str = str(expire_str).strip()
    if expire_str.endswith("d"):
        days = int(expire_str[:-1])
        return timedelta(days=days)
    elif expire_str.endswith("h"):
        hours = int(expire_str[:-1])
        return timedelta(hours=hours)
    elif expire_str.endswith("m"):
        minutes = int(expire_str[:-1])
        return timedelta(minutes=minutes)
    elif expire_str.endswith("s"):
        seconds = int(expire_str[:-1])
        return timedelta(seconds=seconds)
    try:
        days = int(expire_str)
        return timedelta(days=days)
    except Exception:
        return timedelta(days=7)

def generate_token(user_id: str) -> str:
    """Generates a signed JWT for the given user ID, exactly matching jsonwebtoken in Node.js"""
    duration = parse_expire_duration(JWT_EXPIRE)
    payload = {
        "id": str(user_id),
        "exp": datetime.utcnow() + duration,
        "iat": datetime.utcnow()
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token

def verify_token(token: str) -> dict:
    """Verifies a JWT token and returns payload"""
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
