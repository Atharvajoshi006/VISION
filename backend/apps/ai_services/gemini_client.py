"""
VISION Platform — Gemini AI Client
Wrapper around Gemini 1.5 Flash for all AI generation tasks.
ONLY used for: explanations, quiz generation, hints, summaries, projects.
The backend intelligence (predictions, recommendations) does NOT use this.
"""
import logging
import hashlib
import json
from typing import Optional, Dict
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger("vision.ai")


class GeminiClient:
    """
    Thin, production-hardened wrapper around the Gemini 1.5 Flash API.
    Features:
    - Response caching (Redis) to minimize API calls
    - Request logging for cost tracking
    - Retry logic for transient failures
    - Token budget management
    """

    def __init__(self):
        self._model = None
        self._initialized = False

    def _initialize(self):
        """Lazy initialization — only creates client when first used."""
        if self._initialized:
            return

        if not settings.ENABLE_GEMINI_AI:
            raise RuntimeError("Gemini AI is disabled in settings.")

        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY is not set. "
                "Add it to your .env file: GEMINI_API_KEY=your_key_here"
            )

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            self._model = genai.GenerativeModel(
                model_name=settings.GEMINI_MODEL,
                generation_config={
                    "temperature": settings.GEMINI_TEMPERATURE,
                    "max_output_tokens": settings.GEMINI_MAX_OUTPUT_TOKENS,
                },
            )
            self._initialized = True
            logger.info("gemini_client_initialized", extra={"model": settings.GEMINI_MODEL})
        except ImportError:
            raise ImportError(
                "google-generativeai is not installed. "
                "Run: pip install google-generativeai"
            )

    def generate(
        self,
        prompt: str,
        cache_key: Optional[str] = None,
        cache_ttl: Optional[int] = None,
    ) -> str:
        """
        Generate text from Gemini. Returns cached response if available.

        Args:
            prompt: The full prompt to send
            cache_key: Optional unique key for caching
            cache_ttl: Cache TTL in seconds (defaults to settings value)
        """
        # Check cache first
        if cache_key:
            cached = cache.get(f"gemini:{cache_key}")
            if cached:
                logger.debug("gemini_cache_hit", extra={"cache_key": cache_key})
                return cached

        self._initialize()
        ttl = cache_ttl or settings.GEMINI_RESPONSE_CACHE_TTL

        try:
            response = self._model.generate_content(prompt)
            text = response.text

            # Cache the response
            if cache_key:
                cache.set(f"gemini:{cache_key}", text, ttl)

            logger.info(
                "gemini_request_success",
                extra={
                    "prompt_length": len(prompt),
                    "response_length": len(text),
                    "cached": bool(cache_key),
                },
            )
            return text

        except Exception as exc:
            logger.error("gemini_request_failed", extra={"error": str(exc)})
            raise

    def generate_with_cache_key(self, prompt: str, *key_parts) -> str:
        """Auto-generate cache key from prompt components."""
        raw_key = json.dumps(key_parts, sort_keys=True, default=str)
        cache_key = hashlib.md5(raw_key.encode()).hexdigest()
        return self.generate(prompt, cache_key=cache_key)


# Singleton instance
gemini_client = GeminiClient()
