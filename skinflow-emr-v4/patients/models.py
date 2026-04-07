from django.db import models
from core.models import TimeStampedModel, Organization

class Patient(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='patients')
    
    # Identity
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    
    class GenderChoices(models.TextChoices):
        MALE = 'MALE', 'Male'
        FEMALE = 'FEMALE', 'Female'
        OTHER = 'OTHER', 'Other'
        UNKNOWN = 'UNKNOWN', 'Unknown'
        
    gender = models.CharField(max_length=10, choices=GenderChoices.choices, default=GenderChoices.UNKNOWN)
    
    class BloodGroupChoices(models.TextChoices):
        A_POS = 'A+', 'A+'
        A_NEG = 'A-', 'A-'
        B_POS = 'B+', 'B+'
        B_NEG = 'B-', 'B-'
        AB_POS = 'AB+', 'AB+'
        AB_NEG = 'AB-', 'AB-'
        O_POS = 'O+', 'O+'
        O_NEG = 'O-', 'O-'
        UNKNOWN = 'UNKNOWN', 'Unknown'
        
    blood_group = models.CharField(max_length=10, choices=BloodGroupChoices.choices, default=BloodGroupChoices.UNKNOWN)
    
    # Contact
    phone_primary = models.CharField(max_length=20)
    phone_secondary = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    
    # IDs
    national_id = models.CharField(max_length=50, blank=True)
    passport_number = models.CharField(max_length=50, blank=True)
    
    # Demographics
    class MaritalStatus(models.TextChoices):
        SINGLE = 'SINGLE', 'Single'
        MARRIED = 'MARRIED', 'Married'
        DIVORCED = 'DIVORCED', 'Divorced'
        WIDOWED = 'WIDOWED', 'Widowed'
        
    marital_status = models.CharField(max_length=20, choices=MaritalStatus.choices, blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)
    
    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_relation = models.CharField(max_length=50, blank=True)
    
    # Medical Flags
    has_known_allergies = models.BooleanField(default=False)
    has_chronic_conditions = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = [['organization', 'phone_primary']]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
