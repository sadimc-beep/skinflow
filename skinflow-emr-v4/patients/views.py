from rest_framework import viewsets, permissions, pagination, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils.decorators import method_decorator

from .models import Patient
from .serializers import PatientSerializer
from core.api_auth import get_current_org
from core.permissions import HasRolePermission, IsKioskToken
from saas.limits import check_org_limit

class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200

class PatientViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows patients to be viewed or edited.
    """
    serializer_class = PatientSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [HasRolePermission]
    permission_module = 'patients'

    def get_queryset(self):
        """
        Filter queryset by the current organization.
        """
        org = get_current_org(self.request)
        return Patient.objects.filter(organization=org)

    def perform_create(self, serializer):
        """
        Auto-assign the patient to the current organization on creation.
        """
        org = get_current_org(self.request)
        check_org_limit(org, 'patients')
        serializer.save(organization=org)
        
    def perform_destroy(self, instance):
        """
        Basic delete protection: In reality, we must check if they have invoices/appointments.
        For now, this raises a validation error if we detect relations (Django will normally just CASCADE if we aren't careful, so we should override or use Protect in models).
        Since models.py for related items use CASCADE by default in our scaffolding, we add basic manual check here.
        """
        if instance.appointments.exists() or instance.consultations.exists() or hasattr(instance, 'invoices') and instance.invoices.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Cannot delete patient with linked clinical or financial records.")

        instance.delete()


# ─── Kiosk Endpoints ──────────────────────────────────────────────────────────

class KioskPatientRegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    phone_primary = serializers.CharField(max_length=20)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.ChoiceField(
        choices=['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'],
        default='UNKNOWN',
    )


class KioskPatientView(APIView):
    """
    POST /api/patients/kiosk/register/  — new patient self-registration
    GET  /api/patients/kiosk/lookup/?phone=  — find patient by phone
    Both require: Authorization: Kiosk <org-kiosk-token>
    """
    authentication_classes = []
    permission_classes = [IsKioskToken]

    def post(self, request):
        """Register a new patient from the tablet check-in screen."""
        serializer = KioskPatientRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        org = request.kiosk_org

        # Prevent duplicate registration by phone within the org
        if Patient.objects.filter(organization=org, phone_primary=data['phone_primary']).exists():
            return Response(
                {'error': 'A patient with this phone number is already registered.'},
                status=status.HTTP_409_CONFLICT,
            )

        patient = Patient.objects.create(
            organization=org,
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone_primary=data['phone_primary'],
            date_of_birth=data.get('date_of_birth'),
            gender=data.get('gender', 'UNKNOWN'),
        )

        return Response({
            'id': patient.id,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'phone_primary': patient.phone_primary,
        }, status=status.HTTP_201_CREATED)

    def get(self, request):
        """Look up a patient by phone number."""
        phone = request.query_params.get('phone', '').strip()
        if not phone:
            return Response({'error': 'phone query parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            patient = Patient.objects.get(organization=request.kiosk_org, phone_primary=phone)
        except Patient.DoesNotExist:
            return Response({'error': 'No patient found with that phone number.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'id': patient.id,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'phone_primary': patient.phone_primary,
        })
