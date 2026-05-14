from django.core.management.base import BaseCommand
from apps.courses.models import Course, Concept, Lesson
from apps.users.models import User
from django.utils.text import slugify

class Command(BaseCommand):
    help = 'Seeds the database with example courses and concepts'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting to seed courses...")

        # Get or create a default tutor
        tutor, created = User.objects.get_or_create(
            email='tutor@vision.ai',
            defaults={
                'first_name': 'Demo',
                'last_name': 'Tutor',
                'role': 'tutor'
            }
        )
        if created:
            tutor.set_password('password123')
            tutor.save()
            from apps.users.models import TutorProfile
            TutorProfile.objects.get_or_create(user=tutor)

        # Create Concepts
        def create_concept(name, domain, diff):
            c, _ = Concept.objects.get_or_create(name=name, defaults={'slug': slugify(name), 'domain': domain, 'difficulty_level': diff})
            return c
            
        concept1 = create_concept('Neural Networks', 'Computer Science', 7)
        concept2 = create_concept('Cryptography', 'Computer Science', 9)
        concept3 = create_concept('Quantum Computing', 'Physics', 8)

        # Helper to create course
        def create_course(title, desc, diff, concepts_list):
            course, _ = Course.objects.get_or_create(
                title=title,
                defaults={
                    'slug': slugify(title),
                    'description': desc,
                    'tutor': tutor,
                    'difficulty': diff,
                    'is_published': True,
                }
            )
            course.concepts.set(concepts_list)
            return course

        create_course('Advanced Quantum Cryptography', 'A deep dive into post-quantum encryption protocols.', 'advanced', [concept2, concept3])
        create_course('Neural Network Architecture', 'Learn to build and scale deep learning models.', 'intermediate', [concept1])
        create_course('Cognitive Behavioral Therapy for AI', 'Understanding alignment and behavioral modification in LLMs.', 'advanced', [])
        create_course('Introduction to Quantum Mechanics', 'The fundamental laws governing the subatomic world.', 'beginner', [concept3])

        self.stdout.write(self.style.SUCCESS('Successfully seeded database with example courses.'))
