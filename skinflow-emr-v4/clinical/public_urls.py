from django.urls import path
from .public_views import (
    PublicClinicInfoView,
    PublicSlotsView,
    PublicLookupPatientView,
    PublicBookView,
)

urlpatterns = [
    path('<slug:slug>/info/', PublicClinicInfoView.as_view(), name='public-clinic-info'),
    path('<slug:slug>/slots/', PublicSlotsView.as_view(), name='public-slots'),
    path('<slug:slug>/lookup-patient/', PublicLookupPatientView.as_view(), name='public-lookup-patient'),
    path('<slug:slug>/book/', PublicBookView.as_view(), name='public-book'),
]
