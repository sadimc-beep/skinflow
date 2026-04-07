from django.db import models
from django.conf import settings
from core.models import TimeStampedModel, Organization


# ─── Subscription Plans ────────────────────────────────────────────
class Plan(TimeStampedModel):
    """SaaS subscription plans defined by the super admin."""
    name = models.CharField(max_length=100)  # "Starter", "Professional", "Enterprise"
    description = models.TextField(blank=True)
    base_price_monthly = models.DecimalField(max_digits=10, decimal_places=2)
    base_price_annual = models.DecimalField(max_digits=10, decimal_places=2)
    included_users = models.PositiveIntegerField(default=3)
    price_per_extra_user = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    included_branches = models.PositiveIntegerField(default=1)
    price_per_extra_branch = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    # Hard limits — 0 = unlimited
    max_patients = models.PositiveIntegerField(default=0, help_text='0 = unlimited')
    max_monthly_appointments = models.PositiveIntegerField(default=0, help_text='0 = unlimited (enforcement deferred)')
    # Feature flags — keys: inventory, accounting, procedure_sessions, packages,
    #   marketing_app, custom_reports, api_access, multi_branch, online_booking
    features = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'base_price_monthly']

    def __str__(self):
        return self.name


# ─── Subscriptions ─────────────────────────────────────────────────
class Subscription(TimeStampedModel):
    """Active subscription linking an Organization to a Plan."""
    organization = models.OneToOneField(Organization, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='subscriptions')

    class BillingCycle(models.TextChoices):
        MONTHLY = 'MONTHLY', 'Monthly'
        ANNUAL = 'ANNUAL', 'Annual'

    billing_cycle = models.CharField(max_length=10, choices=BillingCycle.choices, default=BillingCycle.MONTHLY)

    class Status(models.TextChoices):
        TRIAL = 'TRIAL', 'Trial'
        ACTIVE = 'ACTIVE', 'Active'
        PAST_DUE = 'PAST_DUE', 'Past Due'
        SUSPENDED = 'SUSPENDED', 'Suspended'
        CANCELLED = 'CANCELLED', 'Cancelled'

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TRIAL)
    current_period_start = models.DateField()
    current_period_end = models.DateField()
    next_billing_date = models.DateField(null=True, blank=True)

    # Add-ons
    extra_users = models.PositiveIntegerField(default=0)
    extra_branches = models.PositiveIntegerField(default=0)
    has_marketing_addon = models.BooleanField(default=False)

    # Per-org limit overrides set by super admin (null = use plan default)
    # Example: {"patients": 600} overrides plan.max_patients for this org
    limit_overrides = models.JSONField(default=dict, blank=True)

    # Computed total (updated on save)
    monthly_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        # Compute monthly amount
        base = self.plan.base_price_monthly if self.billing_cycle == 'MONTHLY' else (self.plan.base_price_annual / 12)
        users_cost = self.extra_users * self.plan.price_per_extra_user
        branches_cost = self.extra_branches * self.plan.price_per_extra_branch
        self.monthly_amount = base + users_cost + branches_cost
        super().save(*args, **kwargs)

    @property
    def max_users(self):
        return self.plan.included_users + self.extra_users

    @property
    def max_branches(self):
        return self.plan.included_branches + self.extra_branches

    @property
    def effective_max_patients(self):
        """Returns override if set, else plan default. 0 = unlimited."""
        return self.limit_overrides.get('patients', self.plan.max_patients)

    def __str__(self):
        return f"{self.organization.name} — {self.plan.name} ({self.get_status_display()})"


# ─── SaaS-Level Invoices ──────────────────────────────────────────
class SubscriptionInvoice(TimeStampedModel):
    """
    SaaS-level invoices for subscription billing.
    Separate from clinic billing invoices (billing.Invoice).
    """
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='invoices')
    invoice_number = models.CharField(max_length=50, unique=True)
    period_start = models.DateField()
    period_end = models.DateField()
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SENT = 'SENT', 'Sent'
        PAID = 'PAID', 'Paid'
        OVERDUE = 'OVERDUE', 'Overdue'
        VOID = 'VOID', 'Void'

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    due_date = models.DateField()
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.invoice_number} — {self.subscription.organization.name}"


# ─── SaaS Payments (SSLCommerz) ───────────────────────────────────
class SubscriptionPayment(TimeStampedModel):
    """Payment record against a SaaS invoice, via SSLCommerz or manual."""
    invoice = models.ForeignKey(SubscriptionInvoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Method(models.TextChoices):
        SSLCOMMERZ = 'SSLCOMMERZ', 'SSLCommerz'
        BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Transfer'
        MANUAL = 'MANUAL', 'Manual'

    method = models.CharField(max_length=20, choices=Method.choices, default=Method.SSLCOMMERZ)
    transaction_id = models.CharField(max_length=255, blank=True)
    gateway_response = models.JSONField(default=dict, blank=True)

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SUCCESS = 'SUCCESS', 'Success'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)

    def __str__(self):
        return f"Payment {self.transaction_id or self.id} — {self.get_status_display()}"


# ─── Impersonation Sessions ──────────────────────────────────────
class ImpersonationSession(TimeStampedModel):
    """Tracks when a SaaS admin impersonates a clinic for support."""
    admin_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='impersonation_sessions')
    target_organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    target_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='impersonated_sessions')
    reason = models.TextField(help_text="Why this impersonation was initiated")
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Impersonation: {self.admin_user} → {self.target_organization.name}"


# ─── Audit Log ────────────────────────────────────────────────────
class AuditLog(TimeStampedModel):
    """
    Global audit trail for both SaaS-level and clinic-level actions.
    """
    # Who
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    impersonated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='impersonation_audit_logs')
    # Where
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    # What
    action = models.CharField(max_length=100)  # e.g., 'user.created', 'subscription.upgraded'
    resource_type = models.CharField(max_length=50)  # e.g., 'User', 'Subscription', 'Role'
    resource_id = models.CharField(max_length=50, blank=True)
    # Details
    changes = models.JSONField(default=dict, blank=True)  # {"field": {"old": "x", "new": "y"}}
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', '-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action']),
        ]

    def __str__(self):
        return f"{self.action} by {self.user} at {self.created_at}"


# ─── Announcements ───────────────────────────────────────────────
class Announcement(TimeStampedModel):
    """Broadcast messages from SaaS admin to clinics."""
    title = models.CharField(max_length=200)
    body = models.TextField()

    class Severity(models.TextChoices):
        INFO = 'INFO', 'Info'
        WARNING = 'WARNING', 'Warning'
        CRITICAL = 'CRITICAL', 'Critical'

    severity = models.CharField(max_length=10, choices=Severity.choices, default=Severity.INFO)

    class Target(models.TextChoices):
        ALL = 'ALL', 'All Organizations'
        SPECIFIC = 'SPECIFIC', 'Specific Organizations'

    target = models.CharField(max_length=10, choices=Target.choices, default=Target.ALL)
    target_organizations = models.ManyToManyField(Organization, blank=True, related_name='announcements')
    published_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-published_at']

    def __str__(self):
        return f"[{self.get_severity_display()}] {self.title}"


class AnnouncementDismissal(TimeStampedModel):
    """Tracks which users have dismissed an announcement."""
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name='dismissals')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dismissed_announcements')

    class Meta:
        unique_together = ('announcement', 'user')
