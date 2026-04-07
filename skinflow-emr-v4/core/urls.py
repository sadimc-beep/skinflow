from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'organizations', views.OrganizationViewSet, basename='organization')
router.register(r'providers', views.ProviderViewSet, basename='provider')
router.register(r'roles', views.RoleViewSet, basename='role')
router.register(r'staff', views.ClinicStaffViewSet, basename='staff')

urlpatterns = [
    path('', include(router.urls)),
    path('settings/', views.ClinicSettingsView.as_view(), name='clinic-settings'),
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/role-stats/', views.RoleDashboardStatsView.as_view(), name='dashboard-role-stats'),
    path('auth/login/', views.LoginView.as_view(), name='auth-login'),
    path('auth/me/', views.MeView.as_view(), name='auth-me'),
]

