from __future__ import annotations

from django.db import models
from django.utils import timezone

# ----------------------------------------------------------------------
# Skill – atomic learning outcome, can be shared across many lessons.
# ----------------------------------------------------------------------
class Skill(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children"
    )
    weight = models.FloatField(default=1.0)  # importance in recommendation calculation

    class Meta:
        ordering = ["name"]
        verbose_name = "skill"
        verbose_name_plural = "skills"

    def __str__(self):
        return self.name


# ----------------------------------------------------------------------
# Course → Module → Lesson hierarchy
# ----------------------------------------------------------------------
class Course(models.Model):
    title = models.CharField(max_length=250)
    description = models.TextField()
    thumbnail = models.ImageField(upload_to="course_thumbs/", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    tags = models.JSONField(default=list, blank=True)  # simple [] tag list
    skills = models.ManyToManyField(Skill, related_name="courses", blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "course"
        verbose_name_plural = "courses"

    def __str__(self):
        return self.title


class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="modules")
    title = models.CharField(max_length=250)
    description = models.TextField(blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order"]
        unique_together = ("course", "order")

    def __str__(self):
        return f"{self.course.title} » {self.title}"


class Lesson(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=250)
    overview = models.TextField(blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    skills = models.ManyToManyField(Skill, related_name="lessons", blank=True)
    estimated_duration = models.PositiveIntegerField(default=5)  # minutes
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["order"]
        unique_together = ("module", "order")

    def __str__(self):
        return f"{self.module.title} » {self.title}"


# ----------------------------------------------------------------------
# Content – actual learning material attached to a lesson.
# ----------------------------------------------------------------------
class Content(models.Model):
    class Type(models.TextChoices):
        VIDEO = "video", "Video"
        ARTICLE = "article", "Article"
        INTERACTIVE = "interactive", "Interactive Exercise"
        QUIZ = "quiz", "Quiz"

    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="contents")
    type = models.CharField(max_length=20, choices=Type.choices)
    order = models.PositiveSmallIntegerField(default=0)
    data = models.JSONField(default=dict, blank=True)  # flexible payload (url, html, etc.)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.lesson.title} ({self.get_type_display()})"


# ----------------------------------------------------------------------
# Assessment – optional quiz attached to a lesson.
# ----------------------------------------------------------------------
class Assessment(models.Model):
    lesson = models.OneToOneField(
        Lesson,
        on_delete=models.CASCADE,
        related_name="course_assessment",
    )
    title = models.CharField(max_length=250)
    description = models.TextField(blank=True)
    passing_score = models.FloatField(default=0.7)  # 0‑1

    def __str__(self):
        return f"Assessment for {self.lesson.title}"


class Question(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name="questions")
    prompt = models.TextField()
    options = models.JSONField(default=list, blank=True)  # MCQ options
    correct_answer = models.CharField(max_length=500, blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"Q{self.order}: {self.prompt[:30]}…"
