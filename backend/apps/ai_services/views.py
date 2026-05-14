"""
VISION Platform — AI Services Views & URLs
"""
import logging
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import UserRateThrottle

from apps.ai_services.gemini_client import gemini_client
from apps.ai_services.prompts import build_explanation_prompt, build_hint_prompt
from apps.cognitive_profiles.models import CognitiveProfile
from apps.courses.models import Concept, QuizQuestion

logger = logging.getLogger("vision.ai")

class AIGenerationThrottle(UserRateThrottle):
    """Strict rate limiting for AI generation to control costs."""
    scope = "ai_generation"


class GenerateExplanationView(APIView):
    """
    POST /api/v1/ai/explain/
    Generates a personalized explanation of a concept.
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AIGenerationThrottle]

    def post(self, request):
        concept_id = request.data.get("concept_id")
        difficulty_adjustment = request.data.get("difficulty_adjustment", 0)

        if not concept_id:
            return Response({"error": "concept_id required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            concept = Concept.objects.get(id=concept_id)
        except Concept.DoesNotExist:
            return Response({"error": "Concept not found"}, status=status.HTTP_404_NOT_FOUND)

        # Build context from cognitive profile
        try:
            profile = CognitiveProfile.objects.get(student=request.user)
            profile_dict = profile.to_feature_vector()
            # Map back to dict for prompt builder (simplified here for brevity)
            profile_context = {
                "visual_tendency": profile.visual_tendency,
                "abstraction_handling": profile.abstraction_handling,
            }
        except CognitiveProfile.DoesNotExist:
            profile_context = {}

        prompt = build_explanation_prompt(
            concept.name,
            profile_context,
            difficulty_adjustment
        )

        try:
            # Use concept_id, user_id, and difficulty as cache key to reuse similar explanations
            text = gemini_client.generate_with_cache_key(
                prompt,
                str(concept.id),
                str(request.user.id),
                difficulty_adjustment
            )
            return Response({"success": True, "explanation": text})
        except Exception as exc:
            return Response(
                {"error": "Failed to generate explanation. AI service unavailable."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )


class GenerateHintView(APIView):
    """
    POST /api/v1/ai/hint/
    Generates a contextual hint for a specific question.
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AIGenerationThrottle]

    def post(self, request):
        question_id = request.data.get("question_id")
        attempt_history = request.data.get("attempt_history", [])

        if not question_id:
            return Response({"error": "question_id required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            question = QuizQuestion.objects.select_related("quiz__concept").get(id=question_id)
        except QuizQuestion.DoesNotExist:
            return Response({"error": "Question not found"}, status=status.HTTP_404_NOT_FOUND)

        concept_name = question.quiz.concept.name if question.quiz.concept else "General"
        prompt = build_hint_prompt(question.text, concept_name, attempt_history)

        try:
            # Do not cache hints across different attempt histories
            text = gemini_client.generate(prompt)
            return Response({"success": True, "hint": text})
        except Exception as exc:
            return Response(
                {"error": "Failed to generate hint."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
