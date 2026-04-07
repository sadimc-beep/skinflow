from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'appointments', views.AppointmentViewSet, basename='appointment')
router.register(r'consultations', views.ConsultationViewSet, basename='consultation')
router.register(r'procedure-sessions', views.ProcedureSessionViewSet, basename='procedure-session')
router.register(r'intakes', views.ClinicalIntakeViewSet, basename='clinicalintake')
router.register(r'prescriptions', views.PrescriptionViewSet, basename='prescription')
router.register(r'prescription-medications', views.PrescriptionMedicationViewSet, basename='prescription-medication')
router.register(r'prescription-products', views.PrescriptionProductViewSet, basename='prescription-product')
router.register(r'prescription-procedures', views.PrescriptionProcedureViewSet, basename='prescription-procedure')
router.register(r'treatment-plans', views.TreatmentPlanViewSet, basename='treatment-plan')
router.register(r'treatment-plan-items', views.TreatmentPlanItemViewSet, basename='treatment-plan-item')
router.register(r'photos', views.ClinicalPhotoViewSet, basename='clinical-photo')
router.register(r'consent-templates', views.ConsentFormTemplateViewSet, basename='consent-template')
router.register(r'consent-forms', views.ConsentFormViewSet, basename='consent-form')

urlpatterns = [
    path('kiosk/appointments/', views.KioskAppointmentView.as_view(), name='kiosk-appointments'),
    path('kiosk/appointments/<int:pk>/checkin/', views.KioskAppointmentCheckinView.as_view(), name='kiosk-checkin'),
    path('', include(router.urls)),
]
