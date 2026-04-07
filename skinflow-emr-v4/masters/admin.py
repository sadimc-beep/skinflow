from django.contrib import admin
from .models import ProcedureCategory, ProcedureType, ProcedureRoom, MedicineMaster, LabTestMaster

@admin.register(ProcedureCategory)
class ProcedureCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization')
    search_fields = ('name',)
    list_filter = ('organization',)

@admin.register(ProcedureType)
class ProcedureTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'base_price', 'consultation_required')
    search_fields = ('name', 'category__name')
    list_filter = ('consultation_required', 'category', 'organization')

@admin.register(ProcedureRoom)
class ProcedureRoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization', 'is_active')
    search_fields = ('name',)
    list_filter = ('is_active', 'organization')

@admin.register(MedicineMaster)
class MedicineMasterAdmin(admin.ModelAdmin):
    list_display = ('brand_name', 'generic_name', 'form', 'strength', 'organization')
    search_fields = ('brand_name', 'generic_name')
    list_filter = ('form', 'organization')

@admin.register(LabTestMaster)
class LabTestMasterAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'organization')
    search_fields = ('name',)
    list_filter = ('organization',)
