from django.contrib import admin
from .models import MedicalRecord, Prescription, LabTest

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'date', 'diagnosis')
    list_filter = ('date', 'doctor')
    search_fields = ('patient__name', 'diagnosis', 'symptoms')
    date_hierarchy = 'date'

@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'date', 'status')
    list_filter = ('status', 'date', 'doctor')
    search_fields = ('patient__name', 'doctor__first_name', 'doctor__last_name')
    date_hierarchy = 'date'

@admin.register(LabTest)
class LabTestAdmin(admin.ModelAdmin):
    list_display = ('patient', 'test_type', 'ordered_by', 'ordered_date', 'status', 'priority')
    list_filter = ('status', 'priority', 'ordered_date')
    search_fields = ('patient__name', 'test_type', 'ordered_by__first_name', 'ordered_by__last_name')
    date_hierarchy = 'ordered_date'