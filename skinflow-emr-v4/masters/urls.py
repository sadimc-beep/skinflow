from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'procedure-categories', views.ProcedureCategoryViewSet, basename='procedure-category')
router.register(r'procedure-types', views.ProcedureTypeViewSet, basename='procedure-type')
router.register(r'procedure-rooms', views.ProcedureRoomViewSet, basename='procedure-room')
router.register(r'medicines', views.MedicineMasterViewSet, basename='medicine')
router.register(r'lab-tests', views.LabTestMasterViewSet, basename='lab-test')

urlpatterns = [
    path('', include(router.urls)),
]
