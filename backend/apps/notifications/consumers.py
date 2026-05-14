from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken, TokenError

from services.ai.openai_service import generate_explanation, generate_hint


class MentorConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        if self.scope.get("user") is None or self.scope["user"].is_anonymous:
            await self.close(code=4401)
            return

        await self.accept()
        await self.send_json(
            {
                "type": "welcome",
                "payload": {
                    "answer": "Mentor connection established. Ask a question or request a hint.",
                },
            }
        )

    async def receive_json(self, content, **kwargs):
        message_type = content.get("type")
        payload = content.get("payload", {})

        if message_type != "question":
            await self.send_json({"type": "error", "payload": {"answer": "Unsupported message type."}})
            return

        question = payload.get("question", "").strip()
        hint_request = payload.get("hint_request", False)

        if not question:
            await self.send_json(
                {"type": "error", "payload": {"answer": "Please include a question."}}
            )
            return

        try:
            if hint_request:
                answer_text = await generate_hint(
                    question,
                    "The learner is working through a lesson and needs a short nudge.",
                )
            else:
                answer_text = await generate_explanation(
                    question,
                    "The learner is asking for a friendly explanation of the lesson topic.",
                )
        except Exception:
            answer_text = (
                "I’m having trouble reaching the mentor service. "
                "Try again in a moment."
            )

        await self.send_json({"type": "answer", "payload": {"answer": answer_text}})

    async def disconnect(self, close_code):
        return None
