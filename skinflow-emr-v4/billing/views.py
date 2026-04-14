from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.decorators import method_decorator

from .models import Invoice, InvoiceItem, Payment, Entitlement
from .serializers import InvoiceSerializer, InvoiceItemSerializer, PaymentSerializer, EntitlementSerializer
from .services import (
    generate_invoice_from_consultation, 
    generate_new_invoice_from_consultation_selection,
    check_payment_completes_invoice
)
from accounting.services import AccountingService
from core.api_auth import get_current_org
from core.permissions import HasRolePermission
from patients.views import StandardResultsSetPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

class BillingBaseViewSet(viewsets.ModelViewSet):
    permission_classes = [HasRolePermission]
    permission_module = 'billing'
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    def get_queryset(self):
        org = get_current_org(self.request)
        return self.queryset.filter(organization=org)

    def perform_create(self, serializer):
        org = get_current_org(self.request)
        serializer.save(organization=org)

class InvoiceViewSet(BillingBaseViewSet):
    queryset = Invoice.objects.all().select_related('patient').prefetch_related('items')
    serializer_class = InvoiceSerializer
    filterset_fields = ['patient', 'status']
    
    @action(detail=False, methods=['post'], url_path='generate-from-consultation')
    def generate_full(self, request):
        consultation_id = request.data.get('consultation_id')
        if not consultation_id:
            return Response({'error': 'consultation_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            invoice = generate_invoice_from_consultation(consultation_id)
            serializer = self.get_serializer(invoice)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='generate-partial')
    def generate_partial(self, request):
        consultation_id = request.data.get('consultation_id')
        proc_ids = request.data.get('procedure_ids', [])
        prod_ids = request.data.get('product_ids', [])

        try:
            invoice = generate_new_invoice_from_consultation_selection(consultation_id, proc_ids, prod_ids)
            serializer = self.get_serializer(invoice)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        from django.template.loader import render_to_string
        from django.http import HttpResponse
        from django.utils.timezone import now
        import weasyprint

        invoice = self.get_object()
        org = invoice.organization

        context = {
            'invoice': invoice,
            'clinic': org,
            'date': now().strftime('%d %b %Y'),
        }

        html_string = render_to_string('billing/invoice.html', context, request=request)
        pdf_bytes = weasyprint.HTML(string=html_string, base_url=request.build_absolute_uri('/')).write_pdf()

        filename = f"invoice_{invoice.id}_{now().strftime('%Y%m%d')}.pdf"
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

class InvoiceItemViewSet(BillingBaseViewSet):
    queryset = InvoiceItem.objects.all().select_related('invoice__patient', 'invoice').prefetch_related('invoice__payments')
    serializer_class = InvoiceItemSerializer
    filterset_fields = ['invoice', 'is_fulfilled', 'reference_model', 'invoice__status']

    def get_queryset(self):
        qs = super().get_queryset()
        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(invoice__created_at__date=date)
        return qs

    @action(detail=True, methods=['post'])
    def mark_fulfilled(self, request, pk=None):
        from django.utils import timezone
        from django.db import transaction
        from inventory.models import StockMovement, StockItem, StockLocation
        from clinical.models import PrescriptionProduct

        item = self.get_object()

        if item.is_fulfilled:
            return Response({'error': 'Item is already fulfilled'}, status=status.HTTP_400_BAD_REQUEST)

        org = get_current_org(request)
        stock_deducted = False

        with transaction.atomic():
            item.is_fulfilled = True
            item.fulfilled_at = timezone.now()
            item.save()

            # Auto-deduct stock if the invoice item links to a PrescriptionProduct
            # that has a resolved inventory.Product FK.
            if item.reference_model == 'PrescriptionProduct' and item.reference_id:
                try:
                    pp = PrescriptionProduct.objects.select_related('product').get(id=item.reference_id)
                    if pp.product and pp.product.is_stock_tracked:
                        location = StockLocation.objects.filter(organization=org).first()
                        if location:
                            StockMovement.objects.create(
                                organization=org,
                                product=pp.product,
                                location=location,
                                movement_type=StockMovement.Type.OUT,
                                quantity=item.quantity,
                                reference_id=str(item.invoice_id),
                                notes=f"Fulfilled via invoice INV-{item.invoice_id}: {item.description}",
                            )
                            stock_item, _ = StockItem.objects.get_or_create(
                                organization=org,
                                product=pp.product,
                                location=location,
                                defaults={'quantity': 0},
                            )
                            stock_item.quantity -= item.quantity
                            stock_item.save()
                            stock_deducted = True

                            # [ACCOUNTING HOOK] Post Product COGS
                            if pp.product.cost_price and pp.product.cost_price > 0:
                                from decimal import Decimal
                                cogs_amount = Decimal(str(item.quantity)) * pp.product.cost_price
                                AccountingService.post_product_cogs(
                                    organization=org,
                                    amount=cogs_amount,
                                    reference_id=item.id,
                                    description=f"Product COGS: {item.description}",
                                )
                except PrescriptionProduct.DoesNotExist:
                    pass

        return Response({
            'status': 'fulfilled',
            'fulfilled_at': item.fulfilled_at,
            'stock_deducted': stock_deducted,
        })

class PaymentViewSet(BillingBaseViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    
    def perform_create(self, serializer):
        # Allow passing invoice ID, ensuring the invoice is in the same tenant
        org = get_current_org(self.request)
        payment = serializer.save(organization=org)
        
        # [ACCOUNTING HOOK] Record the payment receipt (Cash/CC/Check vs A/R)
        if payment.status == Payment.Status.COMPLETED:
            AccountingService.post_patient_payment(payment)
            check_payment_completes_invoice(payment)

class EntitlementViewSet(BillingBaseViewSet):
    queryset = Entitlement.objects.all().select_related('patient', 'procedure_type')
    serializer_class = EntitlementSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        invoice_id = self.request.query_params.get('invoice')
        if invoice_id:
            qs = qs.filter(invoice_id=invoice_id)
        return qs
