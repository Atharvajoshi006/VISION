from rest_framework import serializers
from .models import LessonProgress, SkillMastery
from apps.courses.serializers import LessonSerializer, SkillSerializer


class LessonProgressSerializer(serializers.ModelSerializer):
    lesson = LessonSerializer(read_only=True)

    class Meta:
        model = LessonProgress
        fields = ("id", "lesson", "status", "completion_ratio", "last_accessed")


class SkillMasterySerializer(serializers.ModelSerializer):
    skill = SkillSerializer(read_only=True)

    class Meta:
        model = SkillMastery
        fields = ("id", "skill", "mastery", "updated_at")
