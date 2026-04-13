from rest_framework import serializers
from .models import (
    Product, StockLocation, StockItem,
    ProductCategory, UnitOfMeasure, StockMovement,
    InventoryRequisition, InventoryRequisitionLine,
    Vendor, PurchaseOrder, PurchaseOrderLine,
    GRN, GRNLine, VendorBill
)

class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = '__all__'
        read_only_fields = ['organization']

class UnitOfMeasureSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitOfMeasure
        fields = '__all__'
        read_only_fields = ['organization']

class ProductSerializer(serializers.ModelSerializer):
    stock_quantity = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['organization']

    def get_stock_quantity(self, obj):
        from django.db.models import Sum
        result = obj.stock_items.aggregate(total=Sum('quantity'))
        total = result['total']
        return float(total) if total is not None else 0.0

class StockLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockLocation
        fields = '__all__'
        read_only_fields = ['organization']

class StockItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    
    class Meta:
        model = StockItem
        fields = '__all__'
        read_only_fields = ['organization']

class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ['organization']

class InventoryRequisitionLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_uom = serializers.CharField(source='product.uom.abbreviation', read_only=True)

    class Meta:
        model = InventoryRequisitionLine
        fields = '__all__'
        read_only_fields = ['requisition']

class InventoryRequisitionWriteLineSerializer(serializers.Serializer):
    product = serializers.IntegerField()
    quantity_requested = serializers.DecimalField(max_digits=10, decimal_places=2)


class InventoryRequisitionSerializer(serializers.ModelSerializer):
    lines = InventoryRequisitionLineSerializer(many=True, read_only=True)
    lines_input = InventoryRequisitionWriteLineSerializer(many=True, write_only=True, required=False)
    requested_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    session_details = serializers.SerializerMethodField()

    class Meta:
        model = InventoryRequisition
        fields = '__all__'
        read_only_fields = ['organization', 'requested_by', 'approved_by']

    def get_requested_by_name(self, obj):
        if obj.requested_by:
            return obj.requested_by.get_full_name() or obj.requested_by.username
        return None

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name() or obj.approved_by.username
        return None

    def get_session_details(self, obj):
        if not obj.session:
            return None
        session = obj.session
        patient = None
        if session.appointment and session.appointment.patient:
            patient = session.appointment.patient
        elif session.entitlement and session.entitlement.patient:
            patient = session.entitlement.patient
        procedure_name = None
        if session.entitlement and session.entitlement.procedure_type:
            procedure_name = session.entitlement.procedure_type.name
        elif session.treatment_plan_item and session.treatment_plan_item.procedure_type:
            procedure_name = session.treatment_plan_item.procedure_type.name
        return {
            'id': session.id,
            'status': session.status,
            'patient_name': f"{patient.first_name} {patient.last_name}".strip() if patient else None,
            'procedure_name': procedure_name,
        }

    def create(self, validated_data):
        lines_data = validated_data.pop('lines_input', [])
        requisition = InventoryRequisition.objects.create(**validated_data)
        for line in lines_data:
            product = Product.objects.get(pk=line['product'], organization=requisition.organization)
            InventoryRequisitionLine.objects.create(
                requisition=requisition,
                product=product,
                quantity_requested=line['quantity_requested'],
            )
        return requisition

class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'
        read_only_fields = ['organization']

class PurchaseOrderLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_uom = serializers.CharField(source='product.uom.abbreviation', read_only=True)

    class Meta:
        model = PurchaseOrderLine
        fields = '__all__'
        read_only_fields = ['po']

class PurchaseOrderSerializer(serializers.ModelSerializer):
    lines = PurchaseOrderLineSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = '__all__'
        read_only_fields = ['organization']

class GRNLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_uom = serializers.CharField(source='product.uom.abbreviation', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = GRNLine
        fields = '__all__'
        read_only_fields = ['grn']

class GRNSerializer(serializers.ModelSerializer):
    lines = GRNLineSerializer(many=True, read_only=True)
    po_number = serializers.CharField(source='po.po_number', read_only=True)
    
    class Meta:
        model = GRN
        fields = '__all__'
        read_only_fields = ['organization']

class VendorBillSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    grn_number = serializers.CharField(source='grn.grn_number', read_only=True)
    
    class Meta:
        model = VendorBill
        fields = '__all__'
        read_only_fields = ['organization']
