"""
Vision AI — Notification Tasks (Celery)
"""
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


def _create_notification(user_id: str, notif_type: str, title: str, body: str,
                          action_url: str = "", metadata: dict = None):
    from apps.notifications.models import Notification, NotificationType
    from apps.users.models import User
    try:
        user = User.objects.get(pk=user_id)
        Notification.objects.create(
            user=user,
            notification_type=notif_type,
            title=title,
            body=body,
            action_url=action_url,
            metadata=metadata or {},
        )
    except Exception as exc:
        logger.error("Failed to create notification for user %s: %s", user_id, exc)


@shared_task(queue="notifications",
             name="tasks.notification_tasks.send_verification_email")
def send_verification_email(user_id: str):
    """Send email verification link after registration."""
    from apps.users.models import User
    try:
        user = User.objects.get(pk=user_id)
        logger.info("Verification email queued for %s", user.email)
        # In production: generate signed token, send via SendGrid/SES
        _create_notification(
            user_id=user_id,
            notif_type="system",
            title="Welcome to Vision!",
            body="Please verify your email address to get started.",
        )
    except Exception as exc:
        logger.error("send_verification_email failed for user %s: %s", user_id, exc)


@shared_task(queue="notifications",
             name="tasks.notification_tasks.notify_recommendation_ready")
def notify_recommendation_ready(user_id: str, count: int):
    """Notify student that new recommendations are available."""
    _create_notification(
        user_id=user_id,
        notif_type="recommendation_ready",
        title="New recommendations for you!",
        body=f"We've prepared {count} personalized lessons based on your learning profile.",
        action_url="/recommendations",
    )


@shared_task(queue="notifications",
             name="tasks.notification_tasks.send_daily_digest")
def send_daily_digest():
    """Daily digest: nudge students who haven't been active today."""
    from apps.users.models import User
    from apps.users.constants import UserRole
    from django.utils import timezone
    from datetime import timedelta

    cutoff = timezone.now() - timedelta(hours=20)
    inactive = User.objects.filter(
        role=UserRole.STUDENT,
        is_active=True,
        last_active_at__lt=cutoff,
    ).values_list("id", flat=True)[:500]  # Cap at 500 per run

    for user_id in inactive:
        _create_notification(
            user_id=str(user_id),
            notif_type="lesson_reminder",
            title="Continue your learning streak",
            body="You haven't studied today. Keep the momentum going!",
            action_url="/dashboard",
        )
    logger.info("Daily digest sent to %d students", len(inactive))


@shared_task(queue="notifications",
             name="tasks.notification_tasks.send_streak_alert")
def send_streak_alert(user_id: str, streak_days: int):
    _create_notification(
        user_id=user_id,
        notif_type="streak_alert",
        title=f"🔥 {streak_days}-day streak at risk!",
        body="Complete at least one lesson today to keep your streak alive.",
        action_url="/dashboard",
    )
