from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Count, Q

from core.models import Organization, Branch, ClinicStaff, Role, SaaSAdmin
from .models import (
    Plan, Subscription, SubscriptionInvoice, SubscriptionPayment,
    AuditLog, Announcement, AnnouncementDismissal, ImpersonationSession,
)
from .serializers import (
    PlanSerializer, SubscriptionSerializer, SubscriptionInvoiceSerializer,
    SaaSOrganizationSerializer, BranchSerializer, ClinicStaffSerializer,
    ClinicStaffCreateSerializer, RoleSerializer, AuditLogSerializer,
    AnnouncementSerializer, ImpersonationSessionSerializer, UserSerializer,
)

User = get_user_model()


# ─── Helper: Audit Logging ────────────────────────────────────────
def log_action(user, action, resource_type, resource_id='', organization=None, changes=None, request=None):
    AuditLog.objects.create(
        user=user,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        organization=organization,
        changes=changes or {},
        ip_address=request.META.get('REMOTE_ADDR') if request else None,
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500] if request else '',
    )


# ─── Permission: SaaS Admin Only ─────────────────────────────────
class IsSaaSAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return hasattr(request.user, 'saas_profile') and request.user.saas_profile.is_active


# ─── Plans ────────────────────────────────────────────────────────
class PlanViewSet(viewsets.ModelViewSet):
    """CRUD for subscription plans. SaaS admin only."""
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [IsSaaSAdmin]


