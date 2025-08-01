from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Count
from datetime import datetime, timedelta
from .models import MedicalRecord, Prescription, LabTest
from .serializers import MedicalRecordSerializer, PrescriptionSerializer, LabTestSerializer

class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    
    def get_queryset(self):
        queryset = MedicalRecord.objects.all()
        
        # Filter for doctors - only show their records
        if self.request.user.role == 'doctor':
            queryset = queryset.filter(doctor=self.request.user)
        
        # Filter by patient
        patient_id = self.request.query_params.get('patient', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Search by diagnosis or symptoms
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(diagnosis__icontains=search) |
                Q(symptoms__icontains=search) |
                Q(treatment__icontains=search)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get medical records analytics"""
        total_records = MedicalRecord.objects.count()
        
        # Recent records (last 30 days)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent_records = MedicalRecord.objects.filter(date__gte=thirty_days_ago).count()
        
        # Common diagnoses
        common_diagnoses = MedicalRecord.objects.values('diagnosis').annotate(
            count=Count('diagnosis')
        ).order_by('-count')[:10]
        
        # Records by doctor
        records_by_doctor = MedicalRecord.objects.values(
            'doctor__first_name', 'doctor__last_name'
        ).annotate(count=Count('id')).order_by('-count')
        
        # Follow-up appointments needed
        follow_ups_needed = MedicalRecord.objects.filter(
            follow_up__isnull=False,
            follow_up__gte=timezone.now().date()
        ).count()
        
        return Response({
            'total_records': total_records,
            'recent_records': recent_records,
            'common_diagnoses': list(common_diagnoses),
            'records_by_doctor': list(records_by_doctor),
            'follow_ups_needed': follow_ups_needed
        })
    
    @action(detail=False, methods=['get'])
    def follow_ups(self, request):
        """Get records that need follow-up"""
        today = timezone.now().date()
        records = MedicalRecord.objects.filter(
            follow_up__isnull=False,
            follow_up__gte=today
        ).order_by('follow_up')
        
        serializer = self.get_serializer(records, many=True)
        return Response(serializer.data)

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    
    def get_queryset(self):
        queryset = Prescription.objects.all()
        
        # Filter for doctors - only show their prescriptions
        if self.request.user.role == 'doctor':
            queryset = queryset.filter(doctor=self.request.user)
        
        # Filter by patient
        patient_id = self.request.query_params.get('patient', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active prescriptions"""
        prescriptions = self.get_queryset().filter(status='active')
        serializer = self.get_serializer(prescriptions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get prescription analytics"""
        total_prescriptions = Prescription.objects.count()
        active_prescriptions = Prescription.objects.filter(status='active').count()
        completed_prescriptions = Prescription.objects.filter(status='completed').count()
        cancelled_prescriptions = Prescription.objects.filter(status='cancelled').count()
        
        # Recent prescriptions (last 30 days)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent_prescriptions = Prescription.objects.filter(date__gte=thirty_days_ago).count()
        
        # Prescriptions by doctor
        prescriptions_by_doctor = Prescription.objects.values(
            'doctor__first_name', 'doctor__last_name'
        ).annotate(count=Count('id')).order_by('-count')
        
        return Response({
            'total_prescriptions': total_prescriptions,
            'active_prescriptions': active_prescriptions,
            'completed_prescriptions': completed_prescriptions,
            'cancelled_prescriptions': cancelled_prescriptions,
            'recent_prescriptions': recent_prescriptions,
            'prescriptions_by_doctor': list(prescriptions_by_doctor)
        })
    
    @action(detail=True, methods=['patch'])
    def complete(self, request, pk=None):
        """Mark prescription as completed"""
        prescription = self.get_object()
        prescription.status = 'completed'
        prescription.save()
        
        serializer = self.get_serializer(prescription)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        """Cancel prescription"""
        prescription = self.get_object()
        prescription.status = 'cancelled'
        prescription.save()
        
        serializer = self.get_serializer(prescription)
        return Response(serializer.data)

class LabTestViewSet(viewsets.ModelViewSet):
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer
    
    def create(self, request, *args, **kwargs):
        print(f"LabTestViewSet create called with data: {request.data}")
        return super().create(request, *args, **kwargs)
    
    def get_queryset(self):
        queryset = LabTest.objects.all()
        
        # Filter for doctors - only show tests they ordered
        if self.request.user.role == 'doctor':
            queryset = queryset.filter(ordered_by=self.request.user)
        
        # Filter by patient
        patient_id = self.request.query_params.get('patient', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by priority
        priority_filter = self.request.query_params.get('priority', None)
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        # Filter by test type
        test_type = self.request.query_params.get('test_type', None)
        if test_type:
            queryset = queryset.filter(test_type__icontains=test_type)
        
        return queryset
    
    def perform_create(self, serializer):
        print(f"LabTestViewSet perform_create called with data: {serializer.validated_data}")
        serializer.save(ordered_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending lab tests"""
        tests = self.get_queryset().filter(status='pending')
        serializer = self.get_serializer(tests, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def urgent(self, request):
        """Get urgent lab tests"""
        tests = self.get_queryset().filter(priority__in=['urgent', 'stat'])
        serializer = self.get_serializer(tests, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def completed(self, request):
        """Get completed lab tests"""
        tests = self.get_queryset().filter(status='completed')
        serializer = self.get_serializer(tests, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get lab test analytics"""
        total_tests = LabTest.objects.count()
        pending_tests = LabTest.objects.filter(status='pending').count()
        in_progress_tests = LabTest.objects.filter(status='in_progress').count()
        completed_tests = LabTest.objects.filter(status='completed').count()
        cancelled_tests = LabTest.objects.filter(status='cancelled').count()
        
        # Priority distribution
        priority_distribution = LabTest.objects.values('priority').annotate(count=Count('priority'))
        
        # Test type distribution
        test_type_distribution = LabTest.objects.values('test_type').annotate(
            count=Count('test_type')
        ).order_by('-count')[:10]
        
        # Recent tests (last 30 days)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent_tests = LabTest.objects.filter(ordered_date__gte=thirty_days_ago).count()
        
        # Average completion time (for completed tests)
        completed_with_dates = LabTest.objects.filter(
            status='completed',
            completed_date__isnull=False
        )
        
        avg_completion_days = 0
        if completed_with_dates.exists():
            total_days = sum([
                (test.completed_date - test.ordered_date).days 
                for test in completed_with_dates
            ])
            avg_completion_days = total_days / completed_with_dates.count()
        
        return Response({
            'total_tests': total_tests,
            'pending_tests': pending_tests,
            'in_progress_tests': in_progress_tests,
            'completed_tests': completed_tests,
            'cancelled_tests': cancelled_tests,
            'priority_distribution': list(priority_distribution),
            'test_type_distribution': list(test_type_distribution),
            'recent_tests': recent_tests,
            'avg_completion_days': round(avg_completion_days, 1)
        })
    
    @action(detail=True, methods=['patch'])
    def complete(self, request, pk=None):
        """Mark lab test as completed"""
        test = self.get_object()
        test.status = 'completed'
        test.completed_date = timezone.now().date()
        test.results = request.data.get('results', '')
        test.notes = request.data.get('notes', test.notes)
        test.save()
        
        serializer = self.get_serializer(test)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def start_processing(self, request, pk=None):
        """Mark lab test as in progress"""
        test = self.get_object()
        test.status = 'in_progress'
        test.save()
        
        serializer = self.get_serializer(test)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        """Cancel lab test"""
        test = self.get_object()
        test.status = 'cancelled'
        test.notes = request.data.get('reason', test.notes)
        test.save()
        
        serializer = self.get_serializer(test)
        return Response(serializer.data)