import uuid
import datetime
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

def _default_working_days():
    return ["MON", "TUE", "WED", "THU", "FRI", "SAT"]

class TimeStampedModel(models.Model):
    """
    An abstract base class model that provides self-updating
    ``created_at`` and ``updated_at`` fields.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Organization(TimeStampedModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    # SaaS fields
    is_active = models.BooleanField(default=True, help_text="Disabled by SaaS admin when subscription lapses")
    onboarded_at = models.DateTimeField(null=True, blank=True)
    # Kiosk authentication token — sent as "Authorization: Kiosk <token>" from the tablet
    kiosk_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    def __str__(self):
        return self.name

class Branch(TimeStampedModel):
    """A physical clinic location under an Organization."""
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    is_headquarters = models.BooleanField(default=False)

    class Meta:
        unique_together = ('organization', 'name')
        ordering = ['-is_headquarters', 'name']

    def __str__(self):
        return f"{self.name} — {self.organization.name}"

class Provider(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='provider_profile')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='providers')
    
    class ProviderType(models.TextChoices):
        DOCTOR = 'DOCTOR', _('Doctor')
        THERAPIST = 'THERAPIST', _('Therapist')
        
    provider_type = models.CharField(max_length=20, choices=ProviderType.choices, default=ProviderType.DOCTOR)
    specialization = models.CharField(max_length=255, blank=True)
    registration_number = models.CharField(max_length=100, blank=True)
    max_discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    default_consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.get_provider_type_display()})"

class ClinicSettings(TimeStampedModel):
    """Global configuration settings for the clinic."""
    organization = models.OneToOneField(Organization, on_delete=models.CASCADE, related_name='settings')
    
    # Ledger Mappings for automated double-entry accounting
    # Use string references to avoid circular imports during app initialization
    # ── Receivables & Payables ─────────────────────────────────────────────
    default_ar_account = models.ForeignKey(
        'accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+', help_text="Accounts Receivable (DR on invoice, CR on payment)"
    )
    default_ap_account = models.ForeignKey(
        'accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+', help_text="Accounts Payable (CR on GRN, DR on vendor payment)"
    )

    # ── Revenue (granular by source) ───────────────────────────────────────
    default_revenue_account = models.ForeignKey(
        'accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+', help_text="Generic revenue fallback (used if granular accounts not set)"
    )
    default_consultation_revenue_account = models.ForeignKey(
        'accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+', help_text="Revenue account for consultation fees"
    )
    default_procedure_revenue_account = models.ForeignKey(
        'accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+', help_text="Revenue account for procedure sessions"
    )
    default_product_revenue_account = models.ForeignKey(
        'accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+', help_text="Revenue account for product / pharmacy sales"
    )

    # ── Cost of Goods Sold ─────────────────────────────────────────────────
    default_product_cogs_account = models.ForeignKey(
        'accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+', help_text="COGS account debited when products are fulfilled from stock"
    )
    default_procedure_cogs_account = models.ForeignKey(
        'accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+', help_text="COGS account debited when consumables are issued via requisition"
    )

    # ── Payment Method Accounts ────────────────────────────────────────────
    default_cash_account = models.ForeignKey(
        'accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+', help_text="Asset account for cash payments received"
    )
    default_bank_account = models.ForeignKey(
        'accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+', help_text="Asset account for card / bank transfer payments"
    )
    default_bkash_account = models.ForeignKey(
        'accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+', help_text="Asset account for bKash payments"
    )
    default_nagad_account = models.ForeignKey(
        'accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+', help_text="Asset account for Nagad payments"
    )

    # ── Inventory ──────────────────────────────────────────────────────────
    default_inventory_account = models.ForeignKey(
        'accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+', help_text="Asset account for inventory (CR when stock consumed)"
    )

    def __str__(self):
        return f"Settings for {self.organization.name}"

class BookingSettings(TimeStampedModel):
    """Online booking configuration per clinic."""
    organization = models.OneToOneField(Organization, on_delete=models.CASCADE, related_name='booking_settings')
    is_booking_enabled = models.BooleanField(default=True)
    slot_duration_mins = models.PositiveIntegerField(default=30)
    working_days = models.JSONField(default=_default_working_days, help_text='List of 3-letter day codes: MON, TUE, WED, THU, FRI, SAT, SUN')
    start_time = models.TimeField(default=datetime.time(9, 0))
    end_time = models.TimeField(default=datetime.time(18, 0))
    advance_booking_days = models.PositiveIntegerField(default=30, help_text='How many days ahead patients can book')

    def __str__(self):
        return f"BookingSettings for {self.organization.name}"

class Role(TimeStampedModel):
    """
    Defines a set of permissions for User Roles (e.g., Doctor, Front Desk, Admin).
    Created and maintained by SaaS admin per organization.
    """
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='roles')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # JSON structure storing granular access rights. 
    # Example: {"patients": ["read", "write"], "billing": ["read"]}
    permissions = models.JSONField(default=dict, blank=True)

    class Meta:
        unique_together = ('organization', 'name')

    def __str__(self):
        return f"{self.name} - {self.organization.name}"

class ClinicStaff(TimeStampedModel):
    """
    Links a Django User to their Organization and assigned RBAC Role.
    Provisioned by SaaS admin, not by clinic staff.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='staff_profile')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='staff')
    role = models.ForeignKey(Role, on_delete=models.PROTECT, related_name='staff_members', null=True, blank=True)
    # Branch assignment — M2M for cross-branch staff (e.g., doctor at 3 locations)
    branches = models.ManyToManyField(Branch, blank=True, related_name='staff')
    is_org_admin = models.BooleanField(default=False, help_text="Can view data across all branches")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - {self.role.name if self.role else 'No Role'}"

class SaaSAdmin(TimeStampedModel):
    """
    Super-admin users who manage the entire SaaS platform.
    Separate from ClinicStaff — these are Skinflow platform operators.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saas_profile')
    
    class AdminRole(models.TextChoices):
        OWNER = 'OWNER', 'Owner'
        SUPPORT = 'SUPPORT', 'Support Agent'
        BILLING = 'BILLING', 'Billing Manager'
        VIEWER = 'VIEWER', 'Read-Only Viewer'
    
    admin_role = models.CharField(max_length=20, choices=AdminRole.choices, default=AdminRole.SUPPORT)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"SaaS: {self.user.get_full_name()} ({self.get_admin_role_display()})"

