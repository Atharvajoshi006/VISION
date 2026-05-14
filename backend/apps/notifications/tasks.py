from __future__ import annotations
from celery import shared_task
from ..services import send_notification_email


@shared_task
def email_welcome_task(user_email: str, first_name: str = ""):
    subject = "Welcome to Oblivion VISION‑AI!"
    body = f"""Hello {first_name or "there"},

Welcome to the platform! We're excited to have you on board.

Best,
The Oblivion Team"""
    send_notification_email(user_email, subject, body)


@shared_task
def email_generic_task(user_email: str, subject: str, body: str, html_body: str = None):
    send_notification_email(user_email, subject, body, html_body)
