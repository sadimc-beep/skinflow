from rest_framework import serializers
from .models import (
    Appointment, ClinicalIntake, Consultation, Prescription, PrescriptionProcedure,
    PrescriptionProduct, PrescriptionMedication, ProcedureSession, TreatmentPlan, TreatmentPlanItem,
    ClinicalPhoto, ConsentForm, ConsentFormTemplate,
)
from patients.serializers import PatientSerializer
from core.models import Provider

class ProviderSimpleSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    class Meta:
        model = Provider
        fields = ['id', 'name', 'provider_type', 'specialization', 'default_consultation_fee']

class AppointmentSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    provider_details = ProviderSimpleSerializer(source='provider', read_only=True)
    is_fee_paid = serializers.SerializerMethodField()
    consultation_id = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ['organization']

    def get_consultation_id(self, obj):
        try:
            return obj.consultation.id
        except Exception:
            return None

    def get_is_fee_paid(self, obj):
        if not obj.fee or obj.fee <= 0:
            return True
        from billing.models import Invoice
        invoice = Invoice.objects.filter(appointment=obj, status=Invoice.Status.PAID).first()
        return invoice is not None

class ClinicalIntakeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicalIntake
        fields = '__all__'
        read_only_fields = ['organization']

class PrescriptionMedicationSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.generic_name', read_only=True)
    pharmaseed_data = serializers.DictField(write_only=True, required=False)

    class Meta:
        model = PrescriptionMedication
        fields = '__all__'
        extra_kwargs = {
            'medicine': {'required': False, 'allow_null': True}
        }

    def create(self, validated_data):
        pharmaseed_data = validated_data.pop('pharmaseed_data', None)
        
        if pharmaseed_data and 'pharmaseed_id' in pharmaseed_data:
            from masters.models import MedicineMaster
            from core.api_auth import get_current_org
            org = get_current_org(self.context['request'])
            
            pharmaseed_id = pharmaseed_data.get('pharmaseed_id')
            defaults_data = {
                'organization': org,
                'generic_name': pharmaseed_data.get('generic_name', 'Unknown'),
                'brand_name': pharmaseed_data.get('brand_name', ''),
                'strength': pharmaseed_data.get('strength', ''),
                'pharmacology_info': pharmaseed_data.get('pharmacology_info', ''),
            }
            medicine, created = MedicineMaster.objects.update_or_create(
                pharmaseed_id=pharmaseed_id,
                defaults=defaults_data
            )
            validated_data['medicine'] = medicine
            
        return super().create(validated_data)

class PrescriptionProcedureSerializer(serializers.ModelSerializer):
    procedure_name = serializers.CharField(source='procedure_type.name', read_only=True)
    class Meta:
        model = PrescriptionProcedure
        fields = '__all__'

class PrescriptionProductSerializer(serializers.ModelSerializer):
    stock_quantity = serializers.SerializerMethodField()

    class Meta:
        model = PrescriptionProduct
        fields = '__all__'

    def get_stock_quantity(self, obj):
        if not obj.product_id:
            return None
        from inventory.models import StockItem
        from django.db.models import Sum
        result = StockItem.objects.filter(product_id=obj.product_id).aggregate(total=Sum('quantity'))
        total = result['total']
        return float(total) if total is not None else 0.0

class PrescriptionSerializer(serializers.ModelSerializer):
    medications = PrescriptionMedicationSerializer(many=True, read_only=True)
    procedures = PrescriptionProcedureSerializer(many=True, read_only=True)
    products = PrescriptionProductSerializer(many=True, read_only=True)
    
    class Meta:
        model = Prescription
        fields = '__all__'
        read_only_fields = ['organization']

class ConsultationSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    provider_details = ProviderSimpleSerializer(source='provider', read_only=True)
    prescription = PrescriptionSerializer(read_only=True)
    
    class Meta:
        model = Consultation
        fields = '__all__'
        read_only_fields = ['organization']

class ConsentFormTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsentFormTemplate
        fields = ['id', 'name', 'content', 'organization', 'created_at', 'updated_at']
        read_only_fields = ['organization', 'created_at', 'updated_at']


class ConsentFormSerializer(serializers.ModelSerializer):
    signature_url = serializers.SerializerMethodField()
    template_details = ConsentFormTemplateSerializer(source='template', read_only=True)

    class Meta:
        model = ConsentForm
        fields = [
            'id', 'patient', 'template', 'template_details',
            'signed_by', 'signed_at', 'is_signed',
            'signature', 'signature_url', 'created_at',
        ]
        read_only_fields = ['organization', 'signature_url', 'template_details']

    def get_signature_url(self, obj):
        request = self.context.get('request')
        if obj.signature and request:
            return request.build_absolute_uri(obj.signature.url)
        return None


class ProcedureSessionSerializer(serializers.ModelSerializer):
    appointment_details = AppointmentSerializer(source='appointment', read_only=True)
    provider_details = ProviderSimpleSerializer(source='provider', read_only=True)
    patient_details = serializers.SerializerMethodField()
    procedure_name = serializers.SerializerMethodField()
    consent_form_details = ConsentFormSerializer(source='consent_form', read_only=True)

    class Meta:
        model = ProcedureSession
        fields = '__all__'
        read_only_fields = ['organization']

    def get_patient_details(self, obj):
        # Try appointment first, fall back to entitlement
        patient = None
        if obj.appointment and obj.appointment.patient:
            patient = obj.appointment.patient
        elif obj.entitlement and obj.entitlement.patient:
            patient = obj.entitlement.patient
        if patient:
            return {
                'id': patient.id,
                'first_name': patient.first_name,
                'last_name': patient.last_name,
                'phone_primary': patient.phone_primary,
            }
        return None
    
    def get_procedure_name(self, obj):
        if obj.entitlement and obj.entitlement.procedure_type:
            return obj.entitlement.procedure_type.name
        if obj.treatment_plan_item and obj.treatment_plan_item.procedure_type:
            return obj.treatment_plan_item.procedure_type.name
        return None

class TreatmentPlanItemSerializer(serializers.ModelSerializer):
    procedure_name = serializers.CharField(source='procedure_type.name', read_only=True)
    class Meta:
        model = TreatmentPlanItem
        fields = '__all__'

class TreatmentPlanSerializer(serializers.ModelSerializer):
    items = TreatmentPlanItemSerializer(many=True, read_only=True)
    class Meta:
        model = TreatmentPlan
        fields = '__all__'
        read_only_fields = ['organization']

class ClinicalPhotoSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = ClinicalPhoto
        fields = ['id', 'patient', 'photo', 'photo_url', 'category', 'taken_at', 'taken_by', 'description', 'created_at']
        read_only_fields = ['organization', 'photo_url']

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo and request:
            return request.build_absolute_uri(obj.photo.url)
        return None
