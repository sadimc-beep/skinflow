from django.test import TestCase
from decimal import Decimal
from django.contrib.auth import get_user_model

from core.models import Organization, Provider
from patients.models import Patient
from masters.models import ProcedureCategory, ProcedureType
from clinical.models import Appointment, ProcedureSession
from billing.models import Invoice, InvoiceItem, Entitlement
from billing.services import enforce_entitlement_for_session

User = get_user_model()

class ClinicalServicesTestCase(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Test Clinic", slug="test-clinic")
        self.user = User.objects.create_user(username='doctor1', password='password')
        self.provider = Provider.objects.create(organization=self.org, user=self.user, provider_type='DOCTOR')
        self.patient = Patient.objects.create(organization=self.org, first_name="John", last_name="Doe", phone_primary="1234567890")
        
        self.proc_cat = ProcedureCategory.objects.create(organization=self.org, name="Laser")
        self.proc_type = ProcedureType.objects.create(organization=self.org, category=self.proc_cat, name="Laser Hair Removal", base_price=Decimal('100.00'))
        self.other_proc_type = ProcedureType.objects.create(organization=self.org, category=self.proc_cat, name="Botox", base_price=Decimal('200.00'))

        self.invoice = Invoice.objects.create(organization=self.org, patient=self.patient, status=Invoice.Status.PAID)
        self.invoice_item = InvoiceItem.objects.create(
            invoice=self.invoice, description="Test Procedure", 
            reference_model='PrescriptionProcedure', quantity=3, unit_price=100.00, net_price=300.00
        )
        
        self.entitlement = Entitlement.objects.create(
            organization=self.org, patient=self.patient, invoice=self.invoice,
            invoice_item=self.invoice_item,
            entitlement_type=Entitlement.Type.PROCEDURE, procedure_type=self.proc_type,
            total_qty=3, used_qty=0, remaining_qty=3, is_active=True
        )

        self.appointment = Appointment.objects.create(organization=self.org, patient=self.patient, provider=self.provider, date_time="2024-01-01T10:00:00Z")

    def test_enforce_entitlement_success(self):
        session = ProcedureSession.objects.create(
            organization=self.org, appointment=self.appointment,
            provider=self.provider, entitlement=self.entitlement
        )
        valid, _ = enforce_entitlement_for_session(session)
        self.assertTrue(valid)

    def test_enforce_entitlement_no_entitlement(self):
        session = ProcedureSession.objects.create(
            organization=self.org, appointment=self.appointment,
            provider=self.provider, # missing entitlement link
        )
        valid, msg = enforce_entitlement_for_session(session)
        self.assertFalse(valid)
        self.assertEqual(msg, "Procedure session requires a linked entitlement")

    def test_enforce_entitlement_empty_qty(self):
        self.entitlement.used_qty = 3
        self.entitlement.save()
        # In Django, related queries within the same transaction might cache the related object.
        # Fetching a completely fresh instance from DB ensures the service sees the 0 count.
        fresh_entitlement = Entitlement.objects.get(id=self.entitlement.id)
        
        session = ProcedureSession.objects.create(
            organization=self.org, appointment=self.appointment,
            provider=self.provider, entitlement=fresh_entitlement
        )
        valid, msg = enforce_entitlement_for_session(session)
        self.assertFalse(valid)
        self.assertEqual(msg, "The linked entitlement has no remaining quantity or is inactive")
