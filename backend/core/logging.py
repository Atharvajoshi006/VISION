"""
VISION Platform — JSON Logger
Structured logging formatter for all intelligence events.
"""
import json
import logging
from datetime import datetime


class VisionJSONFormatter(logging.Formatter):
    """
    Formats log records as structured JSON.
    Every log entry includes: timestamp, level, logger, message, and extra fields.
    """

    def format(self, record):
        log_record = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Attach any extra fields passed via logger.info("msg", extra={...})
        for key, value in record.__dict__.items():
            if key not in (
                "name", "msg", "args", "levelname", "levelno",
                "pathname", "filename", "module", "exc_info",
                "exc_text", "stack_info", "lineno", "funcName",
                "created", "msecs", "relativeCreated", "thread",
                "threadName", "processName", "process", "message",
            ):
                try:
                    json.dumps(value)  # ensure serializable
                    log_record[key] = value
                except (TypeError, ValueError):
                    log_record[key] = str(value)

        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_record, ensure_ascii=False)
