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
        read_only_fields = ['ordered_by', 'ordered_date', 'created_at', 'updated_at']
    
    def get_days_pending(self, obj):
        if obj.status in ['completed', 'cancelled']:
            return 0
        
        from django.utils import timezone
        return (timezone.now().date() - obj.ordered_date).days
    
    def validate_priority(self, value):
        print(f"Validating priority with value: {value}, type: {type(value)}")
        if value not in ['routine', 'urgent', 'stat']:
            raise serializers.ValidationError("Invalid priority level")
        return value
    
    def validate_test_type(self, value):
        """Validate test type length"""
        print(f"Validating test_type with value: {value}, type: {type(value)}")
        if len(value) > 100:
            raise serializers.ValidationError("Test type cannot be longer than 100 characters")
        return value
    
    def validate_sample_type(self, value):
        """Validate sample type length"""
        print(f"Validating sample_type with value: {value}, type: {type(value)}")
        if value and len(value) > 50:
            raise serializers.ValidationError("Sample type cannot be longer than 50 characters")
        return value
    
    def validate_patient(self, value):
        """Validate that the patient exists (value is already a Patient instance)"""
        print(f"Validating patient with value: {value}, type: {type(value)}")
        if not value:
            raise serializers.ValidationError("Patient is required")
        return value
    
    def validate(self, data):
        """Custom validation for the entire object"""
        print(f"LabTestSerializer validate called with data: {data}")
        
        # Check if fasting_required is properly converted to boolean
        if 'fasting_required' in data:
            print(f"fasting_required type: {type(data['fasting_required'])}, value: {data['fasting_required']}")
        
        # Check other fields
        for field in ['notes', 'reference_values']:
            if field in data:
                print(f"{field} type: {type(data[field])}, value: {data[field]}")
        
        return data