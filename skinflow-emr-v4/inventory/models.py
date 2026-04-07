from django.db import models
from django.conf import settings
from core.models import TimeStampedModel, Organization

class ProductCategory(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='product_categories')
    name = models.CharField(max_length=255)

class UnitOfMeasure(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    name = models.CharField(max_length=50) # Piece, Bottle, Strip, Tube
    abbreviation = models.CharField(max_length=10)

class Product(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(ProductCategory, on_delete=models.SET_NULL, null=True, blank=True)
    uom = models.ForeignKey(UnitOfMeasure, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True, blank=True, null=True)
    
    class Type(models.TextChoices):
        MEDICINE = 'MEDICINE', 'Medicine'
        SKINCARE = 'SKINCARE', 'Skincare'
        CONSUMABLE = 'CONSUMABLE', 'Consumable'
        DEVICE = 'DEVICE', 'Device'
        OTHER = 'OTHER', 'Other'
        
    product_type = models.CharField(max_length=20, choices=Type.choices)
    
    is_stock_tracked = models.BooleanField(default=True)
    is_saleable = models.BooleanField(default=True)
    
    # Classification for Requisition Workflows
    is_procedure_item = models.BooleanField(default=False, help_text="Can be requested via Clinical Requisitions (Session Page)")
    is_clinic_item = models.BooleanField(default=False, help_text="Can be requested via General Requisitions (Inventory Page)")
    
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

class StockLocation(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    name = models.CharField(max_length=255) # e.g., Main Pharmacy, Laser Room Storage

class StockItem(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_items')
    location = models.ForeignKey(StockLocation, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    class Meta:
        unique_together = [['product', 'location']]

class StockMovement(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    location = models.ForeignKey(StockLocation, on_delete=models.CASCADE)
    
    class Type(models.TextChoices):
        IN = 'IN', 'Stock In'
        OUT = 'OUT', 'Stock Out'
        ADJUST = 'ADJUST', 'Adjustment'
        
    movement_type = models.CharField(max_length=10, choices=Type.choices)
    quantity = models.DecimalField(max_digits=10, decimal_places=2) # Positive or negative dependent on type
    reference_id = models.CharField(max_length=255, blank=True)

class InventoryRequisition(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)

    class RequisitionType(models.TextChoices):
        CLINICAL = 'CLINICAL', 'Clinical (Procedure)'
        GENERAL = 'GENERAL', 'General (Clinic)'

    requisition_type = models.CharField(max_length=20, choices=RequisitionType.choices, default=RequisitionType.GENERAL)

    # Proper FK to ProcedureSession — null for GENERAL requisitions
    session = models.ForeignKey(
        'clinical.ProcedureSession',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='requisitions',
    )

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        FULFILLED = 'FULFILLED', 'Fulfilled'
        CANCELLED = 'CANCELLED', 'Cancelled'

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)

    notes = models.TextField(blank=True)
    rejection_notes = models.TextField(blank=True)

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='requested_requisitions',
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='approved_requisitions',
    )
    
class InventoryRequisitionLine(TimeStampedModel):
    requisition = models.ForeignKey(InventoryRequisition, on_delete=models.CASCADE, related_name='lines')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity_requested = models.DecimalField(max_digits=10, decimal_places=2)
    quantity_fulfilled = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

class Vendor(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    tax_id = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return self.name

class PurchaseOrder(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='purchase_orders')
    po_number = models.CharField(max_length=100, unique=True)
    order_date = models.DateField()
    expected_delivery_date = models.DateField(null=True, blank=True)
    
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SENT = 'SENT', 'Sent'
        PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED', 'Partially Received'
        RECEIVED = 'RECEIVED', 'Received'
        CANCELLED = 'CANCELLED', 'Cancelled'
        
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

class PurchaseOrderLine(TimeStampedModel):
    po = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='lines')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    received_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

class GRN(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    po = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='grns')
    grn_number = models.CharField(max_length=100, unique=True)
    receive_date = models.DateField()
    received_by = models.CharField(max_length=255, blank=True)
    
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)

class GRNLine(TimeStampedModel):
    grn = models.ForeignKey(GRN, on_delete=models.CASCADE, related_name='lines')
    po_line = models.ForeignKey(PurchaseOrderLine, on_delete=models.SET_NULL, null=True, blank=True, related_name='grn_lines')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    location = models.ForeignKey(StockLocation, on_delete=models.CASCADE)
    quantity_received = models.DecimalField(max_digits=10, decimal_places=2)
    batch_number = models.CharField(max_length=100, blank=True)
    expiry_date = models.DateField(null=True, blank=True)

class VendorBill(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='bills')
    grn = models.ForeignKey(GRN, on_delete=models.SET_NULL, null=True, blank=True, related_name='bills')
    bill_number = models.CharField(max_length=100)
    bill_date = models.DateField()
    due_date = models.DateField(null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    class Status(models.TextChoices):
        UNPAID = 'UNPAID', 'Unpaid'
        PARTIALLY_PAID = 'PARTIALLY_PAID', 'Partially Paid'
        PAID = 'PAID', 'Paid'
        
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UNPAID)
