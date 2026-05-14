"""
Vision AI — Wait for DB Script
Polls until PostgreSQL is ready before starting the application.
"""
import os
import sys
import time

import psycopg2


def wait_for_db(max_retries: int = 30, delay: int = 2):
    db_config = {
        "dbname": os.environ.get("DB_NAME", "vision_dev"),
        "user": os.environ.get("DB_USER", "postgres"),
        "password": os.environ.get("DB_PASSWORD", "postgres"),
        "host": os.environ.get("DB_HOST", "localhost"),
        "port": os.environ.get("DB_PORT", "5432"),
    }
    for attempt in range(1, max_retries + 1):
        try:
            conn = psycopg2.connect(**db_config)
            conn.close()
            print(f"✅ Database is ready (attempt {attempt})")
            return
        except psycopg2.OperationalError:
            print(f"⏳ Database not ready (attempt {attempt}/{max_retries}) — retrying in {delay}s...")
            time.sleep(delay)
    print("❌ Database did not become ready in time.")
    sys.exit(1)


if __name__ == "__main__":
    wait_for_db()
