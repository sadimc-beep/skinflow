from django.db import models
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils.decorators import method_decorator
from django.utils import timezone

from .models import (
    Appointment, ClinicalIntake, Consultation, Prescription, ProcedureSession,
    PrescriptionMedication, PrescriptionProduct, PrescriptionProcedure,
    TreatmentPlan, TreatmentPlanItem, ClinicalPhoto, ConsentForm, ConsentFormTemplate,
)
from .serializers import (
    AppointmentSerializer, ClinicalIntakeSerializer, ConsultationSerializer,
    PrescriptionSerializer, ProcedureSessionSerializer,
    PrescriptionMedicationSerializer, PrescriptionProductSerializer, PrescriptionProcedureSerializer,
    TreatmentPlanSerializer, TreatmentPlanItemSerializer,
    ClinicalPhotoSerializer, ConsentFormSerializer, ConsentFormTemplateSerializer,
)
from core.api_auth import get_current_org
from core.permissions import HasRolePermission, IsKioskToken, IsDoctorOrOrgAdmin, HasAnyModulePermission
from patients.views import StandardResultsSetPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

class ClinicalBaseViewSet(viewsets.ModelViewSet):
    permission_classes = [HasRolePermission]
    permission_module = 'clinical'
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    def get_queryset(self):
        org = get_current_org(self.request)
        return self.queryset.filter(organization=org)

    def perform_create(self, serializer):
        org = get_current_org(self.request)
        serializer.save(organization=org)

