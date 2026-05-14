"""
Vision AI — Students App Views
"""
from rest_framework import serializers as drf_serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.students.models import StudentProfile, Enrollment
from core.permissions import IsStudent, IsAdmin


class StudentProfileSerializer(drf_serializers.ModelSerializer):
    email = drf_serializers.EmailField(source="user.email", read_only=True)
    full_name = drf_serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            "id", "email", "full_name", "display_name", "avatar_url", "bio",
            "learning_goal", "grade_level", "subjects_of_interest",
            "total_watch_time_seconds", "total_lessons_completed",
            "average_quiz_score", "streak_days", "last_activity_date",
        ]
        read_only_fields = [
            "id", "email", "full_name", "total_watch_time_seconds",
            "total_lessons_completed", "average_quiz_score", "streak_days",
        ]


class MyStudentProfileView(APIView):
    """GET/PATCH /api/v1/students/me/"""
    permission_classes = [IsStudent]

    def get(self, request):
        return Response(StudentProfileSerializer(request.user.student_profile).data)

    def patch(self, request):
        serializer = StudentProfileSerializer(
            request.user.student_profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class EnrollCourseView(APIView):
    """POST /api/v1/students/enroll/{course_id}/"""
    permission_classes = [IsStudent]

    def post(self, request, course_id):
        from apps.courses.models import Course
        try:
            course = Course.objects.get(pk=course_id, is_published=True)
        except Course.DoesNotExist:
            return Response({"error": "Course not found."}, status=404)

        enrollment, created = Enrollment.objects.get_or_create(
            student=request.user.student_profile,
            course=course,
        )
        if not created:
            return Response({"message": "Already enrolled."}, status=200)

        return Response({"message": f"Successfully enrolled in '{course.title}'."}, status=201)
