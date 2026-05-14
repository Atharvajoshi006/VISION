"""
VISION Platform — Course Management Models
Courses, Lessons, Concepts, Prerequisites, Quizzes, Projects.
"""
from django.db import models
from django.conf import settings
from core.models import VisionBaseModel, SoftDeleteModel


class Concept(VisionBaseModel):
    """
    A discrete learning concept (e.g., 'Recursion', 'Binary Trees').
    Concepts are the atomic units of the knowledge graph.
    """
    name = models.CharField(max_length=200, unique=True, db_index=True)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    domain = models.CharField(max_length=100, db_index=True)  # e.g., "Computer Science"
    difficulty_level = models.PositiveSmallIntegerField(default=1)  # 1-10

    class Meta:
        db_table = "vision_concepts"
        ordering = ["domain", "name"]

    def __str__(self):
        return f"{self.name} ({self.domain})"


class ConceptPrerequisite(VisionBaseModel):
    """
    Directed prerequisite edge: concept requires prerequisite.
    Algebra → Functions → Recursion
    """
    concept = models.ForeignKey(
        Concept, on_delete=models.CASCADE, related_name="prerequisites"
    )
    prerequisite = models.ForeignKey(
        Concept, on_delete=models.CASCADE, related_name="is_prerequisite_for"
    )
    strength = models.FloatField(default=1.0)  # 0-1, how strongly required

    class Meta:
        db_table = "vision_concept_prerequisites"
        unique_together = ("concept", "prerequisite")

    def __str__(self):
        return f"{self.prerequisite.name} → {self.concept.name}"


class Course(SoftDeleteModel):
    """A course created by a tutor."""
    tutor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_courses",
    )
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=300, unique=True)
    description = models.TextField()
    thumbnail = models.ImageField(upload_to="courses/thumbnails/", null=True, blank=True)
    difficulty = models.CharField(
        max_length=20,
        choices=[
            ("beginner", "Beginner"),
            ("intermediate", "Intermediate"),
            ("advanced", "Advanced"),
        ],
        default="beginner",
    )
    is_published = models.BooleanField(default=False)
    enrolled_count = models.PositiveIntegerField(default=0)
    concepts = models.ManyToManyField(Concept, blank=True, related_name="courses")
    estimated_hours = models.FloatField(default=0.0)
    tags = models.JSONField(default=list)

    class Meta:
        db_table = "vision_courses"
        indexes = [
            models.Index(fields=["tutor", "is_published"]),
            models.Index(fields=["difficulty", "is_published"]),
        ]

    def __str__(self):
        return self.title


class Lesson(VisionBaseModel):
    """A lesson within a course."""
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    lesson_type = models.CharField(
        max_length=20,
        choices=[
            ("video", "Video"),
            ("text", "Text"),
            ("interactive", "Interactive"),
            ("quiz", "Quiz"),
        ],
        default="video",
    )
    video_url = models.URLField(blank=True)
    video_duration_seconds = models.PositiveIntegerField(default=0)
    content = models.TextField(blank=True)
    concepts = models.ManyToManyField(Concept, blank=True, related_name="lessons")
    is_published = models.BooleanField(default=False)

    class Meta:
        db_table = "vision_lessons"
        ordering = ["course", "order"]
        indexes = [
            models.Index(fields=["course", "order"]),
        ]

    def __str__(self):
        return f"{self.course.title} — Lesson {self.order}: {self.title}"


class Enrollment(VisionBaseModel):
    """Student enrollment in a course."""
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    progress_percentage = models.FloatField(default=0.0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "vision_enrollments"
        unique_together = ("student", "course")
        indexes = [
            models.Index(fields=["student", "is_active"]),
            models.Index(fields=["course", "is_active"]),
        ]

    def __str__(self):
        return f"{self.student.email} → {self.course.title}"


class LessonProgress(VisionBaseModel):
    """Tracks per-lesson completion for a student."""
    enrollment = models.ForeignKey(
        Enrollment, on_delete=models.CASCADE, related_name="lesson_progress"
    )
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="progress_records")
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    watch_time_seconds = models.PositiveIntegerField(default=0)
    completion_percentage = models.FloatField(default=0.0)
    is_completed = models.BooleanField(default=False)

    class Meta:
        db_table = "vision_lesson_progress"
        unique_together = ("enrollment", "lesson")


class Quiz(VisionBaseModel):
    """A quiz associated with a lesson or course."""
    lesson = models.ForeignKey(
        Lesson, on_delete=models.CASCADE, related_name="quizzes", null=True, blank=True
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="quizzes", null=True, blank=True
    )
    title = models.CharField(max_length=300)
    concept = models.ForeignKey(
        Concept, on_delete=models.SET_NULL, null=True, blank=True, related_name="quizzes"
    )
    difficulty = models.PositiveSmallIntegerField(default=5)  # 1-10 adaptive difficulty
    time_limit_minutes = models.PositiveSmallIntegerField(default=15)
    passing_score = models.FloatField(default=0.7)  # 70%
    is_adaptive = models.BooleanField(default=True)  # AI-generated

    class Meta:
        db_table = "vision_quizzes"


class QuizQuestion(VisionBaseModel):
    """Individual question within a quiz."""
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    question_text = models.TextField()
    question_type = models.CharField(
        max_length=20,
        choices=[
            ("mcq", "Multiple Choice"),
            ("true_false", "True/False"),
            ("short_answer", "Short Answer"),
        ],
        default="mcq",
    )
    options = models.JSONField(default=list)
    correct_answer = models.TextField()
    explanation = models.TextField(blank=True)
    difficulty = models.PositiveSmallIntegerField(default=5)
    concept = models.ForeignKey(
        Concept, on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        db_table = "vision_quiz_questions"


class QuizAttempt(VisionBaseModel):
    """A student's attempt at a quiz."""
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quiz_attempts",
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.FloatField(null=True, blank=True)
    time_taken_seconds = models.PositiveIntegerField(default=0)
    answers = models.JSONField(default=dict)
    passed = models.BooleanField(default=False)
    attempt_number = models.PositiveSmallIntegerField(default=1)

    class Meta:
        db_table = "vision_quiz_attempts"
        indexes = [
            models.Index(fields=["student", "quiz"]),
            models.Index(fields=["student", "created_at"]),
        ]


class Project(VisionBaseModel):
    """A project/assignment in a course."""
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="projects")
    title = models.CharField(max_length=300)
    description = models.TextField()
    concepts = models.ManyToManyField(Concept, blank=True)
    difficulty = models.PositiveSmallIntegerField(default=5)
    estimated_hours = models.FloatField(default=2.0)
    deadline_days = models.PositiveSmallIntegerField(default=7)
    is_ai_generated = models.BooleanField(default=False)

    class Meta:
        db_table = "vision_projects"
