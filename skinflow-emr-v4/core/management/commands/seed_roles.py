"""
Management command to seed RBAC roles for Miracle's clinic.
Usage: python manage.py seed_roles --org <slug>
Idempotent — safe to re-run (uses get_or_create).
"""
from django.core.management.base import BaseCommand, CommandError
from core.models import Organization, Role

RW = ['read', 'write']
RWD = ['read', 'write', 'delete']
R = ['read']

ROLES = [
    {
        'name': 'Owner',
        'description': 'Clinic owner — full access including settings',
        'permissions': {
            'patients':   RWD,
            'clinical':   RWD,
            'billing':    RWD,
            'inventory':  RWD,
            'accounting': RWD,
            'pos':        RWD,
            'settings':   RWD,
        },
    },
    {
        'name': 'Doctor',
        'description': 'Full clinical access, view billing',
        'permissions': {
            'patients': RW,
            'clinical': RW,
            'billing':  R,
        },
    },
    {
        'name': 'Therapist',
        'description': 'Procedure sessions and limited clinical, view billing',
        'permissions': {
            'patients': R,
            'clinical': RW,
            'billing':  R,
        },
    },
    {
        'name': 'Front Desk',
        'description': 'Appointments, payments, patient registration',
        'permissions': {
            'patients': RW,
            'clinical': RW,
            'billing':  RW,
            'pos':      RW,
        },
    },
    {
        'name': 'Store',
        'description': 'Inventory, billing, and accounting',
        'permissions': {
            'billing':    RW,
            'inventory':  RWD,
            'accounting': RW,
        },
    },
]


class Command(BaseCommand):
    help = 'Seed RBAC roles for a clinic organisation.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--org',
            required=True,
            help='Organisation slug (e.g. miracle-aesthetics)',
        )

    def handle(self, *args, **options):
        slug = options['org']
        try:
            org = Organization.objects.get(slug=slug)
        except Organization.DoesNotExist:
            raise CommandError(f'Organisation with slug "{slug}" not found.')

        self.stdout.write(f'Seeding roles for: {org.name}')

        for role_data in ROLES:
            role, created = Role.objects.get_or_create(
                organization=org,
                name=role_data['name'],
                defaults={
                    'description': role_data['description'],
                    'permissions': role_data['permissions'],
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created: {role.name}'))
            else:
                # Update permissions in case they changed
                role.description = role_data['description']
                role.permissions = role_data['permissions']
                role.save(update_fields=['description', 'permissions'])
                self.stdout.write(f'  Updated: {role.name}')

        self.stdout.write(self.style.SUCCESS('Done.'))
