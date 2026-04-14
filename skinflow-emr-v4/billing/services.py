from django.utils import timezone
from .models import Invoice, InvoiceItem, Payment, Entitlement
from patients.models import Patient
from clinical.models import Appointment, Consultation, PrescriptionProcedure, PrescriptionProduct
from accounting.services import AccountingService

def process_appointment_checkin_fee(appointment_id, fee_amount):
    """
    Creates or updates the master invoice for the visit with the consultation fee.
    """
    appointment = Appointment.objects.get(id=appointment_id)
    fee_amount = float(fee_amount)
    
    # Get or create the unified invoice for this appointment
    invoice, created = Invoice.objects.get_or_create(
        appointment=appointment,
        defaults={
            'organization': appointment.organization,
            'patient': appointment.patient,
            'invoice_type': Invoice.Type.CONSULTATION,
            'status': Invoice.Status.UNPAID
        }
    )
    
    # Create the consultation fee line item
    InvoiceItem.objects.create(
        invoice=invoice,
        description="Consultation Fee",
        reference_id=appointment.id,
        reference_model='Appointment',
        quantity=1,
        unit_price=fee_amount,
        net_price=fee_amount
    )
    
    # Update totals
    invoice.subtotal += fee_amount
    invoice.total += fee_amount
    invoice.balance_due += fee_amount
    
    if invoice.status == Invoice.Status.PAID and invoice.balance_due > 0:
        invoice.status = Invoice.Status.PARTIALLY_PAID
        
    invoice.save()
    return invoice


def generate_invoice_from_consultation(consultation_id):
    """
    Generate a full invoice from a finalized consultation.
    """
    try:
        consultation = Consultation.objects.get(id=consultation_id)
    except Consultation.DoesNotExist:
        raise ValueError("Consultation does not exist")
        
    if consultation.status != Consultation.Status.FINALIZED:
        raise ValueError("Cannot bill a consultation that is not finalized")
        
    if not hasattr(consultation, 'prescription'):
        raise ValueError("Consultation has no prescription")

    # Stock check for products before creating the invoice
    from inventory.models import StockItem
    from django.db.models import Sum
    out_of_stock = []
    for prod in consultation.prescription.products.filter(is_selected_for_billing=True, billed_invoice__isnull=True):
        if prod.product_id:
            total = StockItem.objects.filter(product_id=prod.product_id).aggregate(total=Sum('quantity'))['total'] or 0
            if total <= 0:
                out_of_stock.append(prod.product_name)
    if out_of_stock:
        names = ', '.join(out_of_stock)
        raise ValueError(f"Cannot generate invoice: {names} {'is' if len(out_of_stock) == 1 else 'are'} out of stock.")

    invoice = Invoice.objects.create(
        organization=consultation.organization,
        patient=consultation.patient,
        invoice_type=Invoice.Type.CONSULTATION,
        status=Invoice.Status.UNPAID
    )
    
    subtotal = 0
    discount_total = 0
    
    # Bill Procedures
    for proc in consultation.prescription.procedures.filter(is_selected_for_billing=True, billed_invoice__isnull=True):
        quantity = proc.sessions_planned
        unit_price = proc.base_price
        gross = quantity * unit_price
        
        InvoiceItem.objects.create(
            invoice=invoice,
            description=f"Procedure: {proc.procedure_type.name} ({quantity} sessions)",
            reference_id=proc.id,
            reference_model='PrescriptionProcedure',
            procedure_type=proc.procedure_type,
            quantity=quantity,
            unit_price=unit_price,
            discount=proc.manual_discount,
            net_price=gross - proc.manual_discount
        )
        proc.billed_invoice = invoice
        proc.save()
        
        subtotal += gross
        discount_total += proc.manual_discount

    # Bill Products
    for prod in consultation.prescription.products.filter(is_selected_for_billing=True, billed_invoice__isnull=True):
        gross = prod.quantity * prod.price
        
        InvoiceItem.objects.create(
            invoice=invoice,
            description=f"Product: {prod.product_name}",
            reference_id=prod.id,
            reference_model='PrescriptionProduct',
            quantity=prod.quantity,
            unit_price=prod.price,
            discount=prod.manual_discount,
            net_price=gross - prod.manual_discount
        )
        prod.billed_invoice = invoice
        prod.save()
        
        subtotal += gross
        discount_total += prod.manual_discount
        
    # Finalize totals
    invoice.subtotal = subtotal
    invoice.discount_total = discount_total
    invoice.total = subtotal - discount_total
    invoice.balance_due = invoice.total
    invoice.save()
    
    # [ACCOUNTING HOOK] Recognize revenue
    AccountingService.post_invoice_revenue(invoice)
    
    return invoice

