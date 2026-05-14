"""
VISION Platform — User Serializers
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from apps.users.models import User, StudentProfile, TutorProfile


class UserSerializer(serializers.ModelSerializer):
    """Read-only user representation."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "full_name",
            "role", "avatar", "bio", "timezone", "is_email_verified",
            "date_joined", "last_seen", "created_at",
        ]
        read_only_fields = ["id", "email", "role", "is_email_verified", "date_joined"]

    def get_full_name(self, obj):
        return obj.full_name


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = [
            "learning_style", "target_completion_date",
            "enrolled_courses_count", "total_study_hours",
            "streak_days", "last_activity_date",
        ]
        read_only_fields = ["enrolled_courses_count", "total_study_hours", "streak_days"]


class TutorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TutorProfile
        fields = [
            "expertise_areas", "qualifications",
            "courses_created", "is_verified",
        ]
        read_only_fields = ["courses_created", "is_verified"]


class UserDetailSerializer(UserSerializer):
    """Full user detail with nested profile."""
    student_profile = StudentProfileSerializer(read_only=True)
    tutor_profile = TutorProfileSerializer(read_only=True)

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["student_profile", "tutor_profile"]


class UserUpdateSerializer(serializers.ModelSerializer):
    """Update basic profile fields."""
    class Meta:
        model = User
        fields = ["first_name", "last_name", "bio", "timezone", "avatar"]


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
