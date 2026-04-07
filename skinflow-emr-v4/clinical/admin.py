from django.contrib import admin
from .models import (
    Appointment, ClinicalIntake, PatientAllergy, PatientMedicalHistory,
    Consultation, ConsultationSymptom, ConsultationDiagnosis,
    Prescription, PrescriptionMedication, PrescriptionProcedure, 
    PrescriptionProduct, PrescriptionLabTest, ProcedureSession,
    TreatmentPlan, TreatmentPlanItem, ClinicalNote, ClinicalPhoto,
    ConsentFormTemplate, ConsentForm
)

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'provider', 'date_time', 'status')
    list_filter = ('status', 'provider')
    search_fields = ('patient__first_name', 'patient__last_name')

@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ('patient', 'provider', 'appointment', 'status', 'created_at')
    list_filter = ('status', 'provider', 'created_at')
    search_fields = ('patient__first_name', 'patient__last_name')

@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('consultation',)

@admin.register(ProcedureSession)
class ProcedureSessionAdmin(admin.ModelAdmin):
    list_display = ('appointment', 'provider', 'status', 'created_at')
    list_filter = ('status', 'provider')

@admin.register(TreatmentPlan)
class TreatmentPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'patient', 'created_at')
    search_fields = ('name', 'patient__first_name')

# Registering remaining models simply
admin.site.register(ClinicalIntake)
admin.site.register(PatientAllergy)
admin.site.register(PatientMedicalHistory)
admin.site.register(ConsultationSymptom)
admin.site.register(ConsultationDiagnosis)
admin.site.register(PrescriptionMedication)
admin.site.register(PrescriptionProcedure)
admin.site.register(PrescriptionProduct)
admin.site.register(PrescriptionLabTest)
admin.site.register(TreatmentPlanItem)
admin.site.register(ClinicalNote)
admin.site.register(ClinicalPhoto)
admin.site.register(ConsentFormTemplate)
admin.site.register(ConsentForm)
