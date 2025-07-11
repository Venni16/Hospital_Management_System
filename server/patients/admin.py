from django.contrib import admin
from .models import Patient

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('name', 'age', 'gender', 'phone', 'assigned_doctor', 'status', 'registration_date')
    list_filter = ('status', 'gender', 'assigned_doctor', 'registration_date')
    search_fields = ('name', 'phone', 'email')
    date_hierarchy = 'registration_date'
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('name', 'age', 'gender', 'phone', 'email', 'address', 'emergency_contact')
        }),
        ('Medical Information', {
            'fields': ('blood_type', 'allergies', 'assigned_doctor')
        }),
        ('Hospital Status', {
            'fields': ('status', 'ward', 'bed_number', 'admission_date')
        }),
    )