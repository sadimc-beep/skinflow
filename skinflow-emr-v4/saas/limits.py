"""
SaaS usage limit enforcement utilities.

Usage:
    from saas.limits import check_org_limit, LimitExceededException

    check_org_limit(org, 'patients')   # raises LimitExceededException if at limit
"""
from rest_framework.exceptions import APIException
from rest_framework import status


class LimitExceededException(APIException):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_code = 'limit_exceeded'

    def __init__(self, limit_type: str, current: int, max_allowed: int):
        self.detail = {
            'detail': f'Your plan limit for {limit_type} has been reached ({current}/{max_allowed}).',
            'limit_type': limit_type,
            'current': current,
            'max': max_allowed,
            'upgrade_url': '/settings/subscription',
        }


def _get_subscription(org):
    """Returns the org's Subscription or None if not found."""
    try:
        return org.subscription
    except Exception:
        return None


def check_org_limit(org, limit_type: str) -> dict:
    """
    Check whether the org is within its plan limit for the given limit_type.

    limit_type values: 'patients', 'users', 'branches'

    Returns a dict: {allowed, current, max, percent}
    Raises LimitExceededException (HTTP 402) if at or over limit.
    """
    sub = _get_subscription(org)
    if sub is None:
        # No subscription record — allow (super admin orgs, etc.)
        return {'allowed': True, 'current': 0, 'max': 0, 'percent': 0}

    current, max_allowed = _get_counts(org, sub, limit_type)

    # 0 = unlimited
    if max_allowed == 0:
        return {'allowed': True, 'current': current, 'max': 0, 'percent': 0}

    if current >= max_allowed:
        raise LimitExceededException(limit_type, current, max_allowed)

    percent = round((current / max_allowed) * 100, 1) if max_allowed else 0
    return {'allowed': True, 'current': current, 'max': max_allowed, 'percent': percent}


def get_usage(org) -> dict:
    """
    Returns full usage snapshot for the org (used by /api/core/usage/).
    Does NOT raise — safe to call at any time.
    """
    sub = _get_subscription(org)
    if sub is None:
        return {
            'plan_name': None,
            'subscription_status': None,
            'plan_features': {},
            'limits': {},
        }

    features = sub.plan.features or {}

    limits = {}
    for limit_type in ('patients', 'users', 'branches'):
        current, max_allowed = _get_counts(org, sub, limit_type)
        percent = round((current / max_allowed) * 100, 1) if max_allowed else 0
        limits[limit_type] = {
            'current': current,
            'max': max_allowed,
            'percent': percent,
            'at_limit': max_allowed > 0 and current >= max_allowed,
            'near_limit': max_allowed > 0 and percent >= 80 and current < max_allowed,
        }

    return {
        'plan_name': sub.plan.name,
        'subscription_status': sub.status,
        'plan_features': features,
        'limits': limits,
    }


def _get_counts(org, sub, limit_type: str):
    """Returns (current_count, max_allowed) for the given limit_type."""
    if limit_type == 'patients':
        from patients.models import Patient
        current = Patient.objects.filter(organization=org).count()
        max_allowed = sub.effective_max_patients
    elif limit_type == 'users':
        from core.models import ClinicStaff
        current = ClinicStaff.objects.filter(organization=org, is_active=True).count()
        max_allowed = sub.max_users
    elif limit_type == 'branches':
        from core.models import Branch
        current = Branch.objects.filter(organization=org).count()
        max_allowed = sub.max_branches
    else:
        return 0, 0
    return current, max_allowed
