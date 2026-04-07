from rest_framework import permissions


class HasRolePermission(permissions.BasePermission):
    """
    Checks that the authenticated user's Role grants access to the requested module and action.

    ViewSets must declare:
        permission_module = 'billing'   # one of: patients, clinical, billing,
                                        #         inventory, accounting, pos, settings

    Action is derived from the HTTP method automatically:
        GET / HEAD / OPTIONS  →  'read'
        POST / PUT / PATCH    →  'write'
        DELETE                →  'delete'

    Bypass rules (in order):
        1. Django superuser              → always allowed
        2. ClinicStaff.is_org_admin=True → always allowed within their org
        3. Role.permissions check        → domain + action must be present
    """

    def has_permission(self, request, view):
        # 1. Require authenticated user
        if not request.user or not request.user.is_authenticated:
            return False

        # 2. Superuser bypass
        if request.user.is_superuser:
            return True

        # 3. Must have an active staff profile
        staff = getattr(request.user, 'staff_profile', None)
        if not staff or not staff.is_active:
            return False

        # 4. Org admin bypass
        if staff.is_org_admin:
            return True

        # 5. Must have a role
        role = staff.role
        if not role:
            return False

        # 6. ViewSet must declare permission_module
        domain = getattr(view, 'permission_module', None)
        if not domain:
            return False

        # 7. Map HTTP method → action
        if request.method in permissions.SAFE_METHODS:
            action = 'read'
        elif request.method == 'DELETE':
            action = 'delete'
        else:
            action = 'write'

        # 8. Check role permissions JSON
        user_perms = role.permissions
        if not isinstance(user_perms, dict):
            return False

        return action in user_perms.get(domain, [])


class IsSuperUser(permissions.BasePermission):
    """Allows access only to Django superusers."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsKioskToken(permissions.BasePermission):
    """
    Validates a per-org kiosk token sent as:
        Authorization: Kiosk <uuid>

    On success, attaches request.kiosk_org so views can scope queries.
    This permission bypasses JWT authentication entirely — it is intended
    only for the patient-facing tablet endpoints.
    """

    def has_permission(self, request, view):
        from core.models import Organization

        auth = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth.startswith('Kiosk '):
            return False

        token = auth[6:].strip()
        if not token:
            return False

        try:
            org = Organization.objects.get(kiosk_token=token, is_active=True)
        except (Organization.DoesNotExist, Exception):
            return False

        request.kiosk_org = org
        return True
