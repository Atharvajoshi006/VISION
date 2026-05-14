from __future__ import annotations

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Manager that creates users using e‑mail as the unique identifier."""

    def _create_user(self, email: str, password: str, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, username=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str = None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True or extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_staff=True and is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    A **custom user model** that logs in with e‑mail.
    All extra profile fields live in ``StudentProfile`` (one‑to‑one).
    """
    email = models.EmailField("e‑mail address", unique=True)
    username = None  # we don’t use the default username field
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    timezone = models.CharField(max_length=50, default="UTC")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []          # e‑mail & password are required automatically

    objects = UserManager()

    def __str__(self) -> str:
        return self.email


class StudentProfile(models.Model):
    """
    Extension of ``User`` that stores preferences and the (future) skill‑matrix.
    """
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="profile"
    )
    # a free‑form JSON dict that a downstream service can fill
    skill_matrix = models.JSONField(default=dict, blank=True)
    prefers_video = models.BooleanField(default=True)
    prefers_text = models.BooleanField(default=False)

    class LearningStyle(models.TextChoices):
        VISUAL = "visual", "Visual"
        AUDITORY = "auditory", "Auditory"
        KINESTHETIC = "kinesthetic", "Kinesthetic"
        READING = "reading", "Reading/Writing"

    learning_style = models.CharField(
        max_length=20,
        choices=LearningStyle.choices,
        default=LearningStyle.VISUAL,
    )

    def __str__(self) -> str:
        return f"Profile({self.user.email})"
