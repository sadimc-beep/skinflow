import os

# Import all defaults from the base settings module, then override with
# production-minded values driven by environment variables.
from .settings import *  # noqa


# In production we default DEBUG to False unless explicitly enabled.
DEBUG = os.getenv('DJANGO_DEBUG', 'False').lower() == 'true'

# Require an explicit secret key in production; fall back to whatever the base
# settings loaded only if DJANGO_SECRET_KEY is not provided (useful for
# staging/labs, but real production should always set it).
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', SECRET_KEY)

# Narrow ALLOWED_HOSTS by default in production; if DJANGO_ALLOWED_HOSTS is
# unset, this will be an empty list and Django will reject unknown hosts.
allowed_hosts_env = os.getenv('DJANGO_ALLOWED_HOSTS')
if allowed_hosts_env is not None:
    ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_env.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = []

# In production we assume CORS should be explicit. If the env variable is not
# set, default to False instead of permissive True.
CORS_ALLOW_ALL_ORIGINS = os.getenv('DJANGO_CORS_ALLOW_ALL_ORIGINS', 'False').lower() == 'true'
CORS_ALLOW_CREDENTIALS = os.getenv('DJANGO_CORS_ALLOW_CREDENTIALS', 'True').lower() == 'true'

