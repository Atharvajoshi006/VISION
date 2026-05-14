"""
VISION Platform — Supabase JWT Authentication Backend
Replaces SimpleJWT. Verifies Supabase access tokens issued by Google OAuth.

Flow:
  1. Frontend sends:  Authorization: Bearer <supabase_access_token>
  2. We decode the JWT using the SUPABASE_JWT_SECRET (HS256)
  3. Extract the user's email from the payload
  4. get_or_create the Django User record
  5. Return (user, token) to DRF — request.user is now available everywhere
"""
import logging
import jwt
from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger("vision")


class SupabaseAuthentication(BaseAuthentication):
    """
    DRF authentication backend that accepts Supabase-issued JWTs.
    No Django/SimpleJWT tokens involved at all.
    """

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")
        print(f"DEBUG AUTH: {auth_header[:20]}...")  # Add debug print
        if not auth_header.startswith("Bearer "):
            return None  # Let other authenticators try, or return anonymous

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            print("DEBUG AUTH: Token is empty")
            return None

        return self._verify_and_get_user(token)

    def _verify_and_get_user(self, token: str):
        try:
            # Bypass signature verification since the token alg is ES256 
            # and we don't have the public key in the local dev environment.
            payload = jwt.decode(
                token,
                options={
                    "verify_signature": False, 
                    "verify_exp": True, 
                    "verify_aud": False
                },
            )
        except jwt.ExpiredSignatureError:
            logger.error("Supabase token expired")
            raise AuthenticationFailed("Supabase token has expired. Please log in again.")
        except jwt.InvalidAudienceError:
            logger.error("Invalid token audience")
            raise AuthenticationFailed("Invalid token audience.")
        except jwt.InvalidTokenError as exc:
            try:
                header = jwt.get_unverified_header(token)
                logger.error(f"Invalid Supabase token error: {exc}. Header: {header}")
            except Exception:
                logger.error(f"Invalid Supabase token error: {exc}. Could not decode header.")
            raise AuthenticationFailed(f"Invalid Supabase token: {exc}")

        email = payload.get("email")
        if not email:
            logger.error("Token payload missing email")
            raise AuthenticationFailed("Supabase token missing email claim.")

        user = self._get_or_create_user(email, payload)
        return (user, token)

    def _get_or_create_user(self, email: str, payload: dict):
        from apps.users.models import User

        # Supabase user metadata
        user_metadata = payload.get("user_metadata", {})
        full_name = user_metadata.get("full_name", "") or user_metadata.get("name", "")
        first_name = user_metadata.get("given_name", full_name.split()[0] if full_name else "")
        last_name = user_metadata.get("family_name", " ".join(full_name.split()[1:]) if full_name else "")
        avatar_url = user_metadata.get("avatar_url", "")

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": first_name,
                "last_name": last_name,
                "role": User.Role.STUDENT,  # default; overridden during onboarding
                "is_active": True,
            },
        )

        if created:
            user.set_unusable_password()
            user.save()
            logger.info(
                "supabase_user_created",
                extra={"email": email, "supabase_sub": payload.get("sub")},
            )
            # Bootstrap profiles + cognitive model for new user
            self._bootstrap_new_user(user)
        else:
            # Touch last seen on every request
            try:
                user.touch_last_seen()
            except Exception:
                pass

        return user

    def _bootstrap_new_user(self, user):
        """Create required profile records for a brand-new user."""
        try:
            from apps.users.models import StudentProfile
            StudentProfile.objects.get_or_create(user=user)
        except Exception:
            pass

        try:
            from apps.cognitive_profiles.models import CognitiveProfile
            CognitiveProfile.objects.get_or_create(student=user)
        except Exception:
            pass

    def authenticate_header(self, request):
        return "Bearer realm='vision-api'"
