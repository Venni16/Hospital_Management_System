from rest_framework import serializers
from .models import Visitor

class VisitorSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)

    def validate_patient(self, value):
        if not value:
            raise serializers.ValidationError("Patient must be provided.")
        if not value.pk:
            raise serializers.ValidationError("Invalid patient reference.")
        return value

    class Meta:
        model = Visitor
        fields = '__all__'
