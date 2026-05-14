from __future__ import annotations
from django.db import models
from django.conf import settings
from django.utils import timezone


class LessonProgress(models.Model):
    """
    Tracks a learner’s progress on a specific lesson.
    """
    class Status(models.IntegerChoices):
        NOT_STARTED = 0, "Not started"
        IN_PROGRESS = 1, "In progress"
        COMPLETED = 2, "Completed"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="lesson_progress")
    lesson = models.ForeignKey(
        "courses.Lesson", on_delete=models.CASCADE, related_name="student_progress"
    )
    status = models.PositiveSmallIntegerField(choices=Status.choices, default=Status.NOT_STARTED)
    last_accessed = models.DateTimeField(auto_now=True)
    completion_ratio = models.FloatField(default=0.0)

    class Meta:
        unique_together = ("user", "lesson")
        ordering = ["-last_accessed"]

    def __str__(self):
        return f"{self.user.email} – {self.lesson.title} ({self.get_status_display()})"


class SkillMastery(models.Model):
    """
    Stores the Bayesian‑style mastery probability (0‑1) for a user‑skill pair.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="skill_masteries")
    skill = models.ForeignKey("courses.Skill", on_delete=models.CASCADE, related_name="masteries")
    mastery = models.FloatField(default=0.0)  # 0‑1 probability
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "skill")
        ordering = ["-mastery"]

    def __str__(self):
        return f"{self.user.email} – {self.skill.name}: {self.mastery:.2%}"
