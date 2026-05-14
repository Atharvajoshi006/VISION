import os
import httpx
from django.conf import settings
from typing import List, Dict

# --------------------------------------------------------------
# Settings – you can point this at a local FastAPI inference server
# (defined in the separate ``llm_service`` container) or at
# the real OpenAI API.
# --------------------------------------------------------------
USE_LOCAL = bool(getattr(settings, "LLM_ENDPOINT", None))

if USE_LOCAL:
    BASE_URL = settings.LLM_ENDPOINT.rstrip("/")
    HEADERS = {}
else:
    BASE_URL = "https://api.openai.com/v1"
    HEADERS = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}


async def _post(path: str, payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(f"{BASE_URL}{path}", json=payload, headers=HEADERS)
        response.raise_for_status()
        return response.json()


# ----------------------------------------------------------------------
# Public helpers – all accept the same parameters regardless of backend.
# ----------------------------------------------------------------------
async def generate_explanation(topic: str, learner_context: str) -> str:
    system = (
        "You are a patient teacher. Explain the given topic step‑by‑step, "
        "adapting the depth to the learner context."
    )
    user = f"Topic: {topic}\nLearner context: {learner_context}"
    payload = {
        "model": "mentor",
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.1,
        "max_tokens": 800,
    }
    data = await _post("/chat/completions", payload)
    return data["choices"][0]["message"]["content"]


async def generate_hint(problem: str, learner_progress: str) -> str:
    system = (
        "You are a helpful mentor. Provide a short (1‑2 sentence) hint "
        "that nudges the learner without giving the final answer."
    )
    user = f"Problem: {problem}\nProgress: {learner_progress}"
    payload = {
        "model": "mentor",
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.3,
        "max_tokens": 150,
    }
    data = await _post("/chat/completions", payload)
    return data["choices"][0]["message"]["content"]


async def generate_project_brief(skills: List[str], difficulty: str = "intermediate") -> str:
    system = (
        "You are a curriculum designer. Write a markdown project brief that "
        "covers the supplied skills at the given difficulty."
    )
    user = f"Skills: {', '.join(skills)}\nDifficulty: {difficulty}"
    payload = {
        "model": "mentor",
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.5,
        "max_tokens": 1200,
    }
    data = await _post("/chat/completions", payload)
    return data["choices"][0]["message"]["content"]
