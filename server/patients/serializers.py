from rest_framework import serializers
from .models import Patient

class PatientSerializer(serializers.ModelSerializer):
    assigned_doctor_name = serializers.CharField(source='assigned_doctor.get_full_name', read_only=True)
    ward_name = serializers.CharField(source='ward.name', read_only=True)
    
    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ['registration_date', 'last_visit', 'created_at', 'updated_at']
    
    def validate_age(self, value):
        if value < 0 or value > 150:
            raise serializers.ValidationError("Age must be between 0 and 150")
        return value
    
    def validate_phone(self, value):
        if not value.replace('-', '').replace(' ', '').isdigit():
            raise serializers.ValidationError("Phone number must contain only digits, spaces, and hyphens")
        return value