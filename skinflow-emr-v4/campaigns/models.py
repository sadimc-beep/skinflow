from django.db import models
from core.models import TimeStampedModel, Organization

class Campaign(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='campaigns')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    class TargetType(models.TextChoices):
        FEE = 'FEE', 'Consultation Fee'
        PROCEDURE = 'PROCEDURE', 'Procedure'
        PACKAGE = 'PACKAGE', 'Package'
        PRODUCT = 'PRODUCT', 'Product'
        
    target = models.CharField(max_length=20, choices=TargetType.choices)
    
    class DiscountType(models.TextChoices):
        PERCENT = 'PERCENT', 'Percentage (%)'
        AMOUNT = 'AMOUNT', 'Fixed Amount ($)'
        NONE = 'NONE', 'No Discount'
        
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices, default=DiscountType.PERCENT)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    total_budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    budget_consumed = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    max_usages_per_patient = models.PositiveIntegerField(default=1)
    
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
