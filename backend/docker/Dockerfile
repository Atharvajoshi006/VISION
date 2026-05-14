FROM python:3.11-slim AS builder

# ---- Build stage -------------------------------------------------------
ENV PYTHONDONTWRITEBYTECODE=1     PYTHONUNBUFFERED=1

# System dependencies needed for building wheels
RUN apt-get update && apt-get install -y --no-install-recommends         gcc         libpq-dev         build-essential     && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install pip dependencies (unified requirements)
COPY requirements/base.txt .
RUN pip install --upgrade pip &&     pip install --no-cache-dir -r base.txt

# ---- Runtime stage ------------------------------------------------------
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1     PYTHONUNBUFFERED=1

# Runtime libs (PostgreSQL client)
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 &&     rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the compiled environment from the builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY . /app

# Non‑root user for security
RUN addgroup --system django && adduser --system --ingroup django django
USER django

# Gunicorn entrypoint (production)
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
