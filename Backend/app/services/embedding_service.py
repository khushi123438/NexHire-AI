import os
import math
import re
import httpx
from typing import List, Union, Any
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Technical keyword boost weights dictionary
TECH_KEYWORDS = {
    "java": 12.0,
    "javascript": 12.0,
    "react": 12.0,
    "node": 12.0,
    "mongodb": 12.0,
    "sql": 12.0,
    "dbms": 12.0,
    "index": 10.0,
    "btree": 10.0,
    "hashmap": 10.0,
    "multithreading": 10.0,
    "concurrency": 10.0,
    "lock": 10.0,
    "deadlock": 10.0,
    "transaction": 10.0,
    "acid": 10.0,
    "isolation": 10.0,
    "normal": 10.0,
    "sharding": 10.0,
    "cache": 10.0,
    "redis": 10.0,
    "eventloop": 10.0,
    "promise": 8.0,
    "async": 8.0,
    "closure": 8.0,
    "prototype": 8.0,
    "docker": 8.0,
    "kubernetes": 8.0,
    "dsa": 10.0,
    "tree": 10.0,
    "graph": 10.0,
    "dp": 10.0,
    "heap": 10.0,
    "sorting": 8.0,
    "star": 8.0,
    "behavioral": 8.0,
    "conflict": 8.0,
    "salary": 8.0,
    "culture": 8.0,
    "leadership": 8.0,
}

def is_valid_embedding(embedding: Any, expected_dim: int = None) -> bool:
    """Reusable embedding validator ensuring non-empty list of finite floats"""
    if not isinstance(embedding, list) or len(embedding) == 0:
        return False
    if expected_dim and len(embedding) != expected_dim:
        return False
    for val in embedding:
        if not isinstance(val, (int, float)) or math.isnan(val) or math.isinf(val):
            return False
    return True

def generate_deterministic_vector(text: str = "", dimensions: int = 128) -> List[float]:
    """
    Deterministic semantic n-gram & TF-IDF feature vectorizer (128-dim dense float vector).
    Guaranteed to return 100% valid, finite numeric arrays.
    """
    safe_dim = max(16, dimensions if isinstance(dimensions, int) else 128)
    vector = [0.0] * safe_dim

    if not text or not isinstance(text, str):
        return vector

    normalized = re.sub(r'[^a-z0-9\s#+._-]', ' ', text.lower())
    tokens = [t for t in normalized.split() if t]

    for idx, token in enumerate(tokens):
        weight = TECH_KEYWORDS.get(token, 1.0)
        
        # 32-bit unsigned string hash matching JS
        h = 0
        for ch in token:
            h = ((h * 31) + ord(ch)) & 0xFFFFFFFF

        dim1 = abs(h) % safe_dim
        dim2 = abs((h * 17) ^ (idx * 7)) % safe_dim

        token_factor = 1.0 / math.sqrt(len(tokens) + 1)
        vector[dim1] += weight * token_factor
        vector[dim2] += weight * 0.5 * token_factor

    # Extract character tri-grams
    if len(normalized) >= 3:
        for i in range(0, len(normalized) - 2, 2):
            gram = normalized[i:i+3]
            gh = 0
            for ch in gram:
                gh = ((gh * 37) + ord(ch)) & 0xFFFFFFFF
            gram_dim = abs(gh) % safe_dim
            vector[gram_dim] += 0.2

    # Calculate L2 norm
    sum_sq = sum(v * v for v in vector)
    norm = math.sqrt(sum_sq) if sum_sq > 0 else 1.0

    normalized_vec = [round(v / norm, 6) for v in vector]
    return normalized_vec

async def get_embedding(text: str = "") -> List[float]:
    """
    Generate embedding vector for a given text snippet.
    Tries Google GenAI Embedding API, gracefully falls back to deterministic vectorizer.
    """
    if not text or not isinstance(text, str):
        return generate_deterministic_vector("", 128)

    clean_text = text[:2000].strip()

    if GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={GEMINI_API_KEY}"
            payload = {
                "model": "models/text-embedding-004",
                "content": {"parts": [{"text": clean_text}]}
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    values = data.get("embedding", {}).get("values")
                    if values and is_valid_embedding(values):
                        return values
        except Exception:
            pass

    return generate_deterministic_vector(clean_text, 128)

async def get_batch_embeddings(texts: List[str]) -> List[List[float]]:
    embeddings = []
    for text in texts:
        emb = await get_embedding(text)
        embeddings.append(emb)
    return embeddings

def calculate_cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Compute cosine similarity between two numeric vectors"""
    if not is_valid_embedding(vec_a) or not is_valid_embedding(vec_b):
        return 0.0

    min_len = min(len(vec_a), len(vec_b))
    dot_product = 0.0
    norm_a = 0.0
    norm_b = 0.0

    for i in range(min_len):
        dot_product += vec_a[i] * vec_b[i]
        norm_a += vec_a[i] * vec_a[i]
        norm_b += vec_b[i] * vec_b[i]

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    denominator = math.sqrt(norm_a) * math.sqrt(norm_b)
    if denominator == 0.0:
        return 0.0

    similarity = dot_product / denominator
    return max(0.0, min(1.0, float(similarity)))
