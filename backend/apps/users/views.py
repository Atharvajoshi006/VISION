# backend/apps/users/views.py
from rest_framework import viewsets, mixins, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import User
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer


# ----------------------------------------------------------------------
# Register (public)
# ----------------------------------------------------------------------
class RegisterViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = RegisterSerializer
    permission_classes = (AllowAny,)


# ----------------------------------------------------------------------
# Login – returns JWT pair
# ----------------------------------------------------------------------
class LoginViewSet(viewsets.GenericViewSet):
    serializer_class = LoginSerializer
    permission_classes = (AllowAny,)

    @action(detail=False, methods=["POST"])
    def obtain_token(self, request):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.validated_data["user"]
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data,
            }
        )


# ----------------------------------------------------------------------
# “Me” endpoint – returns the currently‑authenticated user
# ----------------------------------------------------------------------
class MeViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    GET /api/users/me/
    PATCH /api/users/me/
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    # drf‑yasg expects a ``queryset`` attribute; a dummy one is enough.
    queryset = User.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return User.objects.none()
        return User.objects.filter(pk=self.request.user.pk)

    # The object we always return is the logged‑in user.
    def get_object(self):
        return self.request.user

    @action(detail=False, methods=["POST"])
    def change_password(self, request):
        old = request.data.get("old_password")
        new = request.data.get("new_password")
        if not request.user.check_password(old):
            return Response(
                {"old_password": ["Wrong password."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.user.set_password(new)
        request.user.save()
        return Response({"detail": "Password changed successfully."})
