"""
Public (no-auth) booking API views.
All views resolve the clinic by Organization.slug from the URL.
"""
import datetime

from django.shortcuts import get_object_or_404
from django.utils.timezone import make_aware
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from core.models import Organization, Provider, BookingSettings
from patients.models import Patient
from .models import Appointment


class PublicBookingThrottle(AnonRateThrottle):
    """10 booking attempts per IP per hour."""
    scope = 'public_booking'


class _PublicBase(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def _get_org(self, slug: str) -> Organization:
        return get_object_or_404(Organization, slug=slug, is_active=True)

    def _get_booking_settings(self, org: Organization) -> BookingSettings:
        settings_obj, _ = BookingSettings.objects.get_or_create(organization=org)
        return settings_obj


# ─── GET /api/public/<slug>/info/ ─────────────────────────────────────────────

class PublicClinicInfoView(_PublicBase):
    def get(self, request, slug):
        org = self._get_org(slug)
        bs = self._get_booking_settings(org)

        if not bs.is_booking_enabled:
            return Response(
                {'detail': 'Online booking is not currently enabled for this clinic.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        providers = (
            Provider.objects.filter(organization=org)
            .select_related('user')
            .order_by('provider_type', 'user__first_name')
        )

        return Response({
            'clinic_name': org.name,
            'clinic_phone': org.phone,
            'clinic_address': org.address,
            'providers': [
                {
                    'id': p.id,
                    'name': p.user.get_full_name() or p.user.username,
                    'type': p.provider_type,
                    'specialization': p.specialization,
                }
                for p in providers
            ],
            'slot_duration_mins': bs.slot_duration_mins,
            'working_days': bs.working_days,
            'advance_booking_days': bs.advance_booking_days,
        })


# ─── GET /api/public/<slug>/slots/ ────────────────────────────────────────────

class PublicSlotsView(_PublicBase):
    def get(self, request, slug):
        org = self._get_org(slug)
        bs = self._get_booking_settings(org)

        if not bs.is_booking_enabled:
            return Response({'slots': []})

        provider_id = request.query_params.get('provider_id')
        date_str = request.query_params.get('date')

        if not provider_id or not date_str:
            return Response(
                {'detail': 'provider_id and date are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            date = datetime.date.fromisoformat(date_str)
        except ValueError:
            return Response(
                {'detail': 'Invalid date. Use YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        today = datetime.date.today()
        if date < today or date > today + datetime.timedelta(days=bs.advance_booking_days):
            return Response({'slots': []})

        if date.strftime('%a').upper() not in bs.working_days:
            return Response({'slots': []})

        provider = get_object_or_404(Provider, id=provider_id, organization=org)

        # Generate all slots (timezone-aware)
        slot_start = make_aware(datetime.datetime.combine(date, bs.start_time))
        slot_end = make_aware(datetime.datetime.combine(date, bs.end_time))
        delta = datetime.timedelta(minutes=bs.slot_duration_mins)

        all_slots = []
        cur = slot_start
        while cur + delta <= slot_end:
            all_slots.append(cur)
            cur += delta

        # Fetch booked slots for this provider on this date
        day_start = make_aware(datetime.datetime.combine(date, datetime.time.min))
        day_end = make_aware(datetime.datetime.combine(date, datetime.time.max))

        booked = set(
            Appointment.objects.filter(
                organization=org,
                provider=provider,
                date_time__gte=day_start,
                date_time__lte=day_end,
            )
            .exclude(status=Appointment.Status.CANCELLED)
            .values_list('date_time', flat=True)
        )

        available = [dt.isoformat() for dt in all_slots if dt not in booked]
        return Response({'slots': available})


# ─── POST /api/public/<slug>/lookup-patient/ ──────────────────────────────────

class PublicLookupPatientView(_PublicBase):
    def post(self, request, slug):
        org = self._get_org(slug)
        phone = request.data.get('phone', '').strip()

        if not phone:
            return Response(
                {'detail': 'phone is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        patient = Patient.objects.filter(organization=org, phone_primary=phone).first()
        if patient:
            return Response({'found': True, 'first_name': patient.first_name})
        return Response({'found': False, 'first_name': None})


# ─── POST /api/public/<slug>/book/ ────────────────────────────────────────────

class PublicBookView(_PublicBase):
    throttle_classes = [PublicBookingThrottle]

    def post(self, request, slug):
        org = self._get_org(slug)
        bs = self._get_booking_settings(org)

        if not bs.is_booking_enabled:
            return Response(
                {'detail': 'Online booking is not enabled for this clinic.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        phone = request.data.get('phone', '').strip()
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        provider_id = request.data.get('provider_id')
        date_time_str = request.data.get('date_time', '').strip()

        if not all([phone, first_name, provider_id, date_time_str]):
            return Response(
                {'detail': 'phone, first_name, provider_id, and date_time are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            dt = datetime.datetime.fromisoformat(date_time_str)
            from django.utils import timezone
            if timezone.is_naive(dt):
                dt = make_aware(dt)
        except (ValueError, TypeError):
            return Response(
                {'detail': 'Invalid date_time format. Expected ISO 8601.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        provider = get_object_or_404(Provider, id=provider_id, organization=org)

        # Guard: slot must still be open
        slot_taken = (
            Appointment.objects.filter(
                organization=org,
                provider=provider,
                date_time=dt,
            )
            .exclude(status=Appointment.Status.CANCELLED)
            .exists()
        )
        if slot_taken:
            return Response(
                {'detail': 'This slot is no longer available. Please choose another time.'},
                status=status.HTTP_409_CONFLICT,
            )

        # Find or create patient (phone is the key)
        patient, _ = Patient.objects.get_or_create(
            organization=org,
            phone_primary=phone,
            defaults={'first_name': first_name, 'last_name': last_name},
        )

        appointment = Appointment.objects.create(
            organization=org,
            patient=patient,
            provider=provider,
            date_time=dt,
            status=Appointment.Status.SCHEDULED,
        )

        return Response(
            {
                'appointment_id': appointment.id,
                'reference': f"BK-{appointment.id:06d}",
                'provider_name': provider.user.get_full_name() or provider.user.username,
                'date_time': dt.isoformat(),
                'patient_name': f"{patient.first_name} {patient.last_name}".strip(),
                'clinic_name': org.name,
                'clinic_phone': org.phone,
                'clinic_address': org.address,
            },
            status=status.HTTP_201_CREATED,
        )
