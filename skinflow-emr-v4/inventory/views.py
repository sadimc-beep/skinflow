from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.decorators import method_decorator

from django.db import transaction

from .models import (
    Product, StockLocation, StockItem,
    ProductCategory, UnitOfMeasure, StockMovement,
    InventoryRequisition, InventoryRequisitionLine,
    Vendor, PurchaseOrder, PurchaseOrderLine,
    GRN, GRNLine, VendorBill
)
from .serializers import (
    ProductSerializer, StockLocationSerializer, StockItemSerializer,
    ProductCategorySerializer, UnitOfMeasureSerializer, StockMovementSerializer,
    InventoryRequisitionSerializer, InventoryRequisitionLineSerializer,
    GRNSerializer, GRNLineSerializer, VendorBillSerializer,
    VendorSerializer, PurchaseOrderSerializer, PurchaseOrderLineSerializer
)
from accounting.services import AccountingService
from core.api_auth import get_current_org
from core.permissions import HasRolePermission
from patients.views import StandardResultsSetPagination


def _update_session_consumable_cost(session):
    """Sum cost_price × quantity_fulfilled across all FULFILLED clinical requisitions for a session."""
    from django.db.models import Sum, F
    from decimal import Decimal
    total = (
        InventoryRequisitionLine.objects
        .filter(
            requisition__session=session,
            requisition__status=InventoryRequisition.Status.FULFILLED,
        )
        .aggregate(total=Sum(F('quantity_fulfilled') * F('product__cost_price')))
    )['total'] or Decimal('0.00')
    session.consumable_cost = total
    session.save(update_fields=['consumable_cost'])

class InventoryBaseViewSet(viewsets.ModelViewSet):
    permission_classes = [HasRolePermission]
    permission_module = 'inventory'
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        org = get_current_org(self.request)
        return self.queryset.filter(organization=org)

    def perform_create(self, serializer):
        org = get_current_org(self.request)
        serializer.save(organization=org)

class ProductViewSet(InventoryBaseViewSet):
    queryset = Product.objects.all().select_related('category', 'uom')
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['product_type', 'is_saleable']
    search_fields = ['name', 'sku']

    def get_permissions(self):
        # Any authenticated org member can list/retrieve products (needed for consultation dropdowns)
        # Only inventory-level users can create/update/delete
        if self.action in ('list', 'retrieve'):
            return [permissions.IsAuthenticated()]
        return [HasRolePermission()]

class StockLocationViewSet(InventoryBaseViewSet):
    queryset = StockLocation.objects.all()
    serializer_class = StockLocationSerializer

class StockItemViewSet(InventoryBaseViewSet):
    queryset = StockItem.objects.all().select_related('product', 'location')
    serializer_class = StockItemSerializer

class ProductCategoryViewSet(InventoryBaseViewSet):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer

class UnitOfMeasureViewSet(InventoryBaseViewSet):
    queryset = UnitOfMeasure.objects.all()
    serializer_class = UnitOfMeasureSerializer

class StockMovementViewSet(InventoryBaseViewSet):
    queryset = StockMovement.objects.all().select_related('product', 'location')
    serializer_class = StockMovementSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        org = get_current_org(self.request)
        movement = serializer.save(organization=org)
        
        # Automatically update the StockItem quantity
        stock_item, created = StockItem.objects.get_or_create(
            organization=org,
            product=movement.product,
            location=movement.location,
            defaults={'quantity': 0}
        )
        
        if movement.movement_type == StockMovement.Type.IN:
            stock_item.quantity += movement.quantity
        elif movement.movement_type == StockMovement.Type.OUT:
            stock_item.quantity -= movement.quantity
        elif movement.movement_type == StockMovement.Type.ADJUST:
            stock_item.quantity += movement.quantity # Treat adjust quantity as delta
             
        stock_item.save()

