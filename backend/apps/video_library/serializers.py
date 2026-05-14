"""
Vision AI — Video Library Serializers
"""
from rest_framework import serializers

from apps.video_library.models import Video, VideoTranscript


class VideoUploadSerializer(serializers.Serializer):
    """Input serializer for video upload."""
    file = serializers.FileField()
    title = serializers.CharField(max_length=300)
    description = serializers.CharField(max_length=2000, required=False, allow_blank=True)


class VideoSerializer(serializers.ModelSerializer):
    """Read serializer for processed video data."""
    is_ready = serializers.BooleanField(read_only=True)

    class Meta:
        model = Video
        fields = [
            "id", "title", "description", "storage_url", "duration_seconds",
            "topics", "ai_summary", "language", "processing_status",
            "is_ready", "created_at",
        ]
        read_only_fields = fields
