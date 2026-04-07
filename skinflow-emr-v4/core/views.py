from rest_framework import viewsets, permissions
from django.utils.decorators import method_decorator

from .models import Organization, Provider
from .serializers import OrganizationSerializer, ProviderSerializer
from .api_auth import get_current_org
from .permissions import HasRolePermission
from saas.limits import check_org_limit
from patients.views import StandardResultsSetPagination

class OrganizationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only organization endpoint for context scoping.
    """
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

class ProviderViewSet(viewsets.ModelViewSet):
    queryset = Provider.objects.all().select_related('user', 'organization')
    serializer_class = ProviderSerializer
    permission_classes = [HasRolePermission]
    permission_module = 'settings'
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        org = get_current_org(self.request)
        return self.queryset.filter(organization=org)

    def perform_create(self, serializer):
        org = get_current_org(self.request)
        serializer.save(organization=org)

from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from clinical.models import Appointment
from billing.models import Invoice

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        org = get_current_org(request)
        today = timezone.localdate()
        
        appointments_today = Appointment.objects.filter(
            organization=org,
            date_time__date=today
        ).count()
        
        waiting_count = Appointment.objects.filter(
            organization=org,
            date_time__date=today,
            status=Appointment.Status.ARRIVED
        ).count()
        
        unpaid_invoices = Invoice.objects.filter(
            organization=org,
            status__in=[Invoice.Status.UNPAID, Invoice.Status.PARTIALLY_PAID]
        ).count()
        
        return Response({
            "appointments_today": appointments_today,
            "patients_waiting": waiting_count,
            "unpaid_invoices": unpaid_invoices
        })

from .models import ClinicSettings
from .serializers import ClinicSettingsSerializer

class ClinicSettingsView(APIView):
    """
    Singleton API endpoint to get/update Global Clinic Settings (Ledger Mappings).
    """
    permission_classes = [HasRolePermission]
    permission_module = 'settings'

    def get_object(self, request):
        org = get_current_org(request)
        settings, _ = ClinicSettings.objects.get_or_create(organization=org)
        return settings

    def get(self, request):
        settings = self.get_object(request)
        serializer = ClinicSettingsSerializer(settings)
        return Response(serializer.data)

    def patch(self, request):
        settings = self.get_object(request)
        serializer = ClinicSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

# ─── RBAC & Auth Views ────────────────────────────────────────────────────────

from rest_framework import serializers as drf_serializers, status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from .models import ClinicStaff, Role
from .serializers import ClinicStaffSerializer, RoleSerializer

User = get_user_model()

class LoginView(APIView):
    """POST /api/core/auth/login/ — returns access + refresh JWT tokens."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()

        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Look up user by email, then authenticate with their username
        try:
            user_obj = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(request, username=user_obj.username, password=password)
        if not user:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Log in Superadmins freely
        is_super = user.is_superuser
        
        staff = getattr(user, 'staff_profile', None)
        if not is_super and (not staff or not staff.is_active):
            return Response({'error': 'Account is not active or not linked to a clinic.'}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'name': user.get_full_name() or user.username,
                'email': user.email,
                'role': {
                    'id': staff.role.id if staff and staff.role else None,
                    'name': staff.role.name if staff and staff.role else None,
                    'permissions': staff.role.permissions if staff and staff.role else {},
                } if staff else None,
                'organization_id': staff.organization_id if staff else None,
                'organization_name': staff.organization.name if staff and staff.organization else None,
                'is_superuser': is_super,
            }
        })

