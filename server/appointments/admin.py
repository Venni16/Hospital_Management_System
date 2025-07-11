from django.contrib import admin
from .models import Appointment

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'date', 'time', 'type', 'status')
    list_filter = ('status', 'type', 'date', 'doctor')
    search_fields = ('patient__name', 'doctor__first_name', 'doctor__last_name')
    date_hierarchy = 'date'
    
    fieldsets = (
        ('Appointment Details', {
            'fields': ('patient', 'doctor', 'date', 'time', 'type')
        }),
        ('Status & Notes', {
            'fields': ('status', 'notes')
        }),
    )