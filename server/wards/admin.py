from django.contrib import admin
from .models import Ward, Bed

class BedInline(admin.TabularInline):
    model = Bed
    extra = 0
    readonly_fields = ('patient',)

@admin.register(Ward)
class WardAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'floor', 'total_beds', 'occupied_beds', 'available_beds', 'status')
    list_filter = ('department', 'floor', 'status')
    search_fields = ('name', 'department')
    inlines = [BedInline]

@admin.register(Bed)
class BedAdmin(admin.ModelAdmin):
    list_display = ('ward', 'number', 'patient', 'status', 'admission_date')
    list_filter = ('ward', 'status')
    search_fields = ('number', 'patient__name')