"""
VISION Platform — User Models
Custom User model with role-based system.
"""
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils.timezone import now
from core.models import TimeStampedModel


class UserManager(BaseUserManager):
    """Custom manager for Vision User."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email address is required.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.ADMIN)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """
    Vision User — supports Student, Tutor, Admin roles.
    Uses email as the primary identifier.
    """

    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        TUTOR = "tutor", "Tutor"
        ADMIN = "admin", "Admin"

    # Identity
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
        db_index=True,
    )

    # Status
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)

    # Profile
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    bio = models.TextField(blank=True, default="")
    timezone = models.CharField(max_length=50, default="UTC")

    # Metadata
    date_joined = models.DateTimeField(default=now)
    last_seen = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name", "role"]

    objects = UserManager()

    class Meta:
        db_table = "vision_users"
        indexes = [
            models.Index(fields=["role", "is_active"]),
            models.Index(fields=["email", "is_active"]),
        ]

    def __str__(self):
        return f"{self.full_name} <{self.email}> [{self.role}]"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def is_student(self):
        return self.role == self.Role.STUDENT

    def is_tutor(self):
        return self.role == self.Role.TUTOR

    def is_admin_user(self):
        return self.role == self.Role.ADMIN or self.is_staff

    def touch_last_seen(self):
        """Update last_seen timestamp without saving full model."""
        User.objects.filter(pk=self.pk).update(last_seen=now())


class StudentProfile(TimeStampedModel):
    """
    Extended profile for students.
    Stores learning preferences and metadata.
    """
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="student_profile"
    )
    learning_style = models.CharField(
        max_length=20,
        choices=[
            ("visual", "Visual"),
            ("theoretical", "Theoretical"),
            ("mixed", "Mixed"),
        ],
        default="mixed",
    )
    academic_level = models.CharField(max_length=100, blank=True)
    disciplines = models.JSONField(default=list)
    learning_intensity = models.CharField(max_length=50, default="Standard")
    target_completion_date = models.DateField(null=True, blank=True)
    enrolled_courses_count = models.PositiveIntegerField(default=0)
    total_study_hours = models.FloatField(default=0.0)
    streak_days = models.PositiveIntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "vision_student_profiles"

    def __str__(self):
        return f"StudentProfile({self.user.email})"


class TutorProfile(TimeStampedModel):
    """Extended profile for tutors."""
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="tutor_profile"
    )
    expertise_areas = models.JSONField(default=list)
    qualifications = models.TextField(blank=True)
    courses_created = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)

    class Meta:
        db_table = "vision_tutor_profiles"

    def __str__(self):
        return f"TutorProfile({self.user.email})"


class PasswordResetToken(TimeStampedModel):
    """Password reset tokens with expiry."""
    import uuid as uuid_lib
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reset_tokens")
    token = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = "vision_password_reset_tokens"

    @property
    def is_expired(self):
        return now() > self.expires_at
