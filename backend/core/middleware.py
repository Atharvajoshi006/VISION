"""
VISION Platform — Custom Middleware
Request ID injection + Behavioral tracking middleware.
"""
import uuid
import logging
import threading

logger = logging.getLogger("vision")
_thread_local = threading.local()


class RequestIDMiddleware:
    """
    Injects a unique X-Request-ID header into every request/response.
    Makes all logs traceable per request.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.request_id = request_id
        _thread_local.request_id = request_id

        response = self.get_response(request)
        response["X-Request-ID"] = request_id
        return response


class BehavioralTrackingMiddleware:
    """
    Passive API-level behavioral tracking.
    Logs navigation patterns without blocking the request.
    Only tracks authenticated users on API endpoints.
    """
    TRACKED_PREFIXES = ["/api/v1/courses/", "/api/v1/tracking/"]
    SKIP_PREFIXES = ["/api/v1/auth/", "/swagger/", "/redoc/", "/admin/"]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Only track authenticated users on relevant endpoints
        if (
            hasattr(request, "user")
            and request.user.is_authenticated
            and any(request.path.startswith(p) for p in self.TRACKED_PREFIXES)
            and not any(request.path.startswith(p) for p in self.SKIP_PREFIXES)
        ):
            self._log_navigation(request, response)

        return response

    def _log_navigation(self, request, response):
        """Log navigation events asynchronously."""
        try:
            logger.debug(
                "nav_event",
                extra={
                    "user_id": str(request.user.id),
                    "method": request.method,
                    "path": request.path,
                    "status_code": response.status_code,
                    "request_id": getattr(request, "request_id", ""),
                },
            )
        except Exception:
            pass  # Never let tracking break the request
