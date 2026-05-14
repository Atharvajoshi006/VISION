"""
VISION Platform — Custom Exception Handler
Standardized error responses across all API endpoints.
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger("vision")


def vision_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent JSON error responses.
    Format:
    {
        "success": false,
        "error": {
            "code": "validation_error",
            "message": "...",
            "details": {...}
        }
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            "success": False,
            "error": {
                "code": _get_error_code(response.status_code),
                "message": _extract_message(response.data),
                "details": response.data,
            },
        }
        response.data = error_data

        # Log 5xx errors
        if response.status_code >= 500:
            logger.error(
                "server_error",
                extra={
                    "status_code": response.status_code,
                    "view": str(context.get("view")),
                    "error": str(exc),
                },
            )

    return response


def _get_error_code(status_code):
    codes = {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        405: "method_not_allowed",
        409: "conflict",
        429: "rate_limit_exceeded",
        500: "internal_server_error",
        503: "service_unavailable",
    }
    return codes.get(status_code, "error")


def _extract_message(data):
    if isinstance(data, dict):
        if "detail" in data:
            return str(data["detail"])
        for key, val in data.items():
            if isinstance(val, list) and val:
                return f"{key}: {val[0]}"
    if isinstance(data, list) and data:
        return str(data[0])
    return "An error occurred."


class VisionAPIException(Exception):
    """Base exception for all Vision-specific errors."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_message = "A Vision platform error occurred."

    def __init__(self, message=None, code=None, details=None):
        self.message = message or self.default_message
        self.code = code
        self.details = details
        super().__init__(self.message)


class PredictionServiceError(VisionAPIException):
    """Raised when ML prediction pipeline fails."""
    default_message = "Prediction service is temporarily unavailable."
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


class TrackingIngestionError(VisionAPIException):
    """Raised when event ingestion fails."""
    default_message = "Failed to ingest behavioral event."


class AIServiceError(VisionAPIException):
    """Raised when Gemini AI service fails."""
    default_message = "AI generation service is temporarily unavailable."
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


class GraphTraversalError(VisionAPIException):
    """Raised when dependency graph traversal fails."""
    default_message = "Knowledge graph traversal failed."
