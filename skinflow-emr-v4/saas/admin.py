from django.contrib import admin
from .models import (
    Plan, Subscription, SubscriptionInvoice, SubscriptionPayment,
    ImpersonationSession, AuditLog, Announcement, AnnouncementDismissal,
)

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'base_price_monthly', 'base_price_annual', 'included_users', 'included_branches', 'is_active')
    list_filter = ('is_active',)

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('organization', 'plan', 'status', 'billing_cycle', 'monthly_amount', 'current_period_end')
    list_filter = ('status', 'billing_cycle', 'plan')
    search_fields = ('organization__name',)

@admin.register(SubscriptionInvoice)
class SubscriptionInvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'subscription', 'total', 'status', 'due_date', 'paid_at')
    list_filter = ('status',)

@admin.register(SubscriptionPayment)
class SubscriptionPaymentAdmin(admin.ModelAdmin):
    list_display = ('invoice', 'amount', 'method', 'status', 'transaction_id')
    list_filter = ('status', 'method')

@admin.register(ImpersonationSession)
class ImpersonationSessionAdmin(admin.ModelAdmin):
    list_display = ('admin_user', 'target_organization', 'started_at', 'ended_at', 'reason')
    list_filter = ('started_at',)

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'user', 'organization', 'resource_type', 'resource_id', 'created_at')
    list_filter = ('action', 'resource_type')
    search_fields = ('action', 'user__username', 'organization__name')
    readonly_fields = ('user', 'impersonated_by', 'organization', 'action', 'resource_type', 'resource_id', 'changes', 'ip_address', 'user_agent', 'created_at')

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'severity', 'target', 'published_at', 'expires_at')
    list_filter = ('severity', 'target')
