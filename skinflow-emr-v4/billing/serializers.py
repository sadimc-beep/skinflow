from rest_framework import serializers
from .models import Invoice, InvoiceItem, Payment, Entitlement
from patients.serializers import PatientSerializer

class InvoiceItemSerializer(serializers.ModelSerializer):
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
    
    class Meta:
        model = Entitlement
        fields = '__all__'
        read_only_fields = ['organization', 'remaining_qty']
