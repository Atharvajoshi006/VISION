import logging
import uuid
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger("request")


class RequestLoggerAdapter(logging.LoggerAdapter):
    def process(self, msg, kwargs):
        extra = kwargs.setdefault("extra", {})
        extra["request_id"] = self.extra.get("request_id")
        return msg, kwargs


class RequestIDMiddleware(MiddlewareMixin):
    """
    Assign a UUID to every incoming request and attach it to the logger.
    Useful for tracing in a distributed system.
    """

    def process_request(self, request):
        request.id = str(uuid.uuid4())
        request._logger = RequestLoggerAdapter(logger, {"request_id": request.id})

    def process_response(self, request, response):
        request_logger = getattr(request, "_logger", logger)
        request_logger.info(
            "Request %s %s %s → %s",
            request.method,
            request.path,
            request.id,
            response.status_code,
        )
        return response
