from __future__ import annotations
import uuid
from django.db import models
from django.conf import settings


class EmailLog(models.Model):
    """
    Simple log of outgoing e‑mail notifications (useful for audit & retries).
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="email_logs")
    subject = models.CharField(max_length=250)
    body = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-sent_at"]

    def __str__(self):
        status = "OK" if self.success else "FAIL"
        return f"[{status}] {self.subject} → {self.user.email}"


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        RECOMMENDATION_READY = "recommendation_ready", "New Recommendations Ready"
        LESSON_REMINDER = "lesson_reminder", "Lesson Reminder"
        STREAK_ALERT = "streak_alert", "Streak at Risk"
        QUIZ_RESULT = "quiz_result", "Quiz Result"
        COURSE_COMPLETED = "course_completed", "Course Completed"
        PROFILE_INSIGHT = "profile_insight", "Learning Profile Insight"
        SYSTEM = "system", "System Notification"

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    id = models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices, db_index=True)
    title = models.CharField(max_length=200)
    body = models.TextField()
    action_url = models.CharField(max_length=500, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(blank=True, null=True)
    metadata = models.JSONField(default=dict)

    class Meta:
        db_table = "notifications_notification"
        ordering = ["-created_at"]