def generate_new_invoice_from_consultation_selection(consultation_id, selected_procedure_ids=None, selected_product_ids=None):
    """
    Generate a partial invoice based on specific selected prescription items.
    """
    try:
        consultation = Consultation.objects.get(id=consultation_id)
    except Consultation.DoesNotExist:
        raise ValueError("Consultation does not exist")
        
    if consultation.status != Consultation.Status.FINALIZED:
        raise ValueError("Cannot bill from a non-finalized consultation")

    selected_procedure_ids = selected_procedure_ids or []
    selected_product_ids = selected_product_ids or []
    
    if not selected_procedure_ids and not selected_product_ids:
        raise ValueError("No items selected for billing")

    # Stock check for selected products before creating the invoice
    if selected_product_ids:
        from inventory.models import StockItem
        from django.db.models import Sum
        out_of_stock = []
        for prod_id in selected_product_ids:
            try:
                prod = PrescriptionProduct.objects.get(id=prod_id, prescription__consultation=consultation, billed_invoice__isnull=True)
                if prod.product_id:
                    total = StockItem.objects.filter(product_id=prod.product_id).aggregate(total=Sum('quantity'))['total'] or 0
                    if total <= 0:
                        out_of_stock.append(prod.product_name)
            except PrescriptionProduct.DoesNotExist:
                continue
        if out_of_stock:
            names = ', '.join(out_of_stock)
            raise ValueError(f"Cannot generate invoice: {names} {'is' if len(out_of_stock) == 1 else 'are'} out of stock.")

    # Option B: Use the master invoice tied to the appointment if it exists and is not fully closed/refunded.
    invoice = None
    if consultation.appointment:
        # Check if an invoice for this appointment exists and can be appended to
        open_invoices = Invoice.objects.filter(
            appointment=consultation.appointment, 
            status__in=[Invoice.Status.DRAFT, Invoice.Status.UNPAID]
        )
        if open_invoices.exists():
            invoice = open_invoices.first()
            
    if not invoice:
        invoice = Invoice.objects.create(
            organization=consultation.organization,
            patient=consultation.patient,
            appointment=consultation.appointment,
            invoice_type=Invoice.Type.MIXED,
            status=Invoice.Status.UNPAID
        )
    
    from decimal import Decimal
    
    subtotal = Decimal(str(invoice.subtotal))
    discount_total = Decimal(str(invoice.discount_total))
    
    for proc_id in selected_procedure_ids:
        try:
            proc = PrescriptionProcedure.objects.get(id=proc_id, prescription__consultation=consultation, billed_invoice__isnull=True)
            quantity = proc.sessions_planned
            unit_price = proc.base_price
            gross = quantity * unit_price
            
            InvoiceItem.objects.create(
                invoice=invoice,
                description=f"Procedure: {proc.procedure_type.name} ({quantity} sessions)",
                reference_id=proc.id,
                reference_model='PrescriptionProcedure',
                procedure_type=proc.procedure_type,
                quantity=quantity,
                unit_price=unit_price,
                discount=proc.manual_discount,
                net_price=gross - proc.manual_discount
            )
            proc.billed_invoice = invoice
            proc.save()
            
            subtotal += Decimal(str(gross))
            discount_total += Decimal(str(proc.manual_discount))
        except PrescriptionProcedure.DoesNotExist:
            continue
            
    for prod_id in selected_product_ids:
        try:
            prod = PrescriptionProduct.objects.get(id=prod_id, prescription__consultation=consultation, billed_invoice__isnull=True)
            gross = prod.quantity * prod.price
            
            InvoiceItem.objects.create(
                invoice=invoice,
                description=f"Product: {prod.product_name}",
                reference_id=prod.id,
                reference_model='PrescriptionProduct',
                quantity=prod.quantity,
                unit_price=prod.price,
                discount=prod.manual_discount,
                net_price=gross - prod.manual_discount
            )
            prod.billed_invoice = invoice
            prod.save()
            
            subtotal += Decimal(str(gross))
            discount_total += Decimal(str(prod.manual_discount))
        except PrescriptionProduct.DoesNotExist:
            continue

    invoice.subtotal = subtotal
    invoice.discount_total = discount_total
    invoice.total = subtotal - discount_total
    
    # Calculate previous payments to correctly set balance_due
    total_paid = sum((Decimal(str(p.amount)) for p in invoice.payments.filter(status=Payment.Status.COMPLETED)), Decimal('0.00'))
    invoice.balance_due = max(Decimal('0.00'), invoice.total - total_paid)
    
    if invoice.balance_due > Decimal('0.00') and invoice.status == Invoice.Status.PAID:
        invoice.status = Invoice.Status.PARTIALLY_PAID
        
    invoice.save()
    
    # [ACCOUNTING HOOK] Recognize revenue
    AccountingService.post_invoice_revenue(invoice)
    
    return invoice

