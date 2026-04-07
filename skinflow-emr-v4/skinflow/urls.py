from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/core/', include('core.urls')),
    path('api/patients/', include('patients.urls')),
    path('api/masters/', include('masters.urls')),
    path('api/clinical/', include('clinical.urls')),
    path('api/billing/', include('billing.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/accounting/', include('accounting.urls')),
    path('api/saas/', include('saas.urls')),
    path('api/public/', include('clinical.public_urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
