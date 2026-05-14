import uuid
from datetime import datetime
from django.utils import timezone


def now_utc() -> datetime:
    """Timezone‑aware UTC now."""
    return timezone.now()


def generate_uuid() -> str:
    """Return a UUID4 string – useful for public identifiers."""
    return str(uuid.uuid4())
