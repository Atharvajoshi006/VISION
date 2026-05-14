from __future__ import annotations
from django.db import models
from django.conf import settings


class Recommendation(models.Model):
    """
    Cached recommendation payload for a user.
    Filled nightly by a Celery beat task.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recommendations")
    payload = models.JSONField()               # list of dicts (lesson_id, title, score,…)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-generated_at"]
        unique_together = ("user",)           # only the latest payload per user

    def __str__(self):
        return f"Recommendations for {self.user.email} @ {self.generated_at.isoformat()}"
