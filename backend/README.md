# Vision AI — Backend Architecture

> **AI-native adaptive learning platform** built around behavioral analytics, cognitive learning profiles, and personalized learning pathways.

---

## Core Philosophy

Vision is **not** a course platform or tutor marketplace.
Vision is a **student-centric personalization engine** where:

```
Student Behavior Events
        ↓
Analytics Engine  (EMA-based scoring)
        ↓
Learning Profile Engine  (cognitive fingerprint)
        ↓
Adaptive Recommendation Engine  (ChromaDB + rule-based)
        ↓
Personalized Learning Experience
```

Tutor-uploaded videos are **structured content inputs** to the personalization system — not the product itself.

---

## Quick Start (Development)

```bash
# 1. Clone and enter backend
cd Oblivion_VISION-AI/backend

# 2. Copy env file
cp .env.example .env
# Fill in OPENAI_API_KEY and adjust as needed

# 3. Start all services
docker compose -f docker/docker-compose.yml up --build

# 4. The following will be available:
#    Django API:    http://localhost:8000
#    API Docs:      http://localhost:8000/api/docs/
#    ChromaDB:      http://localhost:8001
#    Flower:        http://localhost:5555
```

---

## Folder Structure

```
backend/
├── config/                    # Django project settings
│   ├── settings/
│   │   ├── base.py            # Shared config (JWT, Celery, DRF, ChromaDB)
│   │   ├── development.py     # Local DB, debug toolbar, open CORS
│   │   └── production.py      # Supabase, HSTS, Sentry, HTTPS
│   ├── urls.py                # Root URL routing (/api/v1/...)
│   ├── celery.py              # Celery app + Beat schedule
│   ├── wsgi.py
│   └── asgi.py
│
├── apps/                      # Django applications (thin: models + views only)
│   ├── users/                 # Custom User model, JWT auth, RBAC
│   ├── students/              # Student profiles, enrollment
│   ├── tutors/                # Tutor profiles, verification
│   ├── courses/               # Course → Module → Lesson hierarchy
│   ├── video_library/         # Upload, state machine, transcripts
│   ├── analytics/             # ★ CORE: event ingestion, StudentAnalytics
│   ├── learning_profiles/     # ★ CORE: cognitive profile, topic mastery
│   ├── recommendations/       # Adaptive recommendation records
│   ├── assessments/           # AI-generated quizzes, attempt tracking
│   ├── progress_tracking/     # Lesson/module/course progress
│   ├── notifications/         # In-app notification system
│   └── moderation/            # Content flagging (Phase 2)
│
├── services/                  # ★ Business logic — pure Python, no Django coupling
│   ├── ai/
│   │   └── openai_service.py  # Quiz gen, summary, topic extraction (no chat)
│   ├── analytics/
│   │   ├── analytics_service.py   # EMA scoring computation
│   │   └── profile_service.py     # Learning profile engine
│   ├── embeddings/
│   │   └── chroma_service.py      # ChromaDB ingestion + semantic search
│   ├── recommendations/
│   │   └── recommendation_engine.py   # Rule-based + semantic search
│   └── storage/
│       └── s3_service.py          # S3/R2 abstraction layer
│
├── tasks/                     # Celery task modules
│   ├── video_processing.py    # 8-stage pipeline chain
│   ├── analytics_processing.py    # Event ingestion, profile updates
│   ├── recommendation_tasks.py    # Periodic recommendation generation
│   └── notification_tasks.py      # Email, alerts, digest
│
├── core/                      # Shared infrastructure
│   ├── models.py              # BaseModel (UUID + timestamps + soft-delete)
│   ├── permissions.py         # IsStudent, IsTutor, IsAdmin, IsOwner
│   ├── pagination.py          # Standard, cursor-based (analytics), large catalog
│   ├── exceptions.py          # Structured JSON error envelopes
│   ├── middleware.py          # Request logging (X-Request-ID), role injection
│   └── utils.py               # EMA, chunking, file validation, cache helpers
│
├── docker/
│   ├── Dockerfile             # Multi-stage production build (non-root user)
│   └── docker-compose.yml     # Full dev stack (7 services)
│
├── scripts/
│   ├── entrypoint.sh          # migrate → collectstatic → start
│   └── wait_for_db.py         # PostgreSQL readiness poll
│
├── requirements/
│   ├── base.txt               # Core dependencies
│   ├── development.txt        # + debug toolbar, pytest, factory-boy
│   └── production.txt         # + sentry, whitenoise
│
├── .env.example               # All environment variables documented
├── .gitignore
├── manage.py
└── pytest.ini
```

