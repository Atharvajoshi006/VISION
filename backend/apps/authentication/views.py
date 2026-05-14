"""
VISION Platform — Authentication Views
Auth is handled entirely by Supabase Google OAuth + SupabaseAuthentication backend.
This file is kept minimal — no JWT token generation/management needed.
"""
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

logger = logging.getLogger("vision")


class AuthStatusView(APIView):
    """
    GET /api/v1/auth/status/
    Returns the currently authenticated user's basic info.
    Used by the frontend to verify the Supabase token works.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "success": True,
            "data": {
                "id": str(user.id),
                "email": user.email,
                "name": user.get_full_name() or user.email,
                "role": user.role,
                "is_active": user.is_active,
            }
        })
