"""
Vision AI — Learning Profiles Admin
"""
from django.contrib import admin
from apps.learning_profiles.models import LearningProfile, LearningProfileSnapshot


@admin.register(LearningProfile)
class LearningProfileAdmin(admin.ModelAdmin):
    list_display = ["student", "retention_score", "engagement_score",
                    "learning_speed_score", "difficulty_tolerance",
                    "confidence_level", "data_points_count", "last_updated_at"]
    list_filter = ["preferred_learning_style"]
    search_fields = ["student__user__email"]
    readonly_fields = [f.name for f in LearningProfile._meta.fields]
    ordering = ["-last_updated_at"]