---

## API Reference

All endpoints are versioned under `/api/v1/`.
Full interactive docs: `http://localhost:8000/api/docs/`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register/student/` | None | Student registration |
| POST | `/auth/register/tutor/` | None | Tutor registration |
| POST | `/auth/login/` | None | JWT login (returns enriched token) |
| POST | `/auth/refresh/` | None | Refresh access token |
| POST | `/auth/logout/` | Bearer | Blacklist refresh token |
| GET/PATCH | `/auth/me/` | Bearer | Own user profile |
| GET | `/courses/` | Bearer | Course catalog (filtered, paginated) |
| GET | `/courses/{id}/` | Bearer | Course detail with modules/lessons |
| POST | `/courses/create/` | Tutor | Create a course |
| GET | `/students/me/` | Student | Student profile |
| POST | `/students/enroll/{course_id}/` | Student | Enroll in course |
| POST | `/videos/upload/` | Verified Tutor | Upload video (triggers pipeline) |
| GET | `/videos/{id}/status/` | Tutor | Poll processing status |
| POST | `/analytics/events/` | Student | Batch behavioral event ingest |
| GET | `/analytics/me/summary/` | Student | Aggregated analytics snapshot |
| GET | `/profiles/me/` | Student | Cognitive learning profile |
| GET | `/profiles/me/history/` | Student | Profile score trends (30 days) |
| GET | `/recommendations/me/` | Student | Active personalized recommendations |
| POST | `/recommendations/{id}/dismiss/` | Student | Dismiss a recommendation |
| GET | `/assessments/{id}/` | Student | Quiz (no correct answers exposed) |
| POST | `/assessments/{id}/attempt/` | Student | Submit quiz, get score |
| GET | `/progress/me/` | Student | All course progress |
| GET | `/progress/lessons/{id}/` | Student | Single lesson progress |
| GET | `/notifications/` | Bearer | Latest 20 notifications |
| POST | `/notifications/mark-all-read/` | Bearer | Mark all read |

---

## Behavioral Analytics Engine

### Event Ingestion Flow

```
Frontend → POST /api/v1/analytics/events/ (batch, max 50)
    ↓  (HTTP 202 — non-blocking)
Celery analytics worker
    ↓
bulk_create → LearningBehaviorEvent table (partitioned by month)
    ↓  (every 15 min via Beat)
AnalyticsComputationService.compute_and_update()
    ↓
StudentAnalytics updated (EMA-scored)
    ↓
LearningProfileService.update_profile()
    ↓
LearningProfile updated → weak/strong topics refreshed
    ↓  (every 30 min via Beat)
RecommendationEngine.generate()
    ↓
Recommendation records created → student notified
```

### Events Tracked

| Category | Events |
|----------|--------|
| Video | `VIDEO_START`, `VIDEO_PAUSE`, `VIDEO_RESUME`, `VIDEO_COMPLETE`, `VIDEO_REWATCH`, `VIDEO_SKIP`, `VIDEO_SEEK`, `VIDEO_SPEED_CHANGE` |
| Quiz | `QUIZ_START`, `QUIZ_SUBMIT`, `QUIZ_PASS`, `QUIZ_FAIL`, `QUIZ_RETRY` |
| Lesson | `LESSON_START`, `LESSON_COMPLETE`, `LESSON_ABANDON`, `LESSON_REVISIT` |
| Session | `SESSION_START`, `SESSION_END`, `INACTIVITY_DETECTED` |
| Engagement | `NOTE_TAKEN`, `BOOKMARK_ADDED`, `RECOMMENDATION_CLICKED`, `RECOMMENDATION_DISMISSED` |

---

## Learning Profile Scores

| Score | Formula | Drives |
|-------|---------|--------|
| `retention_score` | `0.4×pass_rate + 0.3×(1-retry_penalty) + 0.3×(1-rewatch_ratio)` | Revision recommendations |
| `engagement_score` | `0.4×completion_rate + 0.3×regularity + 0.3×quiz_participation` | Content difficulty selection |
| `learning_speed_score` | `estimated_duration / actual_time_spent` | Pacing adjustments |
| `difficulty_tolerance` | 75th percentile difficulty of passed lessons | Difficulty filtering |
| `mastery_scores` | Per-topic EMA of quiz pass rates | Weak topic identification |

All scores use **Exponential Moving Average** (α=0.3) for smooth, recency-weighted updates.

---

## Video Processing Pipeline

```
Upload → S3/R2
    ↓
