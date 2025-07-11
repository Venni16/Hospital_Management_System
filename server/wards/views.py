from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Ward, Bed
from .serializers import WardSerializer, BedSerializer

class WardViewSet(viewsets.ModelViewSet):
    queryset = Ward.objects.all()
    serializer_class = WardSerializer
    
    def get_queryset(self):
        queryset = Ward.objects.prefetch_related('beds__patient').all()
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(department__icontains=search) |
                Q(nurse_in_charge__icontains=search)
            )
        
        # Filter by department
        department = self.request.query_params.get('department', None)
        if department:
            queryset = queryset.filter(department__icontains=department)
        
        # Filter by floor
        floor = self.request.query_params.get('floor', None)
        if floor:
            queryset = queryset.filter(floor=floor)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def occupancy_stats(self, request):
        """Get comprehensive ward occupancy statistics"""
        wards = Ward.objects.prefetch_related('beds').all()
        stats = []
        
        total_beds = 0
        total_occupied = 0
        total_available = 0
        total_maintenance = 0
        
        for ward in wards:
            occupied_beds = ward.beds.filter(status='occupied').count()
            available_beds = ward.beds.filter(status='available').count()
            maintenance_beds = ward.beds.filter(status='maintenance').count()
            cleaning_beds = ward.beds.filter(status='cleaning').count()
            
            occupancy_rate = 0
            if ward.total_beds > 0:
                occupancy_rate = round((occupied_beds / ward.total_beds) * 100, 1)
            
            ward_stats = {
                'id': ward.id,
                'name': ward.name,
                'department': ward.department,
                'floor': ward.floor,
                'total_beds': ward.total_beds,
                'occupied_beds': occupied_beds,
                'available_beds': available_beds,
                'maintenance_beds': maintenance_beds,
                'cleaning_beds': cleaning_beds,
                'occupancy_rate': occupancy_rate,
                'nurse_in_charge': ward.nurse_in_charge,
                'status': ward.status
            }
            stats.append(ward_stats)
            
            total_beds += ward.total_beds
            total_occupied += occupied_beds
            total_available += available_beds
            total_maintenance += maintenance_beds
        
        overall_occupancy = 0
        if total_beds > 0:
            overall_occupancy = round((total_occupied / total_beds) * 100, 1)
        
        return Response({
            'ward_stats': stats,
            'overall_stats': {
                'total_beds': total_beds,
                'total_occupied': total_occupied,
                'total_available': total_available,
                'total_maintenance': total_maintenance,
                'overall_occupancy_rate': overall_occupancy
            }
        })
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get ward analytics"""
        total_wards = Ward.objects.count()
        active_wards = Ward.objects.filter(status='active').count()
        
        # Department distribution
        department_distribution = Ward.objects.values('department').annotate(
            count=Count('department'),
            total_beds=Count('beds')
        )
        
        # Floor distribution
        floor_distribution = Ward.objects.values('floor').annotate(
            count=Count('floor'),
            total_beds=Count('beds')
        )
        
        # Average occupancy by department
        dept_occupancy = []
        for dept in Ward.objects.values_list('department', flat=True).distinct():
            dept_wards = Ward.objects.filter(department=dept)
            total_beds = sum([ward.total_beds for ward in dept_wards])
            occupied_beds = sum([ward.occupied_beds for ward in dept_wards])
            occupancy_rate = (occupied_beds / total_beds * 100) if total_beds > 0 else 0
            
            dept_occupancy.append({
                'department': dept,
                'total_beds': total_beds,
                'occupied_beds': occupied_beds,
                'occupancy_rate': round(occupancy_rate, 1)
            })
        
        return Response({
            'total_wards': total_wards,
            'active_wards': active_wards,
            'department_distribution': list(department_distribution),
            'floor_distribution': list(floor_distribution),
            'department_occupancy': dept_occupancy
        })
    
    @action(detail=True, methods=['get'])
    def bed_status(self, request, pk=None):
        """Get detailed bed status for a ward"""
        ward = self.get_object()
        beds = ward.beds.all().order_by('number')
        
        bed_data = []
        for bed in beds:
            bed_info = {
                'id': bed.id,
                'number': bed.number,
                'status': bed.status,
                'patient_id': bed.patient.id if bed.patient else None,
                'patient_name': bed.patient.name if bed.patient else None,
                'admission_date': bed.admission_date,
                'days_occupied': None
            }
            
            if bed.admission_date:
                days_occupied = (timezone.now().date() - bed.admission_date).days
                bed_info['days_occupied'] = days_occupied
            
            bed_data.append(bed_info)
        
        return Response({
            'ward': WardSerializer(ward).data,
            'beds': bed_data
        })
    
    @action(detail=False, methods=['get'])
    def available_beds(self, request):
        """Get all available beds across all wards"""
        available_beds = Bed.objects.filter(status='available').select_related('ward')
        
        beds_by_ward = {}
        for bed in available_beds:
            ward_name = bed.ward.name
            if ward_name not in beds_by_ward:
                beds_by_ward[ward_name] = {
                    'ward_id': bed.ward.id,
                    'ward_name': ward_name,
                    'department': bed.ward.department,
                    'floor': bed.ward.floor,
                    'beds': []
                }
            
            beds_by_ward[ward_name]['beds'].append({
                'id': bed.id,
                'number': bed.number
            })
        
        return Response(list(beds_by_ward.values()))

class BedViewSet(viewsets.ModelViewSet):
    queryset = Bed.objects.all()
    serializer_class = BedSerializer
    
    def get_queryset(self):
        queryset = Bed.objects.select_related('ward', 'patient').all()
        
        # Filter by ward
        ward_id = self.request.query_params.get('ward', None)
        if ward_id:
            queryset = queryset.filter(ward_id=ward_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by patient
        patient_id = self.request.query_params.get('patient', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        return queryset
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update bed status and patient assignment"""
        bed = self.get_object()
        new_status = request.data.get('status')
        patient_id = request.data.get('patient')
        
        if new_status not in ['available', 'occupied', 'maintenance', 'cleaning']:
            return Response(
                {'error': 'Invalid status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle patient assignment/removal
        if new_status == 'occupied' and patient_id:
            from patients.models import Patient
            try:
                patient = Patient.objects.get(id=patient_id)
                bed.patient = patient
                bed.admission_date = request.data.get('admission_date', timezone.now().date())
            except Patient.DoesNotExist:
                return Response(
                    {'error': 'Patient not found'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif new_status in ['available', 'maintenance', 'cleaning']:
            # Clear patient data if setting to non-occupied status
            bed.patient = None
            bed.admission_date = None
        
        bed.status = new_status
        bed.save()
        
        serializer = self.get_serializer(bed)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get all available beds"""
        beds = Bed.objects.filter(status='available').select_related('ward')
        serializer = self.get_serializer(beds, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def occupied(self, request):
        """Get all occupied beds"""
        beds = Bed.objects.filter(status='occupied').select_related('ward', 'patient')
        serializer = self.get_serializer(beds, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def maintenance(self, request):
        """Get beds under maintenance"""
        beds = Bed.objects.filter(status='maintenance').select_related('ward')
        serializer = self.get_serializer(beds, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get bed analytics"""
        total_beds = Bed.objects.count()
        available_beds = Bed.objects.filter(status='available').count()
        occupied_beds = Bed.objects.filter(status='occupied').count()
        maintenance_beds = Bed.objects.filter(status='maintenance').count()
        cleaning_beds = Bed.objects.filter(status='cleaning').count()
        
        # Status distribution
        status_distribution = Bed.objects.values('status').annotate(count=Count('status'))
        
        # Average occupancy duration
        occupied_with_dates = Bed.objects.filter(
            status='occupied',
            admission_date__isnull=False
        )
        
        avg_stay_days = 0
        if occupied_with_dates.exists():
            total_days = sum([
                (timezone.now().date() - bed.admission_date).days 
                for bed in occupied_with_dates
            ])
            avg_stay_days = total_days / occupied_with_dates.count()
        
        # Bed turnover (last 30 days)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent_admissions = Bed.objects.filter(
            admission_date__gte=thirty_days_ago
        ).count()
        
        return Response({
            'total_beds': total_beds,
            'available_beds': available_beds,
            'occupied_beds': occupied_beds,
            'maintenance_beds': maintenance_beds,
            'cleaning_beds': cleaning_beds,
            'occupancy_rate': round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0,
            'status_distribution': list(status_distribution),
            'avg_stay_days': round(avg_stay_days, 1),
            'recent_admissions': recent_admissions
        })
    
    @action(detail=True, methods=['post'])
    def assign_patient(self, request, pk=None):
        """Assign patient to bed"""
        bed = self.get_object()
        patient_id = request.data.get('patient_id')
        
        if bed.status != 'available':
            return Response(
                {'error': 'Bed is not available'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from patients.models import Patient
        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Patient not found'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update bed
        bed.patient = patient
        bed.status = 'occupied'
        bed.admission_date = timezone.now().date()
        bed.save()
        
        # Update patient
        patient.status = 'admitted'
        patient.ward = bed.ward
        patient.bed_number = bed.number
        patient.admission_date = timezone.now().date()
        patient.save()
        
        serializer = self.get_serializer(bed)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def discharge_patient(self, request, pk=None):
        """Discharge patient from bed"""
        bed = self.get_object()
        
        if bed.status != 'occupied' or not bed.patient:
            return Response(
                {'error': 'Bed is not occupied'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        patient = bed.patient
        
        # Update patient
        patient.status = 'discharged'
        patient.ward = None
        patient.bed_number = ''
        patient.admission_date = None
        patient.save()
        
        # Update bed
        bed.patient = None
        bed.status = 'cleaning'  # Set to cleaning after discharge
        bed.admission_date = None
        bed.save()
        
        serializer = self.get_serializer(bed)
        return Response(serializer.data)