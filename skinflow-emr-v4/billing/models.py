from django.db import models
from core.models import TimeStampedModel, Organization
from patients.models import Patient
from masters.models import ProcedureType

class Invoice(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='invoices')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='invoices')
    appointment = models.ForeignKey('clinical.Appointment', null=True, blank=True, on_delete=models.SET_NULL, related_name='invoices')

    
    class Type(models.TextChoices):
        CONSULTATION = 'CONSULTATION', 'Consultation'
        TREATMENT_PLAN = 'TREATMENT_PLAN', 'Treatment Plan'
        PRODUCT = 'PRODUCT', 'Product'
        MIXED = 'MIXED', 'Mixed'
        OTHER = 'OTHER', 'Other'
        
    invoice_type = models.CharField(max_length=20, choices=Type.choices)
    
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        UNPAID = 'UNPAID', 'Unpaid'
        PARTIALLY_PAID = 'PARTIALLY_PAID', 'Partially Paid'
        PAID = 'PAID', 'Paid'
        CANCELLED = 'CANCELLED', 'Cancelled'
        REFUNDED = 'REFUNDED', 'Refunded'
        
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

class InvoiceItem(TimeStampedModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    
    # Generic references via string for now to avoid circular dependency nightmares during initial scaffolding
    reference_id = models.PositiveIntegerField(null=True, blank=True)
    reference_model = models.CharField(max_length=50, blank=True, help_text="e.g. PrescriptionProcedure")
    
    procedure_type = models.ForeignKey(ProcedureType, on_delete=models.SET_NULL, null=True, blank=True)
    # product = models.ForeignKey('inventory.Product', ...)
    
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    net_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    is_fulfilled = models.BooleanField(default=False)
    fulfilled_at = models.DateTimeField(null=True, blank=True)

class Payment(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    
    class Method(models.TextChoices):
        CASH = 'CASH', 'Cash'
        CARD = 'CARD', 'Credit/Debit Card'
        BKASH = 'BKASH', 'bKash'
        NAGAD = 'NAGAD', 'Nagad'
        BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Transfer'
        ADJUSTMENT = 'ADJUSTMENT', 'Adjustment'
        OTHER = 'OTHER', 'Other'
        
    method = models.CharField(max_length=20, choices=Method.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'
        
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    transaction_id = models.CharField(max_length=255, blank=True)

class Entitlement(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='entitlements')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='entitlements')
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='entitlements')
    invoice_item = models.OneToOneField(InvoiceItem, on_delete=models.CASCADE, related_name='entitlement')
    
    class Type(models.TextChoices):
        PROCEDURE = 'PROCEDURE', 'Procedure'
        PRODUCT = 'PRODUCT', 'Product'
        
    entitlement_type = models.CharField(max_length=20, choices=Type.choices)
    
    procedure_type = models.ForeignKey(ProcedureType, on_delete=models.SET_NULL, null=True, blank=True)
    
    total_qty = models.PositiveIntegerField()
    used_qty = models.PositiveIntegerField(default=0)
    remaining_qty = models.PositiveIntegerField()
    
    is_active = models.BooleanField(default=True)
    
    def save(self, *args, **kwargs):
        self.remaining_qty = self.total_qty - self.used_qty
        if self.remaining_qty <= 0:
            self.is_active = False
        super().save(*args, **kwargs)
