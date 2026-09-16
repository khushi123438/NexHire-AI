import os
import re
import json
import time
import httpx
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from app.config.db import get_db
from app.utils.helpers import to_object_id

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
]

def parse_ai_json(raw_text: Optional[str], default_fallback: Any = None) -> Any:
    """Robust JSON parser with cleanup for LLM responses matching Node.js implementation"""
    if default_fallback is None:
        default_fallback = {}
    if not raw_text or not isinstance(raw_text, str):
        return default_fallback

    try:
        clean = re.sub(r'```json', '', raw_text, flags=re.IGNORECASE)
        clean = re.sub(r'```', '', clean).strip()

        first_brace = clean.find("{")
        last_brace = clean.rfind("}")
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            clean = clean[first_brace:last_brace + 1]
        return json.loads(clean)
    except Exception:
        try:
            # Try relaxing trailing commas
            relaxed = re.sub(r'```json', '', raw_text, flags=re.IGNORECASE)
            relaxed = re.sub(r'```', '', relaxed)
            relaxed = re.sub(r',\s*([\]}])', r'\1', relaxed).strip()
            first = relaxed.find("{")
            last = relaxed.rfind("}")
            if first != -1 and last != -1:
                return json.loads(relaxed[first:last + 1])
        except Exception:
            pass
        return default_fallback

def validate_input_guardrails(text: str = "") -> bool:
    """Input Guardrails: Detects potential prompt injection or malicious overrides"""
    if not isinstance(text, str):
        return True

    injection_patterns = [
        re.compile(r'ignore all previous instructions', re.I),
        re.compile(r'system override', re.I),
        re.compile(r'disregard system prompt', re.I),
        re.compile(r'you are now a hacker', re.I),
        re.compile(r'reveal system prompt', re.I),
    ]

    for pattern in injection_patterns:
        if pattern.search(text):
            print(f"[Guardrails] Suspicious prompt pattern detected: {text[:80]}")
            return False
    return True

async def call_llm(
    prompt: str,
    system_instruction: str = "",
    agent_name: str = "SupervisorAgent",
    interview_id: str = "",
    candidate_id: Any = None,
    temperature: float = 0.4,
    max_output_tokens: int = 2048,
) -> Dict[str, Any]:
    """
    Execute LLM generation with multi-model fallback and telemetry recording
    """
    start_time = time.time()
    status = "success"
    raw_response = ""
    model_used = GEMINI_MODELS[0]
    error_message = ""

    # 1. Guardrail check
    if not validate_input_guardrails(prompt):
        return {
            "text": None,
            "raw_response": "",
            "latencyMs": 0,
            "tokenUsage": 0,
            "status": "guardrail_rejected",
            "modelUsed": model_used
        }

    # 2. Try Gemini Models via REST API
    if GEMINI_API_KEY:
        full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
        
        for model_name in GEMINI_MODELS:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
                payload = {
                    "contents": [{"parts": [{"text": full_prompt}]}],
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": max_output_tokens
                    }
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0] and "parts" in candidates[0]["content"]:
                            parts = candidates[0]["content"]["parts"]
                            if parts and "text" in parts[0]:
                                raw_response = parts[0]["text"]
                                model_used = model_name
                                break
                    else:
                        error_message = f"HTTP {resp.status_code}: {resp.text[:100]}"
            except Exception as e:
                error_message = str(e)

    latency_ms = round((time.time() - start_time) * 1000, 2)
    token_usage = round((len(prompt) + len(raw_response)) / 4)

    if not raw_response:
        status = "fallback"

    # 3. Telemetry log into AgentRun
    try:
        db = get_db()
        await db.agentruns.insert_one({
            "agent": agent_name,
            "interviewId": interview_id or "",
            "candidateId": to_object_id(candidate_id),
            "status": status,
            "latencyMs": latency_ms,
            "tokenUsage": token_usage,
            "modelUsed": model_used,
            "input": {"promptSnippet": prompt[:300]},
            "output": {"responseSnippet": raw_response[:300] if raw_response else "Operating on fallback heuristic"},
            "errorMessage": error_message,
            "createdAt": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        })
    except Exception:
        pass

    return {
        "text": raw_response or None,
        "latencyMs": latency_ms,
        "tokenUsage": token_usage,
        "status": status,
        "modelUsed": model_used
    }
