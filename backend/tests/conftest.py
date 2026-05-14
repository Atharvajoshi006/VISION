import os
import pytest
from django.conf import settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

@pytest.fixture(scope="session")
def django_db_setup():
    # Ensure the test DB is created with the same settings
    settings.DATABASES["default"]["NAME"] = "test_oblivion_db"
