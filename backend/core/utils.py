"""
VISION Platform — Core Utilities
Shared helpers for all intelligence modules.
"""
import hashlib
import json
import logging
from functools import wraps
from typing import Any, Dict, Optional

from django.core.cache import cache

logger = logging.getLogger("vision")


def make_cache_key(*args, prefix: str = "vision") -> str:
    """Generate a deterministic cache key from arguments."""
    key_data = json.dumps(args, sort_keys=True, default=str)
    key_hash = hashlib.md5(key_data.encode()).hexdigest()
    return f"{prefix}:{key_hash}"


def cache_result(timeout: int = 300, prefix: str = "vision"):
    """
    Decorator: cache the return value of a function in Redis.
    Usage:
        @cache_result(timeout=600, prefix="predictions")
        def get_prediction(user_id, concept_id): ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = make_cache_key(func.__name__, *args, **kwargs, prefix=prefix)
            cached = cache.get(key)
            if cached is not None:
                return cached
            result = func(*args, **kwargs)
            cache.set(key, result, timeout)
            return result
        return wrapper
    return decorator


def invalidate_cache_prefix(prefix: str):
    """Invalidate all cache keys with a given prefix."""
    cache.delete_pattern(f"{prefix}:*")


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Safe division avoiding ZeroDivisionError."""
    if denominator == 0:
        return default
    return numerator / denominator


def clamp(value: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    """Clamp a value between min and max."""
    return max(min_val, min(max_val, value))


def compute_decay_score(
    value: float,
    days_since_update: int,
    decay_rate: float = 0.1,
) -> float:
    """
    Apply exponential decay to a score based on recency.
    Used for engagement scores, mastery levels, etc.
    """
    import math
    return value * math.exp(-decay_rate * days_since_update)


def success_response(data: Any = None, message: str = "Success", status: int = 200) -> Dict:
    """Standard Vision API success response envelope."""
    return {
        "success": True,
        "message": message,
        "data": data,
    }


def error_response(message: str, code: str = "error", details: Any = None) -> Dict:
    """Standard Vision API error response envelope."""
    return {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details,
        },
    }
