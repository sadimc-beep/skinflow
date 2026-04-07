from django.db import models
from core.models import TimeStampedModel, Organization

class ProcedureCategory(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='procedure_categories')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Procedure Categories"

    def __str__(self):
        return self.name

class ProcedureType(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='procedure_types')
    category = models.ForeignKey(ProcedureCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='procedures')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    expected_default_sessions = models.PositiveIntegerField(default=1)
    
    consultation_required = models.BooleanField(default=True, help_text="If True, cannot be billed directly as a walk-in without a consultation prescription.")
    
    def __str__(self):
        return self.name

class ProcedureRoom(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='procedure_rooms')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class MedicineMaster(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='medicines')
    generic_name = models.CharField(max_length=255)
    brand_name = models.CharField(max_length=255, blank=True)
    strength = models.CharField(max_length=100, blank=True)
    pharmaseed_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    pharmacology_info = models.TextField(blank=True, null=True)
    
    class FormChoices(models.TextChoices):
        TABLET = 'TABLET', 'Tablet'
        CAPSULE = 'CAPSULE', 'Capsule'
        SYRUP = 'SYRUP', 'Syrup'
        OINTMENT = 'OINTMENT', 'Ointment'
        CREAM = 'CREAM', 'Cream'
        INJECTION = 'INJECTION', 'Injection'
        OTHER = 'OTHER', 'Other'
        
    form = models.CharField(max_length=50, choices=FormChoices.choices, default=FormChoices.TABLET)

    def __str__(self):
        return f"{self.brand_name or self.generic_name} {self.strength} ({self.get_form_display()})"

class LabTestMaster(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='lab_tests')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name
