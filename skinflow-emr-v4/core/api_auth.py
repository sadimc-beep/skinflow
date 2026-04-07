from functools import wraps
from django.http import JsonResponse
from django.conf import settings

def require_api_key(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        api_key = request.headers.get('X-Api-Key') or request.GET.get('api_key')
        
        # Check against expected API key
        expected_key = getattr(settings, 'SKINFLOW_API_KEY', None)
        
        if not expected_key:
            # If no key configured in settings, deny all or allow all based on policy.
            # Here we deny by default if a key should exist.
            return JsonResponse({'error': 'API Authentication not configured on server.'}, status=500)

        if api_key != expected_key:
            return JsonResponse({'error': 'Unauthorized. Invalid API Key.'}, status=401)
            
        return view_func(request, *args, **kwargs)
    return _wrapped_view

def get_current_org(request=None):
    """
    Resolves the current organization from the authenticated user's staff profile.

    Resolution order:
      1. Superadmin impersonation header (X-Impersonate-Org)
      2. Authenticated staff user's linked organization
      3. Raises AuthenticationFailed — no silent fallback to first org
    """
    from core.models import Organization
    from rest_framework.exceptions import AuthenticationFailed

    if request:
        # 1. Superadmin impersonation header takes priority
        if hasattr(request, 'user') and request.user.is_superuser:
            impersonate_org_id = request.headers.get('X-Impersonate-Org')
            if impersonate_org_id:
                try:
                    return Organization.objects.get(id=impersonate_org_id)
                except Organization.DoesNotExist:
                    raise AuthenticationFailed("Impersonation target organization not found.")
            # Superuser without impersonation header — no org context (caller handles None)
            return None

        # 2. Authenticated staff user
        if hasattr(request, 'user') and request.user.is_authenticated:
            if hasattr(request.user, 'staff_profile') and getattr(request.user.staff_profile, 'organization', None):
                return request.user.staff_profile.organization
            raise AuthenticationFailed("Authenticated user has no linked organization.")

    raise AuthenticationFailed("Organization context could not be resolved. Ensure a valid JWT is provided.")
