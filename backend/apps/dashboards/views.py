"""
VISION Platform — Dashboard Aggregator Views
Provides unified payloads for frontend UI rendering to minimize network requests.
"""
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta

from apps.tracking.models import ConceptMastery, LearningSession
from apps.predictions.models import PredictionScore
from apps.recommendations.models import Recommendation
from apps.analytics.models import AnalyticsSnapshot
from apps.interventions.models import Intervention

class StudentDashboardOverviewView(APIView):
    """
    GET /api/v1/dashboards/student/
    Returns a complete snapshot of the student's current state:
    - Active interventions
    - Top recommendations
    - Current risk level
    - Today's engagement stats
    - Weakest concepts
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # 1. High priority active interventions
        interventions = Intervention.objects.filter(
            student=user,
            status="pending"
        ).order_by("-created_at")[:2].values(
            "id", "intervention_type", "title", "message", "action_url"
        )
        
        # 2. Top recommendations
        recs = Recommendation.objects.filter(
            student=user,
            is_active=True,
            is_dismissed=False
        ).order_by("priority", "-created_at")[:3].values(
            "id", "recommendation_type", "title", "description", 
            "target_concept_id", "target_concept_name"
        )
        
        # 3. Latest risk prediction
        try:
            pred = PredictionScore.objects.filter(student=user).latest("predicted_at")
            risk_data = {
                "level": pred.overall_risk_level,
                "failure_probability": pred.failure_probability,
                "pacing_mismatch": pred.pacing_mismatch_score,
            }
        except PredictionScore.DoesNotExist:
            risk_data = {"level": "low", "failure_probability": 0.0, "pacing_mismatch": 0.0}
            
        # 4. Today's stats
        today = timezone.now().date()
        try:
            snapshot = AnalyticsSnapshot.objects.get(student=user, snapshot_date=today)
            stats = {
                "study_time_minutes": snapshot.study_time_minutes,
                "events_count": snapshot.events_count,
                "engagement_score": snapshot.engagement_score,
            }
        except AnalyticsSnapshot.DoesNotExist:
            stats = {"study_time_minutes": 0, "events_count": 0, "engagement_score": 0.0}
            
        # 5. Weak concepts to review
        weak_concepts = ConceptMastery.objects.filter(
            student=user,
            mastery_score__lt=0.5
        ).order_by("mastery_score")[:3].values("concept_id", "concept_name", "mastery_score")

        return Response({
            "success": True,
            "data": {
                "interventions": list(interventions),
                "recommendations": list(recs),
                "risk_profile": risk_data,
                "today_stats": stats,
                "weak_concepts": list(weak_concepts),
            }
        })

class TutorDashboardOverviewView(APIView):
    """
    GET /api/v1/dashboards/tutor/
    Returns a unified view for tutors:
    - High risk students
    - Global weak concepts
    """
    permission_classes = [permissions.IsAuthenticated] # Assume IsTutor in real implementation

    def get(self, request):
        # In a real scenario, filter by courses the tutor teaches
        
        high_risk_students = PredictionScore.objects.filter(
            overall_risk_level__in=["high", "critical"]
        ).select_related("student").order_by("-failure_probability")[:10]
        
        risk_data = [
            {
                "student_id": pred.student.id,
                "student_name": f"{pred.student.first_name} {pred.student.last_name}",
                "student_email": pred.student.email,
                "risk_level": pred.overall_risk_level,
                "failure_probability": pred.failure_probability
            }
            for pred in high_risk_students
        ]
        
        return Response({
            "success": True,
            "data": {
                "high_risk_students": risk_data,
                # Additional tutor aggregates can go here
            }
        })
