from django.contrib import admin
from .models import Bill, Payment

class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ('date',)

@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ('patient', 'date', 'total_amount', 'paid_amount', 'remaining_amount', 'status')
    list_filter = ('status', 'date')
    search_fields = ('patient__name',)
    date_hierarchy = 'date'
    inlines = [PaymentInline]
    
    def remaining_amount(self, obj):
        return obj.remaining_amount
    remaining_amount.short_description = 'Remaining Amount'

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('bill', 'amount', 'payment_method', 'processed_by', 'date')
    list_filter = ('payment_method', 'date')
    search_fields = ('bill__patient__name', 'transaction_id')
    date_hierarchy = 'date'