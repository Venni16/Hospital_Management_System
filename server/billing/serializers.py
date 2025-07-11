from rest_framework import serializers
from .models import Bill, Payment

class PaymentSerializer(serializers.ModelSerializer):
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['date']

class BillSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    remaining_amount = serializers.ReadOnlyField()
    payments = PaymentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Bill
        fields = '__all__'
        read_only_fields = ['date', 'created_at', 'updated_at']
    
    def validate_services(self, value):
        if not isinstance(value, list) or len(value) == 0:
            raise serializers.ValidationError("At least one service is required")
        
        for service in value:
            if not isinstance(service, dict) or 'name' not in service or 'amount' not in service:
                raise serializers.ValidationError("Each service must have 'name' and 'amount' fields")
        
        return value
    
    def validate_total_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Total amount must be greater than 0")
        return value