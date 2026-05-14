from rest_framework import serializers
from .models import Course, Module, Lesson, Content, Skill, Assessment, Question


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ("id", "name", "description", "parent", "weight")


class ContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Content
        fields = ("id", "type", "order", "data")


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ("id", "prompt", "options", "correct_answer", "order")


class AssessmentSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Assessment
        fields = ("id", "title", "description", "passing_score", "questions")


class LessonSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True, read_only=True)
    contents = ContentSerializer(many=True, read_only=True)
    assessment = AssessmentSerializer(read_only=True)

    class Meta:
        model = Lesson
        fields = (
            "id",
            "title",
            "overview",
            "order",
            "estimated_duration",
            "is_published",
            "skills",
            "contents",
            "assessment",
        )


class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ("id", "title", "description", "order", "lessons")


class CourseSerializer(serializers.ModelSerializer):
    modules = ModuleSerializer(many=True, read_only=True)
    skills = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = (
            "id",
            "title",
            "description",
            "thumbnail",
            "is_active",
            "tags",
            "skills",
            "modules",
            "created_at",
            "updated_at",
        )
