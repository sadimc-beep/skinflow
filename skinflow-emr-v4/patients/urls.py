from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.PatientViewSet, basename='patient')

urlpatterns = [
    path('kiosk/register/', views.KioskPatientView.as_view(), name='kiosk-patient'),
    path('kiosk/lookup/', views.KioskPatientView.as_view(), name='kiosk-patient-lookup'),
    path('', include(router.urls)),
]
