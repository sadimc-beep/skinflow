from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'products', views.ProductViewSet, basename='product')
router.register(r'categories', views.ProductCategoryViewSet, basename='category')
router.register(r'uom', views.UnitOfMeasureViewSet, basename='uom')
router.register(r'locations', views.StockLocationViewSet, basename='location')
router.register(r'stock', views.StockItemViewSet, basename='stockitem')
router.register(r'movements', views.StockMovementViewSet, basename='movement')
router.register(r'requisitions', views.InventoryRequisitionViewSet, basename='requisition')
router.register(r'requisition-lines', views.InventoryRequisitionLineViewSet, basename='requisition-line')

# Procurement
router.register(r'vendors', views.VendorViewSet, basename='vendor')
router.register(r'purchase-orders', views.PurchaseOrderViewSet, basename='purchaseorder')
router.register(r'purchase-order-lines', views.PurchaseOrderLineViewSet, basename='purchaseorder-line')
router.register(r'grns', views.GRNViewSet, basename='grn')
router.register(r'grn-lines', views.GRNLineViewSet, basename='grn-line')
router.register(r'vendor-bills', views.VendorBillViewSet, basename='vendorbill')

urlpatterns = [
    path('', include(router.urls)),
]
