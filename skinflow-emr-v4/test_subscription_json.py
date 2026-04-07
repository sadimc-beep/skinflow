import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skinflow.settings')
django.setup()

from saas.serializers import SubscriptionSerializer
from core.models import Organization

org = Organization.objects.filter(name__icontains='Miracle').first()
if getattr(org, 'subscription', None):
    data = SubscriptionSerializer(org.subscription).data
    print(data)
else:
    print("No subscription object attached to this org!")
