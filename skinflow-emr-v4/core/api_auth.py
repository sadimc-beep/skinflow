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
      1. Superadmin impersonation header (X-Impersonate-Org) — only when header present
      2. ClinicStaff profile → organization
      3. Provider profile → organization (fallback for doctor/therapist accounts)
      4. Raises AuthenticationFailed — no silent fallback
    """
    from core.models import Organization
    from rest_framework.exceptions import AuthenticationFailed

    if not request:
        raise AuthenticationFailed("Organization context could not be resolved. Ensure a valid JWT is provided.")

    if not (hasattr(request, 'user') and request.user.is_authenticated):
        raise AuthenticationFailed("Organization context could not be resolved. Ensure a valid JWT is provided.")

    # 1. Superadmin impersonation — only intercept when the header is explicitly present.
    #    Superusers without the header fall through to the normal staff/provider lookup
    #    so that clinic admin accounts created via createsuperuser work correctly.
    impersonate_org_id = request.headers.get('X-Impersonate-Org')
    if request.user.is_superuser and impersonate_org_id:
        try:
            return Organization.objects.get(id=impersonate_org_id)
        except Organization.DoesNotExist:
            raise AuthenticationFailed("Impersonation target organization not found.")

    # 2. ClinicStaff profile (front desk, managers, admins)
    try:
        staff_profile = request.user.staff_profile
        if staff_profile.organization_id:
            return staff_profile.organization
    except Exception:
        pass

    # 3. Provider profile (doctors, therapists — may not have a ClinicStaff record)
    try:
        provider_profile = request.user.provider_profile
        if provider_profile.organization_id:
            return provider_profile.organization
    except Exception:
        pass

    raise AuthenticationFailed("Authenticated user has no linked organization.")
