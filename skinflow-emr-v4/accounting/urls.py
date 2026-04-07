from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AccountViewSet, BankAccountViewSet, JournalEntryViewSet, AccountingSettingsView, BankReconciliationViewSet, StatementLineViewSet

router = DefaultRouter()
router.register(r'accounts', AccountViewSet)
router.register(r'banks', BankAccountViewSet)
router.register(r'journals', JournalEntryViewSet)
router.register(r'reconciliations', BankReconciliationViewSet)
router.register(r'statement-lines', StatementLineViewSet)

urlpatterns = [
    path('settings/', AccountingSettingsView.as_view(), name='accounting-settings'),
    path('', include(router.urls)),
]
