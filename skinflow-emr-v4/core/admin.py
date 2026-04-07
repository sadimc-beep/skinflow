from django.contrib import admin
from .models import Organization, Provider

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)

@admin.register(Provider)
class ProviderAdmin(admin.ModelAdmin):
    list_display = ('user', 'organization', 'provider_type', 'specialization')
    search_fields = ('user__first_name', 'user__last_name', 'specialization')
    list_filter = ('provider_type', 'organization')
