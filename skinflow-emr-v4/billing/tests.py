from django.test import TestCase
from decimal import Decimal
from django.contrib.auth import get_user_model

from core.models import Organization, Provider
from patients.models import Patient
from masters.models import ProcedureCategory, ProcedureType
from clinical.models import Appointment, Consultation, Prescription, PrescriptionProcedure
from billing.models import Invoice, InvoiceItem, Payment, Entitlement
from billing.services import (
    generate_invoice_from_consultation,
    check_payment_completes_invoice
)

User = get_user_model()

class BillingServicesTestCase(TestCase):
    def setUp(self):
        # Setup basic data
        self.org = Organization.objects.create(name="Test Clinic", slug="test-clinic")
        self.user = User.objects.create_user(username='doctor1', password='password')
        self.provider = Provider.objects.create(organization=self.org, user=self.user, provider_type='DOCTOR')
        self.patient = Patient.objects.create(organization=self.org, first_name="John", last_name="Doe", phone_primary="1234567890")
        
        # Setup Master Data
        self.proc_cat = ProcedureCategory.objects.create(organization=self.org, name="Laser")
        self.proc_type = ProcedureType.objects.create(organization=self.org, category=self.proc_cat, name="Laser Hair Removal", base_price=Decimal('100.00'))
        
        # Setup Clinical Data
        self.appointment = Appointment.objects.create(organization=self.org, patient=self.patient, provider=self.provider, date_time="2024-01-01T10:00:00Z")
        self.consultation = Consultation.objects.create(organization=self.org, patient=self.patient, provider=self.provider, appointment=self.appointment, status=Consultation.Status.FINALIZED)
        self.prescription = Prescription.objects.create(organization=self.org, consultation=self.consultation)
        
        self.presc_proc = PrescriptionProcedure.objects.create(
            prescription=self.prescription,
            procedure_type=self.proc_type,
            sessions_planned=3,
            base_price=Decimal('100.00'),
            is_selected_for_billing=True
        )

    def test_generate_invoice(self):
        invoice = generate_invoice_from_consultation(self.consultation.id)
        
        self.assertEqual(invoice.patient, self.patient)
        self.assertEqual(invoice.status, Invoice.Status.UNPAID)
        self.assertEqual(invoice.total, Decimal('300.00')) # 3 sessions * 100
        self.assertEqual(invoice.items.count(), 1)
        
        # Verify procedure is marked as billed
        self.presc_proc.refresh_from_db()
        self.assertEqual(self.presc_proc.billed_invoice, invoice)

    def test_payment_completes_invoice_and_creates_entitlement(self):
        invoice = generate_invoice_from_consultation(self.consultation.id)
        
        payment = Payment.objects.create(
            organization=self.org,
            invoice=invoice,
            amount=Decimal('300.00'),
            method=Payment.Method.CASH,
            status=Payment.Status.COMPLETED
        )
        
        # Action is usually caught by viewset or signals, we manually check the service here
        check_payment_completes_invoice(payment)
        
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, Invoice.Status.PAID)
        self.assertEqual(invoice.balance_due, Decimal('0.00'))
        
        # Verify entitlement was created
        entitlement = Entitlement.objects.filter(invoice=invoice).first()
        self.assertIsNotNone(entitlement)
        self.assertEqual(entitlement.procedure_type, self.proc_type)
        self.assertEqual(entitlement.total_qty, 3)
        self.assertEqual(entitlement.remaining_qty, 3)
