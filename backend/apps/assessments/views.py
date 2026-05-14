"""
Vision AI — Assessments Views
"""
from rest_framework import serializers as drf_serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from apps.assessments.models import Assessment, Question, QuizAttempt
from core.permissions import IsStudent


class QuestionSerializer(drf_serializers.ModelSerializer):
    # Strip is_correct from options — sent only after submission
    options_display = drf_serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ["id", "question_text", "question_type", "options_display",
                  "difficulty_score", "order_index"]

    def get_options_display(self, obj):
        """Return options without revealing which is correct."""
        return [{"index": i, "text": o["text"]} for i, o in enumerate(obj.options)]


class AssessmentDetailSerializer(drf_serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Assessment
        fields = ["id", "title", "passing_score_percent",
                  "time_limit_minutes", "max_attempts", "questions"]


class QuizAttemptSubmitSerializer(drf_serializers.Serializer):
    answers = drf_serializers.DictField(
        child=drf_serializers.IntegerField(),
        help_text='{"question_id": selected_option_index}',
    )
    time_taken_seconds = drf_serializers.IntegerField(min_value=0)
    started_at = drf_serializers.DateTimeField()


class AssessmentDetailView(APIView):
    """GET /api/v1/assessments/{id}/"""
    permission_classes = [IsStudent]

    def get(self, request, pk):
        try:
            assessment = Assessment.objects.prefetch_related("questions").get(pk=pk)
        except Assessment.DoesNotExist:
            return Response({"error": "Assessment not found."}, status=404)
        return Response(AssessmentDetailSerializer(assessment).data)


class QuizAttemptView(APIView):
    """POST /api/v1/assessments/{id}/attempt/ — submit a quiz attempt"""
    permission_classes = [IsStudent]

    def post(self, request, pk):
        try:
            assessment = Assessment.objects.prefetch_related("questions").get(pk=pk)
        except Assessment.DoesNotExist:
            return Response({"error": "Assessment not found."}, status=404)

        student = request.user.student_profile

        # Check attempt limit
        attempt_count = QuizAttempt.objects.filter(
            student=student, assessment=assessment
        ).count()
        if attempt_count >= assessment.max_attempts:
            return Response(
                {"error": f"Maximum {assessment.max_attempts} attempts reached."},
                status=400,
            )

        serializer = QuizAttemptSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Grade the attempt
        score, is_passed = self._grade(assessment, data["answers"])

        attempt = QuizAttempt.objects.create(
            student=student,
            assessment=assessment,
            attempt_number=attempt_count + 1,
            score_percent=score,
            is_passed=is_passed,
            answers_json=data["answers"],
            time_taken_seconds=data["time_taken_seconds"],
            started_at=data["started_at"],
            completed_at=timezone.now(),
        )

        # Update LessonProgress
        self._update_lesson_progress(student, assessment, score, is_passed)

        return Response({
            "attempt_id": str(attempt.id),
            "score_percent": score,
            "is_passed": is_passed,
            "passing_score": assessment.passing_score_percent,
            "attempt_number": attempt.attempt_number,
        })

    def _grade(self, assessment, answers: dict) -> tuple[float, bool]:
        """Score the quiz based on correct answers."""
        questions = {str(q.id): q for q in assessment.questions.all()}
        correct = 0
        total = len(questions)
        for qid, selected_index in answers.items():
            q = questions.get(qid)
            if q and 0 <= selected_index < len(q.options):
                if q.options[selected_index].get("is_correct"):
                    correct += 1
        score = round((correct / total) * 100, 1) if total > 0 else 0.0
        is_passed = score >= assessment.passing_score_percent
        return score, is_passed

    def _update_lesson_progress(self, student, assessment, score, is_passed):
        from apps.progress_tracking.models import LessonProgress
        LessonProgress.objects.filter(
            student=student, lesson=assessment.lesson
        ).update(
            quiz_passed=is_passed,
            quiz_best_score=score,
            quiz_attempts=drf_serializers.IntegerField().to_internal_value(
                QuizAttempt.objects.filter(
                    student=student, assessment=assessment
                ).count()
            ),
        )