def check_payment_completes_invoice(payment):
    """
    Internal helper to check if a payment transitions an invoice to PAID.
    """
    invoice = payment.invoice
    total_paid = sum(p.amount for p in invoice.payments.filter(status=Payment.Status.COMPLETED))
    
    invoice.balance_due = max(0, invoice.total - total_paid)
    
    if invoice.balance_due <= 0:
        invoice.status = Invoice.Status.PAID
        invoice.balance_due = 0
        invoice.save()
        
        # Trigger business logic hook on PAID status
        create_entitlements_for_paid_invoice(invoice)
        fulfill_products_for_paid_invoice(invoice)
        return True
    elif total_paid > 0:
        invoice.status = Invoice.Status.PARTIALLY_PAID
        invoice.save()
        
    return False

def create_entitlements_for_paid_invoice(invoice):
    """
    When an invoice becomes PAID, generate procedure entitlements.
    """
    if invoice.status != Invoice.Status.PAID:
        return
        
    for item in invoice.items.filter(reference_model='PrescriptionProcedure'):
        # Check if entitlement already exists to prevent duplicate creation
        if not hasattr(item, 'entitlement'):
            Entitlement.objects.create(
                organization=invoice.organization,
                patient=invoice.patient,
                invoice=invoice,
                invoice_item=item,
                entitlement_type=Entitlement.Type.PROCEDURE,
                procedure_type=item.procedure_type,
                total_qty=item.quantity,
                used_qty=0,
                remaining_qty=item.quantity,
                is_active=True
            )

def fulfill_products_for_paid_invoice(invoice):
    """
    No-op: product fulfillment is now a manual step performed by store staff
    via the Fulfillment Queue (/inventory/fulfillment).
    Items are intentionally left is_fulfilled=False after payment so they
    appear in the queue awaiting handover. See AD-026.
    """
    pass

def enforce_entitlement_for_session(procedure_session):
    """
    Validates if a procedure session can start based on available entitlements.
    Entitlement quantity is consumed on COMPLETE, not on start — so we count
    in-flight STARTED sessions against remaining_qty to prevent over-starting.
    Returns (True, "Success message") or (False, "Error message")
    """
    if procedure_session.status in [procedure_session.Status.CANCELLED, procedure_session.Status.NO_SHOW]:
        return True, "Validation bypassed for cancelled/no-show status"

    if not procedure_session.entitlement:
        return False, "Procedure session requires a linked entitlement"

    ent = procedure_session.entitlement

    if not ent.is_active:
        return False, "The linked entitlement is inactive"

    # Count sessions already STARTED (not yet completed) for this entitlement,
    # excluding the current session itself, to determine effective availability.
    from clinical.models import ProcedureSession
    in_flight = ProcedureSession.objects.filter(
        entitlement=ent,
        status=ProcedureSession.Status.STARTED,
    ).exclude(pk=procedure_session.pk).count()

    effective_remaining = ent.remaining_qty - in_flight
    if effective_remaining <= 0:
        return False, "The linked entitlement has no remaining quantity"

    if procedure_session.treatment_plan_item and procedure_session.treatment_plan_item.procedure_type != ent.procedure_type:
        return False, "Mismatch between session procedure type and entitlement procedure type"

    return True, "Validation passed"
