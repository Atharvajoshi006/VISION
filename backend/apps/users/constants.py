"""
Vision AI — User Role Constants
Centralised to avoid magic strings throughout the codebase.
"""
from django.db.models import TextChoices


class UserRole(TextChoices):
    STUDENT = "student", "Student"
    TUTOR = "tutor", "Tutor"
    ADMIN = "admin", "Admin"