validate_video_task        (file accessible, not corrupt)
    ↓
transcribe_video_task      (OpenAI Whisper)
    ↓
chunk_transcript_task      (512-word chunks, 64-word overlap)
    ↓
generate_embeddings_task   (sentence-transformers → ChromaDB)
    ↓
extract_topics_task        (OpenAI gpt-4o-mini → JSON array)
    ↓
generate_quiz_task         (OpenAI → MCQ JSON → Assessment + Questions)
    ↓
generate_summary_task      (OpenAI → 200-300 word summary)
    ↓
finalize_video_task        (status = COMPLETED, update tutor counters)
```

Each stage is an independent Celery task. Failures retry independently without re-running earlier stages.

---

## Celery Queue Architecture

| Queue | Workers | Tasks |
|-------|---------|-------|
| `analytics` | 4 | Event ingestion, profile updates, tutor analytics |
| `video_processing` | 2 | Transcription, chunking, embedding |
| `ai_tasks` | 2 | OpenAI calls (quiz, summary, topics) |
| `recommendations` | 2 | Profile updates, recommendation generation |
| `notifications` | 2 | Email, in-app alerts, daily digest |
| `default` | 2 | General tasks |

Workers are scaled **independently** — analytics workers scale horizontally during peak usage without touching AI workers.

---

## Security Architecture

| Layer | Mechanism |
|-------|-----------|
| Authentication | JWT (SimpleJWT) — 15 min access, 7 day refresh with rotation + blacklisting |
| Authorization | Role-based permission classes + object-level ownership checks |
| File Uploads | Extension allowlist + MIME type check + SHA-256 deduplication + size limit (2GB) |
| Rate Limiting | Per-user throttling: 300/h general, 500/h analytics, 10/h video upload |
| API Docs | Restricted in production (`SERVE_INCLUDE_SCHEMA=False`) |
| Secrets | All via environment variables — nothing hardcoded |
| HTTPS | HSTS + SSL redirect enforced in production settings |
| Data Privacy | Sentry PII disabled, student data access gated by ownership |
| Error Handling | Structured JSON envelopes — no stack traces exposed to clients |

---

## Scalability Notes

- **PostgreSQL**: `LearningBehaviorEvent` partitioned by month — supports billions of rows
- **Redis**: EMA profile caching (5 min TTL) — eliminates repeated DB reads
- **Celery**: Workers per queue scaled independently on Kubernetes/ECS
- **ChromaDB**: HTTP server mode — deployable as cluster in Phase 2
- **Django**: Stateless — horizontally scalable behind any load balancer
- **S3/R2**: All media in object storage — no local disk dependency
- **API**: Cursor-based pagination for analytics streams — no OFFSET bottleneck

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Web Framework | Django 4.2 + Django REST Framework |
| Database | PostgreSQL 16 (Supabase in production) |
| Cache / Broker | Redis 7 |
| Async Queue | Celery 5 + django-celery-beat |
| Vector DB | ChromaDB (HTTP server mode) |
| Embeddings | sentence-transformers (`all-MiniLM-L6-v2`) |
| AI Generation | OpenAI API (`gpt-4o-mini`) |
| Storage | Cloudflare R2 / AWS S3 (boto3) |
| Auth | SimpleJWT with token blacklisting |
| Deployment | Docker + Docker Compose |
| Monitoring | Sentry, Flower (Celery) |
| API Docs | drf-spectacular (OpenAPI 3) |
