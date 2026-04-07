from django.contrib import admin
from .models import (
    ProductCategory, UnitOfMeasure, Product, StockLocation,
    StockItem, StockMovement, InventoryRequisition, InventoryRequisitionLine
)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'product_type', 'category', 'is_saleable', 'is_stock_tracked', 'sale_price')
    list_filter = ('product_type', 'is_saleable', 'is_stock_tracked', 'category')
    search_fields = ('name', 'sku')

@admin.register(StockItem)
class StockItemAdmin(admin.ModelAdmin):
    list_display = ('product', 'location', 'quantity')
    list_filter = ('location', 'product__product_type')
    search_fields = ('product__name',)

@admin.register(InventoryRequisition)
class InventoryRequisitionAdmin(admin.ModelAdmin):
    list_display = ('id', 'status', 'created_at')
    list_filter = ('status', 'created_at')

admin.site.register(ProductCategory)
admin.site.register(UnitOfMeasure)
admin.site.register(StockLocation)
admin.site.register(StockMovement)
admin.site.register(InventoryRequisitionLine)
