import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skinflow.settings')
django.setup()

# Login as Miracle Admin
r1 = requests.post('http://127.0.0.1:8000/api/core/auth/login/', json={'email': 'admin@miracle.com', 'password': 'password123'})
token = r1.json().get('access')
user_data = r1.json().get('user')

print(f"Logged in user: {user_data['name']} (Org: {user_data.get('organization_name')})")

# Fetch patients
r2 = requests.get('http://127.0.0.1:8000/api/patients/patients/', headers={'Authorization': f'Bearer {token}'})
print(f"Patients found for this org: {len(r2.json().get('results', []))}")
