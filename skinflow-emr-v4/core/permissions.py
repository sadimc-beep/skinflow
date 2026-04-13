from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied


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

    Subscription status enforcement:
        SUSPENDED → read-only (GET/HEAD/OPTIONS only)
        CANCELLED → all requests blocked
    """

    def has_permission(self, request, view):
        # 1. Require authenticated user
        if not request.user or not request.user.is_authenticated:
            return False

        # 2. Superuser bypass (not subject to subscription limits)
        if request.user.is_superuser:
            return True

        # 3. Must have an active staff profile
        staff = getattr(request.user, 'staff_profile', None)
        if not staff or not staff.is_active:
            return False

        # 4. Subscription status check
        try:
            sub = staff.organization.subscription
            if sub.status == 'CANCELLED':
                raise PermissionDenied('Your subscription has been cancelled. Please contact support.')
            if sub.status == 'SUSPENDED' and request.method not in permissions.SAFE_METHODS:
                raise PermissionDenied('Your subscription is suspended. Write operations are disabled.')
        except PermissionDenied:
            raise
        except Exception:
            pass  # No subscription record — allow (e.g. org created but not yet subscribed)

        # 5. Org admin bypass
        if staff.is_org_admin:
            return True

        # 6. Must have a role
        role = staff.role
        if not role:
            return False

        # 7. ViewSet must declare permission_module
        domain = getattr(view, 'permission_module', None)
        if not domain:
            return False

        # 8. Map HTTP method → action
        if request.method in permissions.SAFE_METHODS:
            action = 'read'
        elif request.method == 'DELETE':
            action = 'delete'
        else:
            action = 'write'

        # 9. Check role permissions JSON
        user_perms = role.permissions
        if not isinstance(user_perms, dict):
            return False

        return action in user_perms.get(domain, [])


class IsDoctorOrOrgAdmin(permissions.BasePermission):
    """
    Allows write access only to users whose role name contains a doctor-like keyword,
    plus org admins and superusers.

    Used to gate ConsultationViewSet and TreatmentPlanViewSet writes so that Front Desk
    staff (who have clinical.write for appointments/vitals) cannot create or modify
    clinical chart notes.
    """
    _KEYWORDS = ('doctor', 'physician', 'consultant')

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        staff = getattr(request.user, 'staff_profile', None)
        if not staff or not staff.is_active:
            return False

        # Subscription check (mirrors HasRolePermission)
        try:
            sub = staff.organization.subscription
            if sub.status == 'CANCELLED':
                raise PermissionDenied('Your subscription has been cancelled. Please contact support.')
            if sub.status == 'SUSPENDED' and request.method not in permissions.SAFE_METHODS:
                raise PermissionDenied('Your subscription is suspended. Write operations are disabled.')
        except PermissionDenied:
            raise
        except Exception:
            pass

        if staff.is_org_admin:
            return True

        role = staff.role
        if not role:
            return False
        return any(kw in role.name.lower() for kw in self._KEYWORDS)


class HasAnyModulePermission(permissions.BasePermission):
    """
    Grants permission if the user satisfies ANY one of the supplied (module, action) pairs.
    Action is a literal string: 'read', 'write', or 'delete' — NOT derived from the HTTP method.

    Usage in get_permissions():
        return [HasAnyModulePermission([('clinical', 'write'), ('inventory', 'write')])]

    Applies the same superuser / org_admin bypass and subscription check as HasRolePermission.
    """

    def __init__(self, module_actions):
        self.module_actions = module_actions  # list of (module, action) tuples

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        staff = getattr(request.user, 'staff_profile', None)
        if not staff or not staff.is_active:
            return False

        try:
            sub = staff.organization.subscription
            if sub.status == 'CANCELLED':
                raise PermissionDenied('Your subscription has been cancelled. Please contact support.')
            if sub.status == 'SUSPENDED' and request.method not in permissions.SAFE_METHODS:
                raise PermissionDenied('Your subscription is suspended. Write operations are disabled.')
        except PermissionDenied:
            raise
        except Exception:
            pass

        if staff.is_org_admin:
            return True

        role = staff.role
        if not role:
            return False

        user_perms = role.permissions
        if not isinstance(user_perms, dict):
            return False

        return any(
            action in user_perms.get(module, [])
            for module, action in self.module_actions
        )


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
