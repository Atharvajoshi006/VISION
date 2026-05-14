#!/bin/sh
# Vision AI — Docker Entrypoint Script
# Waits for DB, runs migrations, then starts the application.
set -e

echo "⏳ Waiting for database..."
python scripts/wait_for_db.py

echo "📦 Running migrations..."
python manage.py migrate --noinput

echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "🚀 Starting application..."
exec "$@"
