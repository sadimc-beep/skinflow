import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skinflow.settings')
django.setup()

from core.models import Organization
from django.contrib.auth import get_user_model

User = get_user_model()
org = Organization.objects.filter(name__icontains='Miracle').first()

if not org:
    print("Org not found")
    exit(1)

print(f"Org: {org.name}")
try:
    sub = org.subscription
    print(f"Subscription: {sub.plan.name}")
    print(f"Max Users: {sub.max_users}")
except Exception as e:
    print(f"No subscription or error: {e}")

staff_count = org.staff.filter(is_active=True, user__is_superuser=False).count()
print(f"Current Staff Count: {staff_count}")

import uuid
test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
from rest_framework.test import APIClient
client = APIClient()
su = User.objects.filter(is_superuser=True).first()
client.force_authenticate(user=su)

payload = {
    "email": test_email,
    "first_name": "Test",
    "last_name": "MiracleUUID",
    "password": "Password123!",
    "role_id": None,
    "branch_ids": [],
    "is_org_admin": False
}
resp = client.post(f"/api/saas/organizations/{org.id}/users/", data=payload, format='json')
print(f"POST Response Code: {resp.status_code}")
print(f"POST Response Data: {resp.json()}")

