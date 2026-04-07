from django.contrib import admin
from .models import Invoice, InvoiceItem, Payment, Entitlement

class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0
    # Removed total_amount

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('patient', 'invoice_type', 'status', 'total', 'balance_due', 'created_at')
    list_filter = ('status', 'invoice_type', 'created_at')
    search_fields = ('patient__first_name', 'patient__last_name')
    readonly_fields = ('subtotal', 'discount_total', 'tax_total', 'total', 'balance_due')
    inlines = [InvoiceItemInline]

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('invoice', 'amount', 'method', 'status', 'created_at')
    list_filter = ('method', 'status', 'created_at')
    search_fields = ('transaction_id',)

@admin.register(Entitlement)
class EntitlementAdmin(admin.ModelAdmin):
    list_display = ('patient', 'entitlement_type', 'remaining_qty', 'is_active')
    list_filter = ('entitlement_type', 'is_active', 'created_at')
    search_fields = ('patient__first_name', 'patient__last_name')
    readonly_fields = ('used_qty',)