class MeView(APIView):
    """GET /api/core/auth/me/ — returns the currently logged in user's profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Check if user has an explicit staff profile
        staff = getattr(user, 'staff_profile', None)
        
        # If no profile, but they are a superuser, or fallback is needed, resolve via get_current_org
        org = None
        if staff:
            org = staff.organization
        else:
            org = get_current_org(request)
            
        return Response({
            'id': user.id,
            'username': user.username,
            'name': user.get_full_name() or user.username,
            'email': user.email,
            'role': {
                'id': staff.role.id if staff and staff.role else None,
                'name': staff.role.name if staff and staff.role else None,
                'permissions': staff.role.permissions if staff and staff.role else {},
            } if staff else None,
            'organization_id': org.id if org else None,
            'organization_name': org.name if org else None,
            'is_superuser': user.is_superuser,
        })

class RoleViewSet(viewsets.ModelViewSet):
    """CRUD for Roles — accessible by clinic admins."""
    serializer_class = RoleSerializer
    permission_classes = [HasRolePermission]
    permission_module = 'settings'

    def get_queryset(self):
        org = get_current_org(self.request)
        return Role.objects.filter(organization=org)

    def perform_create(self, serializer):
        org = get_current_org(self.request)
        serializer.save(organization=org)

class ClinicStaffViewSet(viewsets.ModelViewSet):
    """CRUD for ClinicStaff members — accessible by clinic admins."""
    serializer_class = ClinicStaffSerializer
    permission_classes = [HasRolePermission]
    permission_module = 'settings'
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        org = get_current_org(self.request)
        return ClinicStaff.objects.filter(organization=org).select_related('user', 'role')

    def create(self, request, *args, **kwargs):
        """Create or link a user + staff profile in one call."""
        org = get_current_org(request)
        data = request.data
        username = data.get('username')
        password = data.get('password')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        email = data.get('email', '')
        role_id = data.get('role_id')

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already taken.'}, status=400)

        check_org_limit(org, 'users')

        user = User.objects.create_user(
            username=username, password=password,
            first_name=first_name, last_name=last_name, email=email
        )
        role = Role.objects.filter(id=role_id, organization=org).first() if role_id else None
        staff = ClinicStaff.objects.create(user=user, organization=org, role=role)
        return Response(ClinicStaffSerializer(staff).data, status=201)

    def partial_update(self, request, *args, **kwargs):
        """Allow changing a staff member's role or active status."""
        instance = self.get_object()
        role_id = request.data.get('role_id')
        if role_id is not None:
            org = get_current_org(request)
            role = Role.objects.filter(id=role_id, organization=org).first()
            instance.role = role
        if 'is_active' in request.data:
            instance.is_active = request.data['is_active']
        instance.save()
        return Response(ClinicStaffSerializer(instance).data)


# ─── Role-Specific Dashboard Stats ───────────────────────────────────────────

from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDate
from clinical.models import Appointment, Consultation, ProcedureSession
from billing.models import Invoice, Payment
from patients.models import Patient
from inventory.models import StockItem, PurchaseOrder
from accounting.models import JournalEntry, Account

