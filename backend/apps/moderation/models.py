"""
Vision AI — Moderation App Models (Stub)
Full implementation: Phase 2 roadmap.
"""
from django.db import models
from core.models import BaseModel


class ContentFlag(BaseModel):
    """User-reported content flag for admin review."""

    class FlagReason(models.TextChoices):
        INAPPROPRIATE = "inappropriate", "Inappropriate Content"
        INACCURATE = "inaccurate", "Inaccurate Information"
        COPYRIGHT = "copyright", "Copyright Violation"
        OTHER = "other", "Other"

    reporter = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="flags_raised")
    content_type = models.CharField(max_length=50)  # "video", "course", "question"
    content_id = models.UUIDField()
    reason = models.CharField(max_length=30, choices=FlagReason.choices)
    description = models.TextField(blank=True, max_length=500)
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(
        "users.User", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="flags_resolved"
    )

    class Meta:
        db_table = "moderation_contentflag"
        indexes = [models.Index(fields=["is_resolved", "created_at"], name="idx_flag_resolved")]
