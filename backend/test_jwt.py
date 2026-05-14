import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

import jwt
from django.conf import settings

# This is the anon key from the frontend
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprYWttZGZudW5sZnl3c3hidHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTI2NTIsImV4cCI6MjA5NDMyODY1Mn0.iphCuk36Eeh9KZy83yFgXiIBubQcozJRgF7_nEtzQ-4"
secret = settings.SUPABASE_JWT_SECRET

print(f"Secret used: {secret}")

try:
    payload = jwt.decode(
        token,
        secret,
        algorithms=["HS256"],
        options={"verify_exp": False, "verify_aud": False},
    )
    print("Success:", payload)
except Exception as e:
    print("Error:", type(e), e)