class RoleDashboardStatsView(APIView):
    """
    GET /api/core/dashboard/role-stats/
    Returns KPI data tailored to the requesting user's role.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        org = get_current_org(request)
        today = timezone.localdate()
        this_month_start = today.replace(day=1)

        # Determine role from JWT if available, fallback to 'Admin'
        role_name = 'Admin'
        if request.user and request.user.is_authenticated:
            staff = getattr(request.user, 'staff_profile', None)
            if staff and staff.role:
                role_name = staff.role.name

        data = {}

        # ── Shared stats (used by multiple roles) ──────────────────────────
        appts_today = Appointment.objects.filter(organization=org, date_time__date=today)
        appts_today_count = appts_today.count()
        waiting_count = appts_today.filter(status=Appointment.Status.ARRIVED).count()
        unpaid_count = Invoice.objects.filter(
            organization=org, status__in=[Invoice.Status.UNPAID, Invoice.Status.PARTIALLY_PAID]
        ).count()
        revenue_today = Payment.objects.filter(
            organization=org, status=Payment.Status.COMPLETED,
            created_at__date=today
        ).aggregate(total=Sum('amount'))['total'] or 0
        revenue_month = Payment.objects.filter(
            organization=org, status=Payment.Status.COMPLETED,
            created_at__date__gte=this_month_start
        ).aggregate(total=Sum('amount'))['total'] or 0

        role_lower = role_name.lower()
        if 'front' in role_lower or 'desk' in role_lower or 'reception' in role_lower:
            sessions_today = ProcedureSession.objects.filter(
                organization=org, scheduled_at__date=today
            ).count()
            new_patients_today = Patient.objects.filter(
                organization=org, created_at__date=today
            ).count()
            data = {
                'appointments_today': appts_today_count,
                'patients_waiting': waiting_count,
                'sessions_today': sessions_today,
                'new_patients_today': new_patients_today,
                'unpaid_invoices': unpaid_count,
                'revenue_today': float(revenue_today),
            }

        elif 'consult' in role_lower or 'doctor' in role_lower or 'physician' in role_lower:
            consultations_today = Consultation.objects.filter(
                organization=org, created_at__date=today
            ).count()
            draft_consultations = Consultation.objects.filter(
                organization=org, status=Consultation.Status.DRAFT
            ).count()
            data = {
                'appointments_today': appts_today_count,
                'patients_waiting': waiting_count,
                'consultations_today': consultations_today,
                'pending_chart_notes': draft_consultations,
                'consultations_this_month': Consultation.objects.filter(
                    organization=org, created_at__date__gte=this_month_start
                ).count(),
            }

        elif 'therapist' in role_lower or 'therapy' in role_lower or 'aesthetician' in role_lower:
            sessions_today = ProcedureSession.objects.filter(
                organization=org, scheduled_at__date=today
            )
            data = {
                'sessions_today': sessions_today.count(),
                'sessions_in_progress': sessions_today.filter(status=ProcedureSession.Status.STARTED).count(),
                'sessions_completed_today': sessions_today.filter(status=ProcedureSession.Status.COMPLETED).count(),
                'sessions_pending': sessions_today.filter(status=ProcedureSession.Status.PLANNED).count(),
                'sessions_this_month': ProcedureSession.objects.filter(
                    organization=org, scheduled_at__date__gte=this_month_start
                ).count(),
            }

        elif 'store' in role_lower or 'inventory' in role_lower or 'pharmacist' in role_lower or 'warehouse' in role_lower:
            low_stock = StockItem.objects.filter(
                organization=org, quantity_on_hand__lte=5
            ).count()
            pending_pos = PurchaseOrder.objects.filter(
                organization=org, status='DRAFT'
            ).count()
            data = {
                'low_stock_items': low_stock,
                'pending_purchase_orders': pending_pos,
                'total_products': StockItem.objects.filter(organization=org).count(),
                'revenue_today': float(revenue_today),
                'revenue_this_month': float(revenue_month),
            }

        elif 'account' in role_lower or 'finance' in role_lower:
            total_ar = Invoice.objects.filter(
                organization=org, status__in=[Invoice.Status.UNPAID, Invoice.Status.PARTIALLY_PAID]
            ).aggregate(total=Sum('balance_due'))['total'] or 0
            data = {
                'unpaid_invoices': unpaid_count,
                'total_ar': float(total_ar),
                'revenue_today': float(revenue_today),
                'revenue_this_month': float(revenue_month),
                'journal_entries_this_month': JournalEntry.objects.filter(
                    organization=org, date__gte=this_month_start
                ).count(),
            }

        else:
            # Admin / Clinic Admin — full view
            total_patients = Patient.objects.filter(organization=org).count()
            total_ar = Invoice.objects.filter(
                organization=org, status__in=[Invoice.Status.UNPAID, Invoice.Status.PARTIALLY_PAID]
            ).aggregate(total=Sum('balance_due'))['total'] or 0
            data = {
                'appointments_today': appts_today_count,
                'patients_waiting': waiting_count,
                'unpaid_invoices': unpaid_count,
                'total_patients': total_patients,
                'revenue_today': float(revenue_today),
                'revenue_this_month': float(revenue_month),
                'total_ar': float(total_ar),
                'sessions_today': ProcedureSession.objects.filter(
                    organization=org, scheduled_at__date=today
                ).count(),
                'consultations_today': Consultation.objects.filter(
                    organization=org, created_at__date=today
                ).count(),
                'low_stock_items': StockItem.objects.filter(
                    organization=org, quantity_on_hand__lte=5
                ).count(),
            }

        return Response({'role': role_name, 'stats': data})


from .models import BookingSettings
from .serializers import BookingSettingsSerializer

class BookingSettingsView(APIView):
    """GET/PATCH singleton booking settings for the current org."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        org = get_current_org(request)
        settings_obj, _ = BookingSettings.objects.get_or_create(organization=org)
        return Response(BookingSettingsSerializer(settings_obj).data)

    def patch(self, request):
        org = get_current_org(request)
        settings_obj, _ = BookingSettings.objects.get_or_create(organization=org)
        serializer = BookingSettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        from rest_framework import status as drf_status
        return Response(serializer.errors, status=drf_status.HTTP_400_BAD_REQUEST)


class OrgUsageView(APIView):
    """
    GET /api/core/usage/
    Returns the current org's subscription plan, status, feature flags,
    and per-limit usage counters. Used by frontend UsageContext.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from saas.limits import get_usage
        org = get_current_org(request)
        return Response(get_usage(org))
