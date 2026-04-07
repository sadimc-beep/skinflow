from django.contrib import admin
from .models import Campaign

@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ('name', 'target', 'discount_type', 'discount_value', 'start_date', 'end_date', 'is_active')
    search_fields = ('name',)
    list_filter = ('target', 'discount_type', 'is_active')
    readonly_fields = ('budget_consumed', 'created_at', 'updated_at')
