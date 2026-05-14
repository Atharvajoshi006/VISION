"""
Vision AI — Student Profile Model
Stores all student-specific data separate from the core User model.
This separation keeps the User model lean and allows the student profile
to evolve independently without touching the auth system.
"""

from django.db import models

from core.models import BaseModel


class LearningGoal(models.TextChoices):
    CAREER_CHANGE = "career_change", "Career Change"
    SKILL_UPGRADE = "skill_upgrade", "Skill Upgrade"
    ACADEMIC = "academic", "Academic Study"
    PERSONAL_INTEREST = "personal_interest", "Personal Interest"
    EXAM_PREP = "exam_prep", "Exam Preparation"


class StudentProfile(BaseModel):
    """
    Extended profile for students. 1:1 with User.

    Behavioral fields like learning_style_preference are seeded from
    onboarding and continuously updated by the Learning Profile Engine.
    """
    user = models.OneToOneField(
        "users.User",
        on_delete=models.CASCADE,
        related_name="student_profile",
        db_index=True,
    )
    display_name = models.CharField(max_length=150, blank=True)
    avatar_url = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True, max_length=500)

    # Onboarding
    learning_goal = models.CharField(
        max_length=30,
        choices=LearningGoal.choices,
        blank=True,
    )
    grade_level = models.CharField(max_length=50, blank=True)  # e.g. "Grade 10", "Undergraduate"
    subjects_of_interest = models.JSONField(
        blank=True,
        default=list,
    )

    # System-managed analytics fields (updated by Learning Profile Engine)
    total_watch_time_seconds = models.PositiveIntegerField(default=0)
    total_lessons_completed = models.PositiveIntegerField(default=0)
    total_quizzes_attempted = models.PositiveIntegerField(default=0)
    average_quiz_score = models.FloatField(default=0.0)
    streak_days = models.PositiveIntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)

    # Enrolled courses (M2M through enrollment model for metadata)
    enrolled_courses = models.ManyToManyField(
        "courses.Course",
        through="students.Enrollment",
        related_name="enrolled_students",
        blank=True,
    )

    class Meta:
        db_table = "students_studentprofile"
        verbose_name = "Student Profile"
        indexes = [
            models.Index(fields=["user"], name="idx_student_user"),
            models.Index(fields=["last_activity_date"], name="idx_student_activity"),
        ]

    def __str__(self):
        return f"StudentProfile({self.user.email})"


class Enrollment(BaseModel):
    """
    Through model for Student ↔ Course M2M.
    Stores enrollment metadata: when enrolled, completion state, progress %.
    """
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="enrollments")
    course = models.ForeignKey("courses.Course", on_delete=models.CASCADE, related_name="enrollments")
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completion_percentage = models.FloatField(default=0.0)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    certificate_issued = models.BooleanField(default=False)

    class Meta:
        db_table = "students_enrollment"
        unique_together = [("student", "course")]
        indexes = [
            models.Index(fields=["student", "is_completed"], name="idx_enrollment_completion"),
        ]

    def __str__(self):
        return f"{self.student.user.email} → {self.course.title}"
