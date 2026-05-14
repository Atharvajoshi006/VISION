"""
VISION Platform — Course Serializers
"""
from rest_framework import serializers
from apps.courses.models import (
    Concept, ConceptPrerequisite, Course, Lesson,
    Enrollment, LessonProgress, Quiz, QuizQuestion,
    QuizAttempt, Project,
)


class ConceptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Concept
        fields = ["id", "name", "slug", "description", "domain", "difficulty_level"]


class ConceptPrerequisiteSerializer(serializers.ModelSerializer):
    prerequisite_name = serializers.CharField(source="prerequisite.name", read_only=True)
    concept_name = serializers.CharField(source="concept.name", read_only=True)

    class Meta:
        model = ConceptPrerequisite
        fields = ["id", "concept", "concept_name", "prerequisite", "prerequisite_name", "strength"]


class LessonSerializer(serializers.ModelSerializer):
    concepts = ConceptSerializer(many=True, read_only=True)
    concept_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Concept.objects.all(), source="concepts", write_only=True
    )

    class Meta:
        model = Lesson
        fields = [
            "id", "course", "title", "description", "order",
            "lesson_type", "video_url", "video_duration_seconds",
            "content", "concepts", "concept_ids", "is_published",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CourseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for course listing."""
    tutor_name = serializers.CharField(source="tutor.full_name", read_only=True)
    lesson_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id", "title", "slug", "description", "difficulty",
            "tutor_name", "enrolled_count", "lesson_count",
            "estimated_hours", "is_published", "tags", "created_at",
        ]

    def get_lesson_count(self, obj):
        return obj.lessons.filter(is_published=True).count()


class CourseDetailSerializer(serializers.ModelSerializer):
    """Full course detail with lessons and concepts."""
    tutor_name = serializers.CharField(source="tutor.full_name", read_only=True)
    lessons = LessonSerializer(many=True, read_only=True)
    concepts = ConceptSerializer(many=True, read_only=True)
    concept_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Concept.objects.all(), source="concepts", write_only=True
    )

    class Meta:
        model = Course
        fields = [
            "id", "tutor", "tutor_name", "title", "slug", "description",
            "thumbnail", "difficulty", "is_published", "enrolled_count",
            "concepts", "concept_ids", "lessons", "estimated_hours",
            "tags", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "tutor", "enrolled_count", "created_at", "updated_at"]


class EnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "id", "course", "course_title", "enrolled_at",
            "completed_at", "progress_percentage", "is_active",
        ]
        read_only_fields = ["id", "enrolled_at", "progress_percentage"]


class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = [
            "id", "quiz", "question_text", "question_type",
            "options", "correct_answer", "explanation",
            "difficulty", "concept",
        ]
        extra_kwargs = {
            "correct_answer": {"write_only": True},  # don't expose answers to students
        }


class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            "id", "lesson", "course", "title", "concept",
            "difficulty", "time_limit_minutes", "passing_score",
            "is_adaptive", "questions", "question_count", "created_at",
        ]

    def get_question_count(self, obj):
        return obj.questions.count()


class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = [
            "id", "quiz", "student", "started_at", "completed_at",
            "score", "time_taken_seconds", "answers", "passed", "attempt_number",
        ]
        read_only_fields = ["id", "student", "started_at", "passed", "attempt_number"]


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id", "course", "title", "description", "concepts",
            "difficulty", "estimated_hours", "deadline_days",
            "is_ai_generated", "created_at",
        ]
