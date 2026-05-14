"""
Vision AI — Notifications Views
"""
from rest_framework import serializers as drf_serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.models import Notification
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone


class NotificationSerializer(drf_serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "notification_type", "title", "body",
                  "action_url", "is_read", "read_at", "created_at"]


class NotificationListView(APIView):
    """GET /api/v1/notifications/ — latest 20 unread notifications"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifs = Notification.objects.filter(
            user=request.user
        ).order_by("-created_at")[:20]
        unread_count = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()
        return Response({
            "unread_count": unread_count,
            "notifications": NotificationSerializer(notifs, many=True).data,
        })


class MarkNotificationReadView(APIView):
    """POST /api/v1/notifications/{id}/read/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        updated = Notification.objects.filter(
            pk=pk, user=request.user
        ).update(is_read=True, read_at=timezone.now())
        if updated:
            return Response({"message": "Marked as read."})
        return Response({"error": "Not found."}, status=404)


class MarkAllReadView(APIView):
    """POST /api/v1/notifications/mark-all-read/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        count = Notification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True, read_at=timezone.now())
        return Response({"marked_read": count})
