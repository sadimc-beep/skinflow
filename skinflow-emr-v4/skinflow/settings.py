import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
# In development, this falls back to a hardcoded value. In production, always
# set DJANGO_SECRET_KEY in the environment.
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-development-key-replace-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
# DJANGO_DEBUG defaults to True for local development.
DEBUG = os.getenv('DJANGO_DEBUG', 'True').lower() == 'true'

# Comma-separated hostnames, e.g. "localhost,127.0.0.1,api.example.com"
_allowed_hosts = os.getenv('DJANGO_ALLOWED_HOSTS', '*')
ALLOWED_HOSTS = [h.strip() for h in _allowed_hosts.split(',')] if _allowed_hosts else []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Rest Framework & CORS
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    
    # Skinflow Apps
    'core',
    'patients',
    'masters',
    'campaigns',
    'clinical',
    'billing',
    'inventory',
    'accounting',
    'saas',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'skinflow.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'skinflow.wsgi.application'

# Database configuration is driven by environment variables with sensible
# defaults for local development (SQLite).
DB_ENGINE = os.getenv('DJANGO_DB_ENGINE', 'django.db.backends.sqlite3')
DB_NAME = os.getenv('DJANGO_DB_NAME', str(BASE_DIR / 'db.sqlite3'))
DB_USER = os.getenv('DJANGO_DB_USER', '')
DB_PASSWORD = os.getenv('DJANGO_DB_PASSWORD', '')
DB_HOST = os.getenv('DJANGO_DB_HOST', '')
DB_PORT = os.getenv('DJANGO_DB_PORT', '')

DATABASES = {
    'default': {
        'ENGINE': DB_ENGINE,
        'NAME': DB_NAME,
        'USER': DB_USER,
        'PASSWORD': DB_PASSWORD,
        'HOST': DB_HOST,
        'PORT': DB_PORT,
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Dhaka'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── Media / File Uploads ───────────────────────────────────────────────────────
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Storage backend: local filesystem by default; S3 when AWS_STORAGE_BUCKET_NAME is set.
_s3_bucket = os.getenv('AWS_STORAGE_BUCKET_NAME', '')

if _s3_bucket:
    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
            'OPTIONS': {
                'bucket_name': _s3_bucket,
                'region_name': os.getenv('AWS_S3_REGION_NAME', 'ap-southeast-1'),
                'access_key': os.getenv('AWS_ACCESS_KEY_ID', ''),
                'secret_key': os.getenv('AWS_SECRET_ACCESS_KEY', ''),
                'location': os.getenv('AWS_S3_MEDIA_LOCATION', 'media'),
                'file_overwrite': False,
                'querystring_auth': False,
            },
        },
        'staticfiles': {
            'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
        },
    }
else:
    STORAGES = {
        'default': {
            'BACKEND': 'django.core.files.storage.FileSystemStorage',
        },
        'staticfiles': {
            'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
        },
    }

# Skinflow Config
SKINFLOW_API_KEY = os.getenv('SKINFLOW_API_KEY', 'dev-key-12345')
PHARMASEED_API_KEY = os.getenv('PHARMASEED_API_KEY', '')

CORS_ALLOW_ALL_ORIGINS = os.getenv('DJANGO_CORS_ALLOW_ALL_ORIGINS', 'True').lower() == 'true'
CORS_ALLOW_CREDENTIALS = os.getenv('DJANGO_CORS_ALLOW_CREDENTIALS', 'True').lower() == 'true'
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ]
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
