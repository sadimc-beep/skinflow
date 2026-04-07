from rest_framework import serializers
from core.models import Organization, Branch, ClinicStaff, Role, SaaSAdmin
from django.contrib.auth import get_user_model
from .models import (
    Plan, Subscription, SubscriptionInvoice, SubscriptionPayment,
    AuditLog, Announcement, AnnouncementDismissal, ImpersonationSession,
)

User = get_user_model()


# ─── Plan ─────────────────────────────────────────────────────────
class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'


# ─── Branch ───────────────────────────────────────────────────────
class BranchSerializer(serializers.ModelSerializer):
    staff_count = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = ['id', 'organization', 'name', 'address', 'phone', 'is_active', 'is_headquarters', 'staff_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_staff_count(self, obj):
        return obj.staff.filter(is_active=True, user__is_superuser=False).count()


# ─── User (minimal for SaaS admin views) ─────────────────────────
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'date_joined', 'last_login']
        read_only_fields = ['id', 'date_joined', 'last_login']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ─── Role ─────────────────────────────────────────────────────────
class RoleSerializer(serializers.ModelSerializer):
    staff_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ['id', 'organization', 'name', 'description', 'permissions', 'staff_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_staff_count(self, obj):
        return obj.staff_members.filter(is_active=True, user__is_superuser=False).count()


# ─── ClinicStaff ──────────────────────────────────────────────────
class ClinicStaffSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)
    branch_names = serializers.SerializerMethodField()

    class Meta:
        model = ClinicStaff
        fields = ['id', 'user', 'organization', 'role', 'role_name', 'branches', 'branch_names', 'is_org_admin', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_branch_names(self, obj):
        return list(obj.branches.values_list('name', flat=True))


class ClinicStaffCreateSerializer(serializers.Serializer):
    """Create a user + ClinicStaff in one step."""
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    role_id = serializers.IntegerField(required=False, allow_null=True)
    branch_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=[])
    is_org_admin = serializers.BooleanField(default=False)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value


# ─── Subscription ────────────────────────────────────────────────
class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    max_users = serializers.IntegerField(read_only=True)
    max_branches = serializers.IntegerField(read_only=True)
    current_users = serializers.SerializerMethodField()
    current_branches = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = '__all__'

    def get_current_users(self, obj):
        return obj.organization.staff.filter(is_active=True, user__is_superuser=False).count()

    def get_current_branches(self, obj):
        return obj.organization.branches.filter(is_active=True).count()


# ─── SaaS Invoices ───────────────────────────────────────────────
class SubscriptionInvoiceSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='subscription.organization.name', read_only=True)

    class Meta:
        model = SubscriptionInvoice
        fields = '__all__'


class SubscriptionPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPayment
        fields = '__all__'


# ─── Organization (SaaS-level detail) ────────────────────────────
class SaaSOrganizationSerializer(serializers.ModelSerializer):
    subscription_status = serializers.SerializerMethodField()
    plan_name = serializers.SerializerMethodField()
    active_users = serializers.SerializerMethodField()
    branch_count = serializers.SerializerMethodField()
    last_login = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'slug', 'address', 'phone', 'email',
            'is_active', 'onboarded_at', 'created_at',
            'subscription_status', 'plan_name', 'active_users', 'branch_count', 'last_login',
        ]

    def get_subscription_status(self, obj):
        try:
            return obj.subscription.get_status_display()
        except Subscription.DoesNotExist:
            return 'No Subscription'

    def get_plan_name(self, obj):
        try:
            return obj.subscription.plan.name
        except (Subscription.DoesNotExist, AttributeError):
            return None

    def get_active_users(self, obj):
        return obj.staff.filter(is_active=True, user__is_superuser=False).count()

    def get_branch_count(self, obj):
        return obj.branches.filter(is_active=True).count()

    def get_last_login(self, obj):
        last_staff = obj.staff.filter(
            user__last_login__isnull=False
        ).order_by('-user__last_login').first()
        return last_staff.user.last_login if last_staff else None


# ─── Audit Log ───────────────────────────────────────────────────
class AuditLogSerializer(serializers.ModelSerializer):
    user_display = serializers.SerializerMethodField()
    organization_name = serializers.CharField(source='organization.name', read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = '__all__'

    def get_user_display(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return 'System'


# ─── Announcement ────────────────────────────────────────────────
class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = '__all__'


# ─── Impersonation ───────────────────────────────────────────────
class ImpersonationSessionSerializer(serializers.ModelSerializer):
    admin_display = serializers.CharField(source='admin_user.get_full_name', read_only=True)
    org_name = serializers.CharField(source='target_organization.name', read_only=True)

    class Meta:
        model = ImpersonationSession
        fields = '__all__'
        read_only_fields = ['admin_user', 'started_at', 'ended_at']
