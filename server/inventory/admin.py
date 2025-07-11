from django.contrib import admin
from .models import InventoryItem, InventoryTransaction

@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'quantity', 'unit', 'min_stock', 'is_low_stock', 'supplier', 'expiry_date')
    list_filter = ('category', 'supplier')
    search_fields = ('name', 'supplier', 'location')
    date_hierarchy = 'expiry_date'
    
    def is_low_stock(self, obj):
        return obj.is_low_stock
    is_low_stock.boolean = True
    is_low_stock.short_description = 'Low Stock'

@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ('item', 'transaction_type', 'quantity', 'reason', 'performed_by', 'date')
    list_filter = ('transaction_type', 'date')
    search_fields = ('item__name', 'reason')
    date_hierarchy = 'date'