class AppointmentViewSet(ClinicalBaseViewSet):
    queryset = Appointment.objects.all().select_related('patient', 'provider__user')
    serializer_class = AppointmentSerializer
    filterset_fields = ['patient', 'provider', 'status']

    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        appointment = self.get_object()
        fee = request.data.get('fee', 0)
        fee_waiver_requested = request.data.get('fee_waiver_requested', False)
        fee_waiver_reason = request.data.get('fee_waiver_reason', '')

        # Allow check-in if SCHEDULED, or if ARRIVED with a denied waiver (re-check-in)
        waiver_denied = (
            appointment.status == Appointment.Status.ARRIVED
            and appointment.fee_waiver_requested
            and appointment.fee_waiver_approved is False
        )
        if appointment.status != Appointment.Status.SCHEDULED and not waiver_denied:
            return Response(
                {'error': 'This appointment cannot be checked in.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate fee before mutating appointment state
        try:
            fee_amount = float(fee)
        except (ValueError, TypeError):
            return Response(
                {'error': f'Invalid fee value: "{fee}". Must be a number.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.utils import timezone
        if fee_waiver_requested:
            appointment.status = Appointment.Status.ARRIVED
            appointment.arrived_at = timezone.now()
            appointment.fee = fee_amount  # Store proposed fee for reference
            appointment.fee_waiver_requested = True
            appointment.fee_waiver_reason = fee_waiver_reason
            appointment.fee_waiver_approved = None
            appointment.save()
            return Response({'status': 'arrived', 'waiver_pending': True})

        # Normal check-in (or re-check-in after waiver denied)
        appointment.status = Appointment.Status.ARRIVED
        appointment.arrived_at = timezone.now()
        appointment.fee = fee_amount
        appointment.fee_waiver_requested = False
        appointment.fee_waiver_reason = ''
        appointment.fee_waiver_approved = None
        appointment.save()

        if fee_amount > 0:
            from billing.services import process_appointment_checkin_fee
            invoice = process_appointment_checkin_fee(appointment.id, fee_amount)
            return Response({'status': 'arrived', 'invoice_id': invoice.id})

        return Response({'status': 'arrived'})

    @action(detail=True, methods=['post'])
    def approve_waiver(self, request, pk=None):
        appointment = self.get_object()

        if not appointment.fee_waiver_requested or appointment.fee_waiver_approved is not None:
            return Response(
                {'error': 'No pending fee waiver for this appointment.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        approved = request.data.get('approved')
        if approved is None:
            return Response(
                {'error': '"approved" field is required (true or false).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if approved:
            appointment.fee_waiver_approved = True
            appointment.fee = 0
            appointment.save()
            return Response({'status': 'waiver_approved'})
        else:
            appointment.fee_waiver_approved = False
            appointment.save()
            return Response({'status': 'waiver_denied'})

class ConsultationViewSet(ClinicalBaseViewSet):
    queryset = Consultation.objects.all().select_related('patient', 'provider__user', 'prescription')
    serializer_class = ConsultationSerializer
    filterset_fields = ['patient', 'provider', 'status']

    def get_permissions(self):
        # Only Owner/Doctor can write consultations.
        # Everyone with clinical.read (Doctor, Therapist, Front Desk) can list/retrieve/finalize/pdf.
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsDoctorOrOrgAdmin()]
        return [HasRolePermission()]  # uses inherited permission_module = 'clinical'

    def perform_create(self, serializer):
        org = get_current_org(self.request)
        # Ownership check: non-admin doctors can only create consultations for their own appointments.
        staff = getattr(self.request.user, 'staff_profile', None)
        if staff and not staff.is_org_admin and not self.request.user.is_superuser:
            provider_profile = getattr(self.request.user, 'provider_profile', None)
            if provider_profile:
                appt = serializer.validated_data.get('appointment')
                direct_provider = serializer.validated_data.get('provider')
                if appt and appt.provider_id != provider_profile.id:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied('You can only create consultations for your own appointments.')
                if direct_provider and direct_provider.id != provider_profile.id:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied('You can only create consultations assigned to yourself.')
        serializer.save(organization=org)

    def perform_update(self, serializer):
        # Ownership check: non-admin doctors can only edit their own consultations.
        staff = getattr(self.request.user, 'staff_profile', None)
        if staff and not staff.is_org_admin and not self.request.user.is_superuser:
            provider_profile = getattr(self.request.user, 'provider_profile', None)
            if provider_profile:
                instance = serializer.instance
                if instance.provider_id != provider_profile.id:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied('You can only edit your own consultations.')
        serializer.save()

    @action(detail=True, methods=['post'])
    def finalize(self, request, pk=None):
        consultation = self.get_object()
        if consultation.status == Consultation.Status.FINALIZED:
            return Response({'status': 'Consultation already finalized'}, status=status.HTTP_400_BAD_REQUEST)

        consultation.status = Consultation.Status.FINALIZED
        consultation.save()

        if consultation.appointment:
            consultation.appointment.status = Appointment.Status.COMPLETED
            consultation.appointment.save()

        return Response({'status': 'finalized'})

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        from django.template.loader import render_to_string
        from django.http import HttpResponse
        from django.utils.timezone import now
        import weasyprint

        consultation = self.get_object()
        org = consultation.organization

        # Prefetch prescription and all related items in one shot
        prescription = getattr(consultation, 'prescription', None)

        context = {
            'consultation': consultation,
            'prescription': prescription,
            'clinic': org,
            'date': now().strftime('%d %b %Y'),
        }

        html_string = render_to_string('clinical/prescription.html', context, request=request)
        pdf_bytes = weasyprint.HTML(string=html_string, base_url=request.build_absolute_uri('/')).write_pdf()

        filename = f"prescription_{consultation.id}_{now().strftime('%Y%m%d')}.pdf"
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

class ProcedureSessionViewSet(ClinicalBaseViewSet):
    queryset = ProcedureSession.objects.all().select_related(
        'appointment__patient', 'provider__user',
        'entitlement__patient', 'entitlement__procedure_type',
        'consultation__patient',
    )
    serializer_class = ProcedureSessionSerializer
    filterset_fields = ['provider', 'status', 'entitlement']

    def get_queryset(self):
        qs = super().get_queryset()
        date_str = self.request.query_params.get('date')
        if date_str:
            qs = qs.filter(scheduled_at__date=date_str)
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(
                models.Q(appointment__patient_id=patient_id) |
                models.Q(entitlement__patient_id=patient_id) |
                models.Q(consultation__patient_id=patient_id)
            )
        return qs

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError as DRFValidationError
        entitlement = serializer.validated_data.get('entitlement')
        if entitlement:
            in_flight = ProcedureSession.objects.filter(
                entitlement=entitlement,
                status__in=[ProcedureSession.Status.PLANNED, ProcedureSession.Status.STARTED],
            ).count()
            effective_remaining = entitlement.remaining_qty - in_flight
            if effective_remaining <= 0:
                raise DRFValidationError("No remaining sessions available on this entitlement.")
        super().perform_create(serializer)

    def perform_update(self, serializer):
        from rest_framework.exceptions import ValidationError as DRFValidationError
        prev_status = serializer.instance.status
        new_status = serializer.validated_data.get('status', prev_status)

        # Guard: block cancellation when consumables have been issued
        if new_status == ProcedureSession.Status.CANCELLED and prev_status != ProcedureSession.Status.CANCELLED:
            from inventory.models import InventoryRequisition
            blocked = serializer.instance.requisitions.filter(
                status__in=[InventoryRequisition.Status.FULFILLED, InventoryRequisition.Status.APPROVED]
            ).exists()
            if blocked:
                raise DRFValidationError(
                    "Cannot cancel session — consumables have been issued. "
                    "Complete the session or return consumables first."
                )

        instance = serializer.save()

        # Consume entitlement on COMPLETED (not on start)
        if instance.status == ProcedureSession.Status.COMPLETED and prev_status != ProcedureSession.Status.COMPLETED:
            if instance.entitlement:
                instance.entitlement.used_qty += 1
                instance.entitlement.save()

        # Auto-compute consumable cost when session transitions to COMPLETED
        if instance.status == ProcedureSession.Status.COMPLETED and prev_status != ProcedureSession.Status.COMPLETED:
            from inventory.views import _update_session_consumable_cost
            _update_session_consumable_cost(instance)

    @action(detail=True, methods=['post'])
    def start_session(self, request, pk=None):
        session = self.get_object()

        # Entitlement required
        if not session.entitlement:
            return Response({'error': 'Procedure session requires a linked entitlement.'}, status=status.HTTP_400_BAD_REQUEST)

        ent = session.entitlement
        if not ent.is_active:
            return Response({'error': 'The linked entitlement is inactive.'}, status=status.HTTP_400_BAD_REQUEST)

        # Capacity check: remaining_qty tracks completed sessions via used_qty.
        # Count already-completed sessions on this entitlement (excluding self) to
        # determine true availability. PLANNED sessions are not counted here because
        # this session is transitioning from PLANNED → STARTED.
        completed_count = ProcedureSession.objects.filter(
            entitlement=ent,
            status=ProcedureSession.Status.COMPLETED,
        ).exclude(pk=session.pk).count()
        started_count = ProcedureSession.objects.filter(
            entitlement=ent,
            status=ProcedureSession.Status.STARTED,
        ).exclude(pk=session.pk).count()
        effective_remaining = ent.remaining_qty - started_count - completed_count
        if effective_remaining <= 0:
            return Response({'error': 'No remaining sessions available on this entitlement.'}, status=status.HTTP_400_BAD_REQUEST)

        # Require a clinical photo; consent is recommended but not blocking
        if not session.clinical_photo:
            return Response({'error': 'A clinical photo is required to start this procedure session.'}, status=status.HTTP_400_BAD_REQUEST)

        session.status = ProcedureSession.Status.STARTED
        session.save()
        # Entitlement quantity is consumed on COMPLETE, not on start
        return Response({'status': 'started'})

    @action(detail=True, methods=['post'])
    def upload_consent(self, request, pk=None):
        session = self.get_object()
        signed_by = request.data.get('signed_by', 'Patient')

        patient = session.appointment.patient if session.appointment else (
            session.consultation.patient if session.consultation else None
        )
        if not patient:
            return Response({'error': 'Session has no linked patient.'}, status=status.HTTP_400_BAD_REQUEST)

        from clinical.models import ConsentFormTemplate
        from django.utils import timezone
        template, _ = ConsentFormTemplate.objects.get_or_create(
            organization=session.organization,
            name='Standard Procedure Consent',
            defaults={'content': 'I hereby consent to the procedure.'}
        )

        consent_form = ConsentForm.objects.create(
            organization=session.organization,
            patient=patient,
            template=template,
            signed_by=signed_by,
            signed_at=timezone.now(),
            is_signed=True,
            signature=request.FILES.get('signature'),
        )

        session.consent_form = consent_form
        session.save()
        return Response(ConsentFormSerializer(consent_form, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], parser_classes=None)
    def upload_photo(self, request, pk=None):
        session = self.get_object()
        file = request.FILES.get('photo')
        if not file:
            return Response({'error': 'A photo file is required.'}, status=status.HTTP_400_BAD_REQUEST)

        patient = session.appointment.patient if session.appointment else (
            session.consultation.patient if session.consultation else None
        )
        if not patient:
            return Response({'error': 'Session has no linked patient.'}, status=status.HTTP_400_BAD_REQUEST)

        from django.utils import timezone
        photo = ClinicalPhoto.objects.create(
            organization=session.organization,
            patient=patient,
            photo=file,
            category=request.data.get('category', ClinicalPhoto.Category.PRE_SESSION),
            taken_at=timezone.now(),
            taken_by=getattr(request.user, 'staff_profile', None),
            description=request.data.get('description', ''),
        )

        session.clinical_photo = photo
        session.save()
        return Response(ClinicalPhotoSerializer(photo, context={'request': request}).data, status=status.HTTP_201_CREATED)

class ClinicalIntakeViewSet(ClinicalBaseViewSet):
    queryset = ClinicalIntake.objects.all().select_related('appointment__patient')
    serializer_class = ClinicalIntakeSerializer
    filterset_fields = ['appointment']

    def perform_create(self, serializer):
        # Override to update appointment status to READY_FOR_CONSULT
        intake = serializer.save(organization=get_current_org(self.request))
        if intake.appointment and intake.appointment.status == Appointment.Status.ARRIVED:
            intake.appointment.status = Appointment.Status.READY_FOR_CONSULT
            intake.appointment.save()

class PrescriptionViewSet(ClinicalBaseViewSet):
    queryset = Prescription.objects.all().select_related('consultation__patient', 'organization')
    serializer_class = PrescriptionSerializer

class PrescriptionMedicationViewSet(ClinicalBaseViewSet):
    queryset = PrescriptionMedication.objects.all().select_related('medicine')
    serializer_class = PrescriptionMedicationSerializer

    def get_permissions(self):
        # Removing an item from a DRAFT prescription is a write workflow, not an admin delete.
        # clinical.write is sufficient; clinical.delete is not required.
        if self.action == 'destroy':
            return [HasAnyModulePermission([('clinical', 'write')])]
        return super().get_permissions()

    def get_queryset(self):
        # PrescriptionMedication is scoped via its Prescription -> Consultation -> Organization chain
        org = get_current_org(self.request)
        return PrescriptionMedication.objects.filter(prescription__organization=org).select_related('medicine')

    def perform_create(self, serializer):
        # No direct organization FK on this model; access control via prescription FK
        serializer.save()

class PrescriptionProductViewSet(ClinicalBaseViewSet):
    queryset = PrescriptionProduct.objects.all()
    serializer_class = PrescriptionProductSerializer

    def get_permissions(self):
        if self.action == 'destroy':
            return [HasAnyModulePermission([('clinical', 'write')])]
        return super().get_permissions()

    def get_queryset(self):
        org = get_current_org(self.request)
        return PrescriptionProduct.objects.filter(prescription__organization=org)

    def perform_create(self, serializer):
        serializer.save()

class PrescriptionProcedureViewSet(ClinicalBaseViewSet):
    queryset = PrescriptionProcedure.objects.all().select_related('procedure_type')
    serializer_class = PrescriptionProcedureSerializer

    def get_permissions(self):
        if self.action == 'destroy':
            return [HasAnyModulePermission([('clinical', 'write')])]
        return super().get_permissions()

    def get_queryset(self):
        org = get_current_org(self.request)
        return PrescriptionProcedure.objects.filter(prescription__organization=org).select_related('procedure_type')

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError as DRFValidationError
        prescription = serializer.validated_data.get('prescription')
        if prescription and prescription.consultation_id:
            try:
                provider = prescription.consultation.provider
                max_pct = provider.max_discount_percentage
                discount = serializer.validated_data.get('manual_discount', 0)
                if discount and max_pct is not None and discount > max_pct:
                    raise DRFValidationError(
                        {'manual_discount': f'Discount {discount}% exceeds your authorised maximum of {max_pct}%.'}
                    )
            except AttributeError:
                pass
        serializer.save()

class TreatmentPlanViewSet(ClinicalBaseViewSet):
    queryset = TreatmentPlan.objects.all().select_related('patient').prefetch_related('items__procedure_type')
    serializer_class = TreatmentPlanSerializer
    filterset_fields = ['patient']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsDoctorOrOrgAdmin()]
        return super().get_permissions()

class TreatmentPlanItemViewSet(ClinicalBaseViewSet):
    queryset = TreatmentPlanItem.objects.all().select_related('procedure_type')
    serializer_class = TreatmentPlanItemSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsDoctorOrOrgAdmin()]
        return super().get_permissions()

    def get_queryset(self):
        org = get_current_org(self.request)
        return TreatmentPlanItem.objects.filter(treatment_plan__organization=org).select_related('procedure_type')

    def perform_create(self, serializer):
        serializer.save()

class ClinicalPhotoViewSet(ClinicalBaseViewSet):
    """
    CRUD for clinical photos.
    Upload via multipart/form-data with field name `photo`.
    Filter by patient with ?patient=<id> or by category with ?category=<REGISTRATION|PRE_SESSION|POST_SESSION>.
    """
    queryset = ClinicalPhoto.objects.all().select_related('patient', 'taken_by')
    serializer_class = ClinicalPhotoSerializer
    filterset_fields = ['patient', 'category']

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


# ─── Consent Form Templates & Forms ─────────────────────────────────────────

class ConsentFormTemplateViewSet(ClinicalBaseViewSet):
    """
    CRUD for consent form templates.
    Staff create/edit the legal text here; patients sign against a template.
    """
    queryset = ConsentFormTemplate.objects.all()
    serializer_class = ConsentFormTemplateSerializer
    permission_module = 'settings'  # writes are admin-only; reads open below

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.IsAuthenticated()]
        return [HasRolePermission()]


class ConsentFormViewSet(ClinicalBaseViewSet):
    """
    Read-only audit trail of signed consent forms.
    Filter by patient with ?patient=<id>.
    """
    queryset = ConsentForm.objects.all().select_related('template', 'patient')
    serializer_class = ConsentFormSerializer
    http_method_names = ['get', 'head', 'options']
    filterset_fields = ['patient']

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


# ─── Kiosk Appointment Endpoints ─────────────────────────────────────────────

class KioskAppointmentView(APIView):
    """
    GET  /api/clinical/kiosk/appointments/?phone=  — today's appointments for a phone number
    POST /api/clinical/kiosk/appointments/<id>/checkin/  — mark appointment ARRIVED
    Both require: Authorization: Kiosk <org-kiosk-token>
    """
    authentication_classes = []
    permission_classes = [IsKioskToken]

    def get(self, request):
        phone = request.query_params.get('phone', '').strip()
        if not phone:
            return Response({'error': 'phone query parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.localdate()
        appointments = Appointment.objects.filter(
            organization=request.kiosk_org,
            patient__phone_primary=phone,
            date_time__date=today,
            status=Appointment.Status.SCHEDULED,
        ).select_related('patient', 'provider__user')

        data = [
            {
                'id': appt.id,
                'date_time': appt.date_time,
                'provider_name': appt.provider.user.get_full_name() if appt.provider else '',
                'status': appt.status,
            }
            for appt in appointments
        ]
        return Response(data)


class KioskAppointmentCheckinView(APIView):
    """POST /api/clinical/kiosk/appointments/<pk>/checkin/"""
    authentication_classes = []
    permission_classes = [IsKioskToken]

    def post(self, request, pk=None):
        try:
            appointment = Appointment.objects.get(id=pk, organization=request.kiosk_org)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        if appointment.status != Appointment.Status.SCHEDULED:
            return Response(
                {'error': f'Appointment cannot be checked in (current status: {appointment.status}).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appointment.status = Appointment.Status.ARRIVED
        appointment.save(update_fields=['status'])

        return Response({'status': 'checked_in', 'appointment_id': appointment.id})