class InventoryRequisitionViewSet(InventoryBaseViewSet):
    queryset = InventoryRequisition.objects.all().prefetch_related(
        'lines__product', 'session__entitlement__procedure_type',
        'session__appointment__patient',
    ).select_related('requested_by', 'approved_by', 'session')
    serializer_class = InventoryRequisitionSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['status', 'requisition_type', 'session']

    def perform_create(self, serializer):
        org = get_current_org(self.request)
        serializer.save(organization=org, requested_by=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        requisition = self.get_object()
        if requisition.status != InventoryRequisition.Status.SUBMITTED:
            return Response(
                {"detail": "Only SUBMITTED requisitions can be approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        requisition.status = InventoryRequisition.Status.APPROVED
        requisition.approved_by = request.user
        requisition.save(update_fields=['status', 'approved_by'])
        return Response({"detail": "Requisition approved.", "status": requisition.status})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        requisition = self.get_object()
        if requisition.status != InventoryRequisition.Status.SUBMITTED:
            return Response(
                {"detail": "Only SUBMITTED requisitions can be rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        notes = request.data.get('rejection_notes', '').strip()
        if not notes:
            return Response(
                {"detail": "rejection_notes is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        requisition.status = InventoryRequisition.Status.REJECTED
        requisition.rejection_notes = notes
        requisition.approved_by = request.user
        requisition.save(update_fields=['status', 'rejection_notes', 'approved_by'])
        return Response({"detail": "Requisition rejected.", "status": requisition.status})

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def fulfill(self, request, pk=None):
        requisition = self.get_object()
        org = get_current_org(request)

        if requisition.status == InventoryRequisition.Status.FULFILLED:
            return Response({"detail": "Requisition is already fulfilled."}, status=status.HTTP_400_BAD_REQUEST)
        if requisition.status != InventoryRequisition.Status.APPROVED:
            return Response(
                {"detail": "Requisition must be APPROVED before it can be fulfilled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        location = StockLocation.objects.filter(organization=org).first()
        if not location:
            location = StockLocation.objects.create(organization=org, name="Main Store", is_active=True)

        for line in requisition.lines.all():
            StockMovement.objects.create(
                organization=org,
                product=line.product,
                location=location,
                movement_type=StockMovement.Type.OUT,
                quantity=line.quantity_requested,
                reference_id=str(requisition.id),
                notes=f"Issued for Requisition REQ-{requisition.id}",
            )
            stock_item, _ = StockItem.objects.get_or_create(
                organization=org,
                product=line.product,
                location=location,
                defaults={'quantity': 0},
            )
            stock_item.quantity -= line.quantity_requested
            stock_item.save()

            line.quantity_fulfilled = line.quantity_requested
            line.save()

        requisition.status = InventoryRequisition.Status.FULFILLED
        requisition.save(update_fields=['status'])

        # B3: update session consumable_cost if this is a clinical requisition
        if requisition.session_id:
            _update_session_consumable_cost(requisition.session)

        return Response({"detail": "Requisition fulfilled successfully.", "status": requisition.status})

class InventoryRequisitionLineViewSet(InventoryBaseViewSet):
    queryset = InventoryRequisitionLine.objects.all().select_related('product', 'requisition')
    serializer_class = InventoryRequisitionLineSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['requisition']

    def perform_create(self, serializer):
        # Override so we don't try to save 'organization' on a line
        serializer.save()

class VendorViewSet(InventoryBaseViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'contact_name', 'email']

class PurchaseOrderViewSet(InventoryBaseViewSet):
    queryset = PurchaseOrder.objects.all().select_related('vendor').prefetch_related('lines__product')
    serializer_class = PurchaseOrderSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['status', 'vendor']
    search_fields = ['po_number']

class PurchaseOrderLineViewSet(InventoryBaseViewSet):
    queryset = PurchaseOrderLine.objects.all().select_related('product', 'po')
    serializer_class = PurchaseOrderLineSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['po']

    def perform_create(self, serializer):
        serializer.save()

class GRNViewSet(InventoryBaseViewSet):
    queryset = GRN.objects.all().select_related('po').prefetch_related('lines__product')
    serializer_class = GRNSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['status', 'po']
    search_fields = ['grn_number']

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def confirm(self, request, pk=None):
        grn = self.get_object()
        org = get_current_org(request)

        if grn.status == GRN.Status.CONFIRMED:
            return Response({"detail": "GRN is already confirmed."}, status=status.HTTP_400_BAD_REQUEST)

        for line in grn.lines.all():
            # 1. Add StockMovement IN
            StockMovement.objects.create(
                organization=org,
                product=line.product,
                location=line.location,
                movement_type=StockMovement.Type.IN,
                quantity=line.quantity_received,
                reference_id=str(grn.grn_number),
                notes=f"Received via GRN {grn.grn_number}"
            )
            
            # 2. Add StockItem
            stock_item, created = StockItem.objects.get_or_create(
                organization=org,
                product=line.product,
                location=line.location,
                defaults={'quantity': 0}
            )
            stock_item.quantity += line.quantity_received
            stock_item.save()

            # 3. Update PO Line
            if line.po_line:
                po_line = line.po_line
                po_line.received_quantity += line.quantity_received
                po_line.save()

        # Update GRN status
        grn.status = GRN.Status.CONFIRMED
        grn.save()
        
        # Check parent PO status
        po = grn.po
        all_lines_received = True
        any_lines_received = False
        for po_line in po.lines.all():
            if po_line.received_quantity >= po_line.quantity:
                any_lines_received = True
            elif po_line.received_quantity > 0:
                any_lines_received = True
                all_lines_received = False
            else:
                all_lines_received = False
                
        if all_lines_received:
            po.status = PurchaseOrder.Status.RECEIVED
        elif any_lines_received:
            po.status = PurchaseOrder.Status.PARTIALLY_RECEIVED
        po.save()

        # [ACCOUNTING HOOK] Create Vendor Bill and POST GRN RECEIPT.
        bill_amount = sum(line.quantity_received * (line.po_line.unit_price if line.po_line else 0) for line in grn.lines.all())
        bill = VendorBill.objects.create(
            organization=org,
            vendor=po.vendor,
            po=po,
            grn=grn,
            bill_number=f"BILL-{grn.grn_number}",
            bill_date=grn.date_received,
            due_date=grn.date_received, # Or add vendor terms logic here
            amount=bill_amount,
            status=VendorBill.Status.DRAFT
        )
        
        # We assume the bill is essentially the liability being recognized.
        AccountingService.post_grn_receipt(bill)

        return Response({"detail": "GRN confirmed, stock updated, vendor bill drafted, accounting entry posted.", "status": grn.status})

class GRNLineViewSet(InventoryBaseViewSet):
    queryset = GRNLine.objects.all().select_related('product', 'grn', 'location')
    serializer_class = GRNLineSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['grn']

    def perform_create(self, serializer):
        serializer.save()

class VendorBillViewSet(InventoryBaseViewSet):
    queryset = VendorBill.objects.all().select_related('vendor', 'grn')
    serializer_class = VendorBillSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['status', 'vendor']
    search_fields = ['bill_number']

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        bill = self.get_object()
        
        if bill.status == VendorBill.Status.PAID:
            return Response({"detail": "Bill is already paid."}, status=status.HTTP_400_BAD_REQUEST)
            
        payment_method = request.data.get('payment_method', 'BANK')
            
        bill.status = VendorBill.Status.PAID
        bill.save()
        
        # [ACCOUNTING HOOK] Record the payout from A/P.
        AccountingService.post_vendor_payment(bill, amount=bill.amount, payment_method=payment_method)
        
        return Response({"detail": "Bill marked as paid and accounting entry generated."})
