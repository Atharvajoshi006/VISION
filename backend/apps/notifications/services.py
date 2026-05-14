from django.core.mail import send_mail, EmailMessage, BadHeaderError
from django.conf import settings
from .models import EmailLog
import logging

logger = logging.getLogger(__name__)


def send_notification_email(user_email: str, subject: str, body: str, html_body: str = None) -> bool:
    """
    Sends an e‑mail and records a log entry.
    Returns True on success, False otherwise.
    """
    try:
        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user_email],
        )
        if html_body:
            email.content_subtype = "html"
            email.body = html_body

        email.send()
        EmailLog.objects.create(user_id=user_email, subject=subject, body=body, success=True)
        logger.info("Sent email to %s – %s", user_email, subject)
        return True
    except Exception as exc:
        EmailLog.objects.create(
            user_id=user_email,
            subject=subject,
            body=body,
            success=False,
            error_message=str(exc),
        )
        logger.error("Failed to send email to %s: %s", user_email, exc)
        return False
