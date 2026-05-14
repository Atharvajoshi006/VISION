import os
import sys
import django
from django.utils import timezone
from datetime import timedelta

# Add backend directory to sys path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from apps.users.models import User, StudentProfile, TutorProfile
from apps.courses.models import Course, Concept, Lesson, Enrollment, ConceptPrerequisite
from apps.tracking.models import BehavioralEvent, LearningSession
from apps.tracking.pipeline import EventProcessor
from apps.cognitive_profiles.engine import CognitiveProfileEngine

def seed_data():
    print("Starting Data Seed for Vision AI Platform...")

    # 1. Clear existing for a clean slate
    User.objects.filter(email__in=["student@vision.com", "tutor@vision.com"]).delete()
    Course.objects.all().delete()
    Concept.objects.all().delete()
    BehavioralEvent.objects.all().delete()
    
    # 2. Create Users
    tutor = User.objects.create_user(
        email="tutor@vision.com",
        password="password123",
        first_name="Alan",
        last_name="Turing",
        role="tutor"
    )
    # The signal automatically creates the profile, so update it
    TutorProfile.objects.filter(user=tutor).update(expertise_areas=["Computer Science", "Math"])

    student = User.objects.create_user(
        email="student@vision.com",
        password="password123",
        first_name="Ada",
        last_name="Lovelace",
        role="student"
    )
    StudentProfile.objects.filter(user=student).update(learning_style="visual")

    # 3. Create Concepts & Prerequisites (Dependency Graph)
    print("Creating Courses and Concepts...")
    c_vars = Concept.objects.create(name="Variables & Types", slug="variables-types", domain="Programming", difficulty_level=0.2)
    c_loops = Concept.objects.create(name="Loops & Iteration", slug="loops-iteration", domain="Programming", difficulty_level=0.4)
    c_arrays = Concept.objects.create(name="Arrays & Lists", slug="arrays-lists", domain="Programming", difficulty_level=0.5)
    c_algos = Concept.objects.create(name="Sorting Algorithms", slug="sorting-algorithms", domain="Programming", difficulty_level=0.8)

    ConceptPrerequisite.objects.create(concept=c_loops, prerequisite=c_vars, strength=1.0)
    ConceptPrerequisite.objects.create(concept=c_arrays, prerequisite=c_loops, strength=0.8)
    ConceptPrerequisite.objects.create(concept=c_algos, prerequisite=c_arrays, strength=0.9)

    # 4. Create Course
    course = Course.objects.create(
        title="Introduction to Algorithms",
        slug="intro-to-algorithms",
        description="Master the fundamentals of computer science.",
        tutor=tutor,
        difficulty="intermediate",
        is_published=True
    )
    course.concepts.add(c_vars, c_loops, c_arrays, c_algos)

    lesson1 = Lesson.objects.create(course=course, title="Understanding Variables", order=1, lesson_type="video", video_duration_seconds=600)
    lesson1.concepts.add(c_vars)

    lesson2 = Lesson.objects.create(course=course, title="Array Traversals", order=2, lesson_type="interactive", video_duration_seconds=900)
    lesson2.concepts.add(c_arrays, c_loops)

    # Enroll Student
    Enrollment.objects.create(student=student, course=course)

    # 5. Simulate Behavioral Tracking Events
    print("Simulating Behavioral Events for Analytics...")
    events = [
        # Lesson 1: Student does well
        {"event_type": "video_play", "concept": c_vars, "lesson": lesson1, "duration": 600, "success": True, "offset": 10},
        {"event_type": "quiz_attempt", "concept": c_vars, "lesson": lesson1, "duration": 120, "success": True, "score": 0.9, "offset": 9},
        
        # Lesson 2: Student struggles with arrays
        {"event_type": "interactive_start", "concept": c_arrays, "lesson": lesson2, "duration": 0, "offset": 8},
        {"event_type": "hint_requested", "concept": c_arrays, "lesson": lesson2, "duration": 0, "offset": 7},
        {"event_type": "hint_requested", "concept": c_arrays, "lesson": lesson2, "duration": 0, "offset": 7},
        {"event_type": "quiz_attempt", "concept": c_arrays, "lesson": lesson2, "duration": 300, "success": False, "score": 0.3, "offset": 6},
        {"event_type": "error_encountered", "concept": c_arrays, "lesson": lesson2, "duration": 0, "offset": 5},
        {"event_type": "abandonment", "concept": c_arrays, "lesson": lesson2, "duration": 400, "offset": 5},
    ]

    import uuid
    now = timezone.now()
    session_id = str(uuid.uuid4())
    session = LearningSession.objects.create(
        student=student, 
        session_id=session_id, 
        started_at=now - timedelta(hours=12)
    )

    for idx, e in enumerate(events):
        event_time = now - timedelta(hours=e["offset"])
        concept_id = e.get("concept").id if e.get("concept") else None
        concept_name = e.get("concept").name if e.get("concept") else ""
        lesson_id = e.get("lesson").id if e.get("lesson") else None
        
        event = BehavioralEvent.objects.create(
            student=student,
            session_id=session_id,
            course_id=course.id,
            lesson_id=lesson_id,
            concept_id=concept_id,
            concept_name=concept_name,
            event_type=e["event_type"],
            score=e.get("score")
        )
        # Event is automatically created with timestamp in database, so we must update it
        BehavioralEvent.objects.filter(id=event.id).update(
            created_at=event_time,
            watch_time_seconds=e.get("duration", 0),
        )
        event.refresh_from_db()
        
        # Push through the real intelligence pipeline!
        processor = EventProcessor()
        processor.process(event)

    # Close Session
    session.ended_at = now - timedelta(hours=4)
    session.save()

    # 6. Trigger Cognitive Profile Generation
    print("Generating Cognitive Profiles...")
    profiler = CognitiveProfileEngine(student.id)
    profile = profiler.recalculate()

    print("==================================================")
    print("Seed Complete!")
    print(f"Student: {student.email} | Password: password123")
    print(f"Tutor: {tutor.email} | Password: password123")
    print("--------------------------------------------------")
    print("Student's Derived Cognitive Profile:")
    print(f"- Logical Reasoning: {profile.logical_reasoning_strength:.2f}")
    print(f"- Struggle Tendency: {profile.struggle_tendency:.2f}")
    print(f"- Visual Tendency: {profile.visual_tendency:.2f}")
    print("==================================================")

if __name__ == "__main__":
    seed_data()
