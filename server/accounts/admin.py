from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'department', 'status')
    list_filter = ('role', 'status', 'department', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Hospital Info', {
            'fields': ('role', 'department', 'phone', 'specialization', 'experience', 'status')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Hospital Info', {
            'fields': ('role', 'department', 'phone', 'specialization', 'experience', 'status')
        }),
    )