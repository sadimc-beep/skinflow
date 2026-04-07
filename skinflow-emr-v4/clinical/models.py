from django.db import models
from core.models import TimeStampedModel, Organization, Provider
from patients.models import Patient
from masters.models import ProcedureType, ProcedureRoom, MedicineMaster, LabTestMaster

class Appointment(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='appointments')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name='appointments')
    date_time = models.DateTimeField()
    
    class Status(models.TextChoices):
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        ARRIVED = 'ARRIVED', 'Arrived' # Fee Paid
        READY_FOR_CONSULT = 'READY_FOR_CONSULT', 'Ready for Consult' # Vitals Done
        IN_CONSULTATION = 'IN_CONSULTATION', 'In Consultation'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        NO_SHOW = 'NO_SHOW', 'No Show'
        
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

class ClinicalIntake(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='clinical_intakes')
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='intake')
    blood_pressure = models.CharField(max_length=20, blank=True)
    pulse = models.CharField(max_length=20, blank=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="in kg")
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="in cm")
    bmi = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    chief_complaint = models.TextField(blank=True)

class PatientAllergy(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='allergies')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='allergies')
    allergen = models.CharField(max_length=255)
    severity = models.CharField(max_length=50, blank=True)

class PatientMedicalHistory(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='medical_history')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medical_history')
    condition = models.CharField(max_length=255)
    diagnosed_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

class Consultation(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='consultations')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='consultations')
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name='consultations')
    appointment = models.OneToOneField(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='consultation')
    
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        FINALIZED = 'FINALIZED', 'Finalized'
        CANCELLED = 'CANCELLED', 'Cancelled'
        
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    
    chief_complaint = models.TextField(blank=True)
    history_of_present_illness = models.TextField(blank=True)
    examination_findings = models.TextField(blank=True)
    assessment_and_plan = models.TextField(blank=True)
    
class ConsultationSymptom(TimeStampedModel):
    consultation = models.ForeignKey(Consultation, on_delete=models.CASCADE, related_name='symptoms')
    symptom = models.CharField(max_length=255)

class ConsultationDiagnosis(TimeStampedModel):
    consultation = models.ForeignKey(Consultation, on_delete=models.CASCADE, related_name='diagnoses')
    diagnosis = models.CharField(max_length=255)

class Prescription(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='prescriptions')
    consultation = models.OneToOneField(Consultation, on_delete=models.CASCADE, related_name='prescription')

class PrescriptionMedication(TimeStampedModel):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='medications')
    medicine = models.ForeignKey(MedicineMaster, on_delete=models.CASCADE)
    dose = models.CharField(max_length=100)
    route = models.CharField(max_length=100)
    frequency = models.CharField(max_length=100)
    duration = models.CharField(max_length=100)
    instructions = models.TextField(blank=True)

class PrescriptionProcedure(TimeStampedModel):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='procedures')
    procedure_type = models.ForeignKey(ProcedureType, on_delete=models.CASCADE)
    sessions_planned = models.PositiveIntegerField(default=1)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    manual_discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_selected_for_billing = models.BooleanField(default=True)
    
    # Billing deduplication
    billed_invoice = models.ForeignKey('billing.Invoice', on_delete=models.SET_NULL, null=True, blank=True, related_name='+')

class PrescriptionProduct(TimeStampedModel):
    # This represents a recommended skincare product
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='products')
    # Will link to inventory.Product via string reference or actual FK
    product_name = models.CharField(max_length=255) # Placeholder until inventory is built
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    manual_discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_selected_for_billing = models.BooleanField(default=True)
    
    billed_invoice = models.ForeignKey('billing.Invoice', on_delete=models.SET_NULL, null=True, blank=True, related_name='+')

class PrescriptionLabTest(TimeStampedModel):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='lab_tests')
    lab_test = models.ForeignKey(LabTestMaster, on_delete=models.CASCADE)
    instructions = models.TextField(blank=True)

class TreatmentPlan(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    
class TreatmentPlanItem(TimeStampedModel):
    treatment_plan = models.ForeignKey(TreatmentPlan, on_delete=models.CASCADE, related_name='items')
    procedure_type = models.ForeignKey(ProcedureType, on_delete=models.CASCADE)
    planned_sessions = models.PositiveIntegerField()

class ProcedureSession(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    treatment_plan_item = models.ForeignKey(TreatmentPlanItem, on_delete=models.CASCADE, null=True, blank=True, related_name='sessions')
    consultation = models.ForeignKey(Consultation, on_delete=models.CASCADE, null=True, blank=True, related_name='procedure_sessions')
    appointment = models.OneToOneField(Appointment, on_delete=models.SET_NULL, null=True, blank=True)
    room = models.ForeignKey(ProcedureRoom, on_delete=models.SET_NULL, null=True, blank=True)
    provider = models.ForeignKey(Provider, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Status(models.TextChoices):
        PLANNED = 'PLANNED', 'Planned'
        STARTED = 'STARTED', 'Started'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        NO_SHOW = 'NO_SHOW', 'No Show'
        
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED)
    
    # Scheduling
    scheduled_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    # Specialized charting data (e.g. Botox zones, Laser settings)
    specialized_data = models.JSONField(default=dict, blank=True)
    
    # Must link to entitlement
    entitlement = models.ForeignKey('billing.Entitlement', on_delete=models.PROTECT, null=True, blank=True, related_name='procedure_sessions')
    
    # Pre-session requirements
    consent_form = models.ForeignKey('ConsentForm', on_delete=models.SET_NULL, null=True, blank=True, related_name='sessions')
    clinical_photo = models.ForeignKey('ClinicalPhoto', on_delete=models.SET_NULL, null=True, blank=True, related_name='sessions')

    # Cost tracking — auto-computed when session is COMPLETED
    consumable_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

class ClinicalNote(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='clinical_notes')
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE)
    note = models.TextField()

class ClinicalPhoto(TimeStampedModel):
    class Category(models.TextChoices):
        REGISTRATION = 'REGISTRATION', 'Registration'
        PRE_SESSION = 'PRE_SESSION', 'Pre-Session'
        POST_SESSION = 'POST_SESSION', 'Post-Session'

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='photos')
    photo = models.ImageField(upload_to='clinical/photos/%Y/%m/', blank=True)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.PRE_SESSION)
    taken_at = models.DateTimeField(null=True, blank=True)
    taken_by = models.ForeignKey('core.ClinicStaff', on_delete=models.SET_NULL, null=True, blank=True, related_name='photos_taken')
    description = models.TextField(blank=True)

class ConsentFormTemplate(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    content = models.TextField()

class ConsentForm(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    template = models.ForeignKey(ConsentFormTemplate, on_delete=models.PROTECT)
    signed_by = models.CharField(max_length=255)
    signed_at = models.DateTimeField()
    is_signed = models.BooleanField(default=False)
    signature = models.ImageField(upload_to='clinical/signatures/%Y/%m/', null=True, blank=True)
