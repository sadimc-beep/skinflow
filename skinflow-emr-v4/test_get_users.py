import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skinflow.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from core.models import Organization

User = get_user_model()
client = APIClient()
su = User.objects.filter(is_superuser=True).first()
client.force_authenticate(user=su)

org = Organization.objects.filter(name__icontains='Miracle').first()

resp = client.get(f"/api/saas/organizations/{org.id}/users/")
print(f"GET Users Status: {resp.status_code}")
data = resp.json()
print(f"Total Users: {len(data)}")

# What happens if we try to create an EXISTING user?
payload = {
    "email": "admin@miracle.com",
    "first_name": "Admin",
    "last_name": "Miracle",
    "password": "Password123!",
    "role_id": None,
    "branch_ids": [],
    "is_org_admin": False
}
resp2 = client.post(f"/api/saas/organizations/{org.id}/users/", data=payload, format='json')
print(f"POST Existing User Status: {resp2.status_code}")
print(f"POST Existing User Data: {resp2.json()}")
