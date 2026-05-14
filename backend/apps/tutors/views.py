"""
Vision AI — Tutors App Views
"""
from rest_framework import serializers as drf_serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tutors.models import TutorProfile
from core.permissions import IsTutor, IsAdmin


class TutorProfileSerializer(drf_serializers.ModelSerializer):
    email = drf_serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = TutorProfile
        fields = [
            "id", "email", "display_name", "avatar_url", "bio",
            "subject_expertise", "is_verified",
            "total_videos_uploaded", "total_courses_created",
            "average_content_engagement_score",
        ]
        read_only_fields = ["id", "email", "is_verified",
                            "total_videos_uploaded", "total_courses_created",
                            "average_content_engagement_score"]


class MyTutorProfileView(APIView):
    """GET/PATCH /api/v1/tutors/me/"""
    permission_classes = [IsTutor]

    def get(self, request):
        return Response(TutorProfileSerializer(request.user.tutor_profile).data)

    def patch(self, request):
        serializer = TutorProfileSerializer(
            request.user.tutor_profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class TutorPublicProfileView(APIView):
    """GET /api/v1/tutors/{id}/ — public tutor profile for students"""

    def get(self, request, pk):
        try:
            tutor = TutorProfile.objects.select_related("user").get(pk=pk, is_verified=True)
        except TutorProfile.DoesNotExist:
            return Response({"error": "Tutor not found."}, status=404)
        return Response(TutorProfileSerializer(tutor).data)
