import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skinflow.settings')
django.setup()

from django.test import Client
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from core.models import Organization

User = get_user_model()
client = APIClient()

# Get the superuser
su = User.objects.filter(is_superuser=True).first()
if not su:
    print("No superuser found.")
    exit(1)

client.force_authenticate(user=su)

# Find Miracle Clinic
miracle_org = Organization.objects.filter(name__icontains='Miracle').first()
if not miracle_org:
    print("Miracle clinic not found.")
    exit(1)

print(f"Testing Add User for Org: {miracle_org.name} (ID: {miracle_org.id})")

payload = {
    "email": "testmiracleuser@example.com",
    "first_name": "Test",
    "last_name": "Miracle",
    "password": "Password123!",
    "role_id": None,
    "branch_ids": [],
    "is_org_admin": False
}

response = client.post(f"/api/saas/organizations/{miracle_org.id}/users/", data=payload, format='json')

print(f"Status Code: {response.status_code}")
try:
    print(f"Response Data: {response.json()}")
except Exception as e:
    print(f"Failed to parse JSON: {e}")
    print(f"Raw Content: {response.content}")

