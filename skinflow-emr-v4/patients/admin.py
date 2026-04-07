from django.contrib import admin
from .models import Patient

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'phone_primary', 'organization', 'created_at')
    search_fields = ('first_name', 'last_name', 'phone_primary', 'email', 'national_id')
    list_filter = ('organization', 'gender', 'has_known_allergies', 'has_chronic_conditions')
    readonly_fields = ('created_at', 'updated_at')
