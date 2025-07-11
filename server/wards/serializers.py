from rest_framework import serializers
from .models import Ward, Bed

class BedSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    patient_id = serializers.IntegerField(source='patient.id', read_only=True)
    
    class Meta:
        model = Bed
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class WardSerializer(serializers.ModelSerializer):
    beds = BedSerializer(many=True, read_only=True)
    occupied_beds = serializers.ReadOnlyField()
    available_beds = serializers.ReadOnlyField()
    occupancy_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Ward
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_occupancy_percentage(self, obj):
        if obj.total_beds == 0:
            return 0
        return round((obj.occupied_beds / obj.total_beds) * 100, 1)
    
    def create(self, validated_data):
        ward = Ward.objects.create(**validated_data)
        
        # Create beds for the ward
        total_beds = validated_data['total_beds']
        ward_prefix = validated_data['name'][:3].upper()
        
        beds = []
        for i in range(1, total_beds + 1):
            bed_number = f"{ward_prefix}-{str(i).zfill(2)}"
            beds.append(Bed(ward=ward, number=bed_number))
        
        Bed.objects.bulk_create(beds)
        return ward
    
    def update(self, instance, validated_data):
        # Update ward fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # If total_beds changed, adjust beds
        if 'total_beds' in validated_data:
            current_bed_count = instance.beds.count()
            new_bed_count = validated_data['total_beds']
            
            if new_bed_count > current_bed_count:
                # Add new beds
                ward_prefix = instance.name[:3].upper()
                beds_to_add = []
                for i in range(current_bed_count + 1, new_bed_count + 1):
                    bed_number = f"{ward_prefix}-{str(i).zfill(2)}"
                    beds_to_add.append(Bed(ward=instance, number=bed_number))
                Bed.objects.bulk_create(beds_to_add)
            
            elif new_bed_count < current_bed_count:
                # Remove excess beds (only if they're available)
                excess_beds = instance.beds.filter(status='available')[new_bed_count:]
                for bed in excess_beds:
                    bed.delete()
        
        return instance