# ─── Organizations ───────────────────────────────────────────────
class SaaSOrganizationViewSet(viewsets.ModelViewSet):
    """Manage all organizations (clinics) from the SaaS admin panel."""
    queryset = Organization.objects.all().prefetch_related('branches', 'staff', 'staff__user')
    serializer_class = SaaSOrganizationSerializer
    permission_classes = [IsSaaSAdmin]

    @action(detail=True, methods=['get', 'post', 'put', 'patch', 'delete'])
    def branches(self, request, pk=None):
        org = self.get_object()
        
        if request.method == 'GET':
            branches = org.branches.all()
            return Response(BranchSerializer(branches, many=True).data)
            
        if request.method == 'POST':
            serializer = BranchSerializer(data={**request.data, 'organization': org.id})
            serializer.is_valid(raise_exception=True)
            branch = serializer.save()
            log_action(request.user, 'branch.created', 'Branch', branch.id, org, request=request)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        # For PUT/PATCH/DELETE, expect branch_id in data or query params
        branch_id = request.data.get('id') or request.query_params.get('id')
        if not branch_id:
            return Response({'error': 'Branch ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            branch = org.branches.get(id=branch_id)
        except Branch.DoesNotExist:
            return Response({'error': 'Branch not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        if request.method == 'DELETE':
            # Soft deactivate or delete
            branch.is_active = False
            branch.save()
            log_action(request.user, 'branch.deactivated', 'Branch', branch.id, org, request=request)
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        # PUT / PATCH
        serializer = BranchSerializer(branch, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_branch = serializer.save()
        log_action(request.user, 'branch.updated', 'Branch', branch.id, org, request=request)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post', 'put', 'patch', 'delete'])
    def users(self, request, pk=None):
        org = self.get_object()
        
        if request.method == 'GET':
            staff = org.staff.select_related('user', 'role').prefetch_related('branches').filter(user__is_superuser=False)
            return Response(ClinicStaffSerializer(staff, many=True).data)

        if request.method == 'POST':
            # POST: Create user + staff profile
            serializer = ClinicStaffCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            # Check user limit
            try:
                sub = org.subscription
                current_count = org.staff.filter(is_active=True, user__is_superuser=False).count()
                if current_count >= sub.max_users:
                    return Response(
                        {'error': f'User limit reached ({sub.max_users}). Upgrade the plan or add extra users.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Subscription.DoesNotExist:
                pass  # No subscription = allow (for initial setup)

            user = User.objects.create_user(
                username=data['email'],
                email=data['email'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                password=data['password'],
            )
            role = Role.objects.filter(id=data.get('role_id'), organization=org).first() if data.get('role_id') else None
            staff = ClinicStaff.objects.create(
                user=user,
                organization=org,
                role=role,
                is_org_admin=data.get('is_org_admin', False),
            )
            if data.get('branch_ids'):
                branches = Branch.objects.filter(id__in=data['branch_ids'], organization=org)
                staff.branches.set(branches)

            log_action(request.user, 'user.created', 'ClinicStaff', staff.id, org,
                       changes={'email': data['email'], 'role': role.name if role else None},
                       request=request)

            return Response(ClinicStaffSerializer(staff).data, status=status.HTTP_201_CREATED)

        # PUT/PATCH/DELETE require user ID
        staff_id = request.data.get('id') or request.query_params.get('id')
        if not staff_id:
            return Response({'error': 'Staff ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            staff = org.staff.get(id=staff_id)
        except ClinicStaff.DoesNotExist:
            return Response({'error': 'Staff member not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        if request.method == 'DELETE':
            staff.is_active = False
            staff.save()
            staff.user.is_active = False
            staff.user.save()
            log_action(request.user, 'user.deactivated', 'ClinicStaff', staff.id, org, request=request)
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        # PUT / PATCH
        # Update user basics
        if 'first_name' in request.data:
            staff.user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            staff.user.last_name = request.data['last_name']
        if 'is_active' in request.data:
            is_active = request.data['is_active']
            staff.is_active = is_active
            staff.user.is_active = is_active
            
        if 'password' in request.data and request.data['password']:
            staff.user.set_password(request.data['password'])
            
        staff.user.save()
        
        # Update staff details
        if 'role_id' in request.data:
            role_id = request.data['role_id']
            staff.role = Role.objects.filter(id=role_id, organization=org).first() if role_id else None
            
        if 'is_org_admin' in request.data:
            staff.is_org_admin = request.data['is_org_admin']
            
        if 'branch_ids' in request.data:
            branches = Branch.objects.filter(id__in=request.data['branch_ids'], organization=org)
            staff.branches.set(branches)
            
        staff.save()
        log_action(request.user, 'user.updated', 'ClinicStaff', staff.id, org, request=request)
        return Response(ClinicStaffSerializer(staff).data)

    @action(detail=True, methods=['get', 'post', 'put', 'patch', 'delete'])
    def roles(self, request, pk=None):
        org = self.get_object()
        
        if request.method == 'GET':
            roles = org.roles.all()
            return Response(RoleSerializer(roles, many=True).data)
            
        if request.method == 'POST':
            serializer = RoleSerializer(data={**request.data, 'organization': org.id})
            serializer.is_valid(raise_exception=True)
            role = serializer.save()
            log_action(request.user, 'role.created', 'Role', role.id, org, request=request)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        # PUT/PATCH/DELETE require role ID
        role_id = request.data.get('id') or request.query_params.get('id')
        if not role_id:
            return Response({'error': 'Role ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            role = org.roles.get(id=role_id)
        except Role.DoesNotExist:
            return Response({'error': 'Role not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        if request.method == 'DELETE':
            # Handle dependent users before deletion
            staff_count = role.staff_members.count()
            if staff_count > 0:
                # Optionally block deletion if users exist, or set to null
                role.staff_members.update(role=None)
            role.delete()
            log_action(request.user, 'role.deleted', 'Role', role_id, org, request=request)
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        # PUT / PATCH
        serializer = RoleSerializer(role, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_role = serializer.save()
        log_action(request.user, 'role.updated', 'Role', role.id, org, request=request)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def subscription(self, request, pk=None):
        org = self.get_object()
        try:
            sub = org.subscription
            return Response(SubscriptionSerializer(sub).data)
        except Subscription.DoesNotExist:
            return Response({'detail': 'No subscription found.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def audit_log(self, request, pk=None):
        org = self.get_object()
        logs = AuditLog.objects.filter(organization=org)[:100]
        return Response(AuditLogSerializer(logs, many=True).data)


# ─── Subscriptions ───────────────────────────────────────────────
class SubscriptionViewSet(viewsets.ModelViewSet):
    """Manage subscriptions. SaaS admin only."""
    queryset = Subscription.objects.select_related('organization', 'plan').all()
    serializer_class = SubscriptionSerializer
    permission_classes = [IsSaaSAdmin]


# ─── Audit Logs ──────────────────────────────────────────────────
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only global audit trail."""
    queryset = AuditLog.objects.select_related('user', 'organization').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsSaaSAdmin]
    filterset_fields = ['action', 'resource_type', 'organization']


# ─── Announcements ───────────────────────────────────────────────
class AnnouncementViewSet(viewsets.ModelViewSet):
    """CRUD announcements and dismiss endpoint for clinic users."""
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsSaaSAdmin]  # Create/update for admins; list/dismiss for all

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active announcements for the current user (clinic-facing)."""
        now = timezone.now()
        dismissed_ids = AnnouncementDismissal.objects.filter(
            user=request.user
        ).values_list('announcement_id', flat=True)

        announcements = Announcement.objects.filter(
            published_at__lte=now,
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=now)
        ).exclude(
            id__in=dismissed_ids
        )

        # Filter by org if SPECIFIC target
        if hasattr(request.user, 'staff_profile'):
            org = request.user.staff_profile.organization
            announcements = announcements.filter(
                Q(target='ALL') | Q(target_organizations=org)
            ).distinct()

        return Response(AnnouncementSerializer(announcements, many=True).data)

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        announcement = self.get_object()
        if announcement.severity == 'CRITICAL':
            return Response({'error': 'Critical announcements cannot be dismissed.'}, status=status.HTTP_400_BAD_REQUEST)
        AnnouncementDismissal.objects.get_or_create(announcement=announcement, user=request.user)
        return Response({'status': 'dismissed'})


# ─── Impersonation ───────────────────────────────────────────────
class ImpersonationViewSet(viewsets.ModelViewSet):
    """Start/end impersonation sessions."""
    queryset = ImpersonationSession.objects.select_related('admin_user', 'target_organization').all()
    serializer_class = ImpersonationSessionSerializer
    permission_classes = [IsSaaSAdmin]

    def create(self, request, *args, **kwargs):
        """Start impersonation — returns a scoped JWT for the target org."""
        org_id = request.data.get('organization_id')
        reason = request.data.get('reason', '')
        if not org_id or not reason:
            return Response({'error': 'organization_id and reason are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            org = Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            return Response({'error': 'Organization not found.'}, status=status.HTTP_404_NOT_FOUND)

        session = ImpersonationSession.objects.create(
            admin_user=request.user,
            target_organization=org,
            reason=reason,
        )

        log_action(request.user, 'impersonation.started', 'ImpersonationSession', session.id, org,
                   changes={'reason': reason}, request=request)

        # TODO: Generate a scoped JWT with org claims for the impersonation session
        return Response({
            'session_id': session.id,
            'organization': SaaSOrganizationSerializer(org).data,
            'message': 'Impersonation session started. Use the scoped token to access clinic data.',
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        session = self.get_object()
        session.ended_at = timezone.now()
        session.save()
        log_action(request.user, 'impersonation.ended', 'ImpersonationSession', session.id,
                   session.target_organization, request=request)
        return Response({'status': 'Impersonation session ended.'})
