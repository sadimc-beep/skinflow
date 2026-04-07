from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'plans', views.PlanViewSet, basename='plan')
router.register(r'subscriptions', views.SubscriptionViewSet, basename='subscription')
router.register(r'organizations', views.SaaSOrganizationViewSet, basename='saas-organization')
router.register(r'audit-logs', views.AuditLogViewSet, basename='audit-log')
router.register(r'announcements', views.AnnouncementViewSet, basename='announcement')
router.register(r'impersonation', views.ImpersonationViewSet, basename='impersonation')

urlpatterns = [
    path('', include(router.urls)),
]
