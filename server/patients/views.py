from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Patient
from .serializers import PatientSerializer

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    
    def get_queryset(self):
        queryset = Patient.objects.all()
        
        # Filter patients for doctors - only show assigned patients
        if hasattr(self.request.user, 'role') and self.request.user.role == 'doctor':
            queryset = queryset.filter(assigned_doctor=self.request.user)
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(phone__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by doctor
        doctor_id = self.request.query_params.get('doctor', None)
        if doctor_id:
            queryset = queryset.filter(assigned_doctor_id=doctor_id)
        
        # Filter by age range
        min_age = self.request.query_params.get('min_age', None)
        max_age = self.request.query_params.get('max_age', None)
        if min_age:
            queryset = queryset.filter(age__gte=min_age)
        if max_age:
            queryset = queryset.filter(age__lte=max_age)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def my_patients(self, request):
        """Get patients assigned to the current doctor"""
        if hasattr(request.user, 'role') and request.user.role == 'doctor':
            patients = Patient.objects.filter(assigned_doctor=request.user)
            serializer = self.get_serializer(patients, many=True)
            return Response(serializer.data)
        return Response({'error': 'Only doctors can access this endpoint'}, status=403)
    
    @action(detail=False, methods=['get'])
    def admitted(self, request):
        """Get all admitted patients"""
        patients = Patient.objects.filter(status='admitted')
        serializer = self.get_serializer(patients, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def outpatients(self, request):
        """Get all outpatients"""
        patients = Patient.objects.filter(status='outpatient')
        serializer = self.get_serializer(patients, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def discharged(self, request):
        """Get all discharged patients"""
        patients = Patient.objects.filter(status='discharged')
        serializer = self.get_serializer(patients, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get patient analytics"""
        total_patients = Patient.objects.count()
        admitted_patients = Patient.objects.filter(status='admitted').count()
        outpatients = Patient.objects.filter(status='outpatient').count()
        discharged_patients = Patient.objects.filter(status='discharged').count()
        
        # Age distribution
        age_groups = {
            '0-18': Patient.objects.filter(age__lt=18).count(),
            '18-35': Patient.objects.filter(age__gte=18, age__lt=35).count(),
            '35-60': Patient.objects.filter(age__gte=35, age__lt=60).count(),
            '60+': Patient.objects.filter(age__gte=60).count()
        }
        
        # Gender distribution
        gender_distribution = Patient.objects.values('gender').annotate(count=Count('gender'))
        
        # Recent registrations (last 30 days)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent_registrations = Patient.objects.filter(registration_date__gte=thirty_days_ago).count()
        
        return Response({
            'total_patients': total_patients,
            'admitted_patients': admitted_patients,
            'outpatients': outpatients,
            'discharged_patients': discharged_patients,
            'age_groups': age_groups,
            'gender_distribution': list(gender_distribution),
            'recent_registrations': recent_registrations
        })
    
    @action(detail=True, methods=['post'])
    def admit(self, request, pk=None):
        """Admit a patient to a ward"""
        patient = self.get_object()
        ward_id = request.data.get('ward_id')
        bed_number = request.data.get('bed_number')
        
        if not ward_id or not bed_number:
            return Response(
                {'error': 'Ward ID and bed number are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if bed is available
        from wards.models import Bed
        try:
            bed = Bed.objects.get(ward_id=ward_id, number=bed_number, status='available')
        except Bed.DoesNotExist:
            return Response(
                {'error': 'Bed is not available'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update patient
        patient.status = 'admitted'
        patient.ward_id = ward_id
        patient.bed_number = bed_number
        patient.admission_date = timezone.now().date()
        patient.save()
        
        # Update bed
        bed.status = 'occupied'
        bed.patient = patient
        bed.admission_date = timezone.now().date()
        bed.save()
        
        serializer = self.get_serializer(patient)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def discharge(self, request, pk=None):
        """Discharge a patient"""
        patient = self.get_object()
        
        # Free up the bed if patient was admitted
        if patient.status == 'admitted' and patient.bed_number:
            from wards.models import Bed
            try:
                bed = Bed.objects.get(ward=patient.ward, number=patient.bed_number)
                bed.status = 'available'
                bed.patient = None
                bed.admission_date = None
                bed.save()
            except Bed.DoesNotExist:
                pass  # Bed might have been deleted
        
        # Update patient
        patient.status = 'discharged'
        patient.ward = None
        patient.bed_number = ''
        patient.admission_date = None
        patient.save()
        
        serializer = self.get_serializer(patient)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def medical_history(self, request, pk=None):
        """Get patient's complete medical history"""
        patient = self.get_object()
        
        # Get medical records
        from medical_records.models import MedicalRecord, Prescription, LabTest
        from medical_records.serializers import MedicalRecordSerializer, PrescriptionSerializer, LabTestSerializer
        
        medical_records = MedicalRecord.objects.filter(patient=patient).order_by('-date')
        prescriptions = Prescription.objects.filter(patient=patient).order_by('-date')
        lab_tests = LabTest.objects.filter(patient=patient).order_by('-ordered_date')
        
        return Response({
            'patient': self.get_serializer(patient).data,
            'medical_records': MedicalRecordSerializer(medical_records, many=True).data,
            'prescriptions': PrescriptionSerializer(prescriptions, many=True).data,
            'lab_tests': LabTestSerializer(lab_tests, many=True).data
        })
    
    @action(detail=True, methods=['get'])
    def appointments(self, request, pk=None):
        """Get patient's appointments"""
        patient = self.get_object()
        
        from appointments.models import Appointment
        from appointments.serializers import AppointmentSerializer
        
        appointments = Appointment.objects.filter(patient=patient).order_by('-date', '-time')
        
        return Response({
            'patient': self.get_serializer(patient).data,
            'appointments': AppointmentSerializer(appointments, many=True).data
        })
    
    @action(detail=True, methods=['get'])
    def bills(self, request, pk=None):
        """Get patient's billing history"""
        patient = self.get_object()
        
        from billing.models import Bill
        from billing.serializers import BillSerializer
        
        bills = Bill.objects.filter(patient=patient).order_by('-date')
        
        return Response({
            'patient': self.get_serializer(patient).data,
            'bills': BillSerializer(bills, many=True).data
        })
    
    @action(detail=False, methods=['get'])
    def search_advanced(self, request):
        """Advanced patient search with multiple criteria"""
        queryset = Patient.objects.all()
        
        # Multiple search criteria
        name = request.query_params.get('name', None)
        phone = request.query_params.get('phone', None)
        email = request.query_params.get('email', None)
        blood_type = request.query_params.get('blood_type', None)
        doctor_id = request.query_params.get('doctor_id', None)
        status = request.query_params.get('status', None)
        
        if name:
            queryset = queryset.filter(name__icontains=name)
        if phone:
            queryset = queryset.filter(phone__icontains=phone)
        if email:
            queryset = queryset.filter(email__icontains=email)
        if blood_type:
            queryset = queryset.filter(blood_type=blood_type)
        if doctor_id:
            queryset = queryset.filter(assigned_doctor_id=doctor_id)
        if status:
            queryset = queryset.filter(status=status)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)