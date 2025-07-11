from rest_framework import serializers
from .models import MedicalRecord, Prescription, LabTest

class MedicalRecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    
    class Meta:
        model = MedicalRecord
        fields = '__all__'
        read_only_fields = ['date', 'created_at', 'updated_at']
    
    def validate_medications(self, value):
        """Validate medications format"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Medications must be a list")
        
        for medication in value:
            if not isinstance(medication, dict):
                raise serializers.ValidationError("Each medication must be an object")
            
            required_fields = ['name', 'dosage', 'frequency']
            for field in required_fields:
                if field not in medication:
                    raise serializers.ValidationError(f"Medication must include {field}")
        
        return value
    
    def validate_vital_signs(self, value):
        """Validate vital signs format"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Vital signs must be an object")
        return value

class PrescriptionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    refills_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = Prescription
        fields = '__all__'
        read_only_fields = ['date', 'created_at', 'updated_at']
    
    def get_refills_remaining(self, obj):
        return max(0, obj.refills_allowed - obj.refills_used)
    
    def validate_medications(self, value):
        """Validate medications format"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Medications must be a list")
        
        for medication in value:
            if not isinstance(medication, dict):
                raise serializers.ValidationError("Each medication must be an object")
            
            required_fields = ['name', 'dosage', 'frequency', 'duration']
            for field in required_fields:
                if field not in medication:
                    raise serializers.ValidationError(f"Medication must include {field}")
        
        return value
    
    def validate_refills_used(self, value):
        if value < 0:
            raise serializers.ValidationError("Refills used cannot be negative")
        return value

class LabTestSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    ordered_by_name = serializers.CharField(source='ordered_by.get_full_name', read_only=True)
    days_pending = serializers.SerializerMethodField()
    
    class Meta:
        model = LabTest
        fields = '__all__'
        read_only_fields = ['ordered_date', 'created_at', 'updated_at']
    
    def get_days_pending(self, obj):
        if obj.status in ['completed', 'cancelled']:
            return 0
        
        from django.utils import timezone
        return (timezone.now().date() - obj.ordered_date).days
    
    def validate_priority(self, value):
        if value not in ['routine', 'urgent', 'stat']:
            raise serializers.ValidationError("Invalid priority level")
        return value