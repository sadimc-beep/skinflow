from rest_framework import serializers
from .models import Invoice, InvoiceItem, Payment, Entitlement
from patients.serializers import PatientSerializer

class InvoiceItemSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    invoice_status = serializers.CharField(source='invoice.status', read_only=True)
    invoice_paid_at = serializers.SerializerMethodField()

    def get_patient_name(self, obj):
        p = obj.invoice.patient
        if not p:
            return ''
        return f"{p.first_name} {p.last_name}".strip()

    def get_invoice_paid_at(self, obj):
        payment = obj.invoice.payments.filter(status='COMPLETED').order_by('-created_at').first()
        return payment.created_at.isoformat() if payment else None

    class Meta:
        model = InvoiceItem
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['organization', 'subtotal', 'discount_total', 'tax_total', 'total', 'balance_due']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['organization']

class EntitlementSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    procedure_name = serializers.CharField(source='procedure_type.name', read_only=True)
    planned_qty = serializers.SerializerMethodField()
    started_qty = serializers.SerializerMethodField()

    def get_planned_qty(self, obj):
        return obj.procedure_sessions.filter(status='PLANNED').count()

    def get_started_qty(self, obj):
        return obj.procedure_sessions.filter(status='STARTED').count()

    class Meta:
        model = Entitlement
        fields = '__all__'
        read_only_fields = ['organization', 'remaining_qty']
