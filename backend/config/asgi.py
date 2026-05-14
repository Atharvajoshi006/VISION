import os
import django
from urllib.parse import parse_qs

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.core.asgi import get_asgi_application
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken, TokenError

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

import apps.notifications.routing  # noqa: F401  (websocket routes)


class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]

        scope["user"] = AnonymousUser()
        if token:
            try:
                access = AccessToken(token)
                user = await database_sync_to_async(get_user_model().objects.get)(id=access["user_id"])
                scope["user"] = user
            except (TokenError, get_user_model().DoesNotExist):
                scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)


application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": TokenAuthMiddleware(URLRouter(apps.notifications.routing.websocket_urlpatterns)),
    }
)
