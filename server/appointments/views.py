from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Count
from datetime import datetime, timedelta
from .models import Appointment
from .serializers import AppointmentSerializer

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    
    def get_queryset(self):
        queryset = Appointment.objects.all()
        
        # Filter appointments for doctors - only show their appointments
        if self.request.user.role == 'doctor':
            queryset = queryset.filter(doctor=self.request.user)
        
        # Filter by date
        date_filter = self.request.query_params.get('date', None)
        if date_filter:
            queryset = queryset.filter(date=date_filter)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by doctor
        doctor_id = self.request.query_params.get('doctor', None)
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        
        # Filter by patient
        patient_id = self.request.query_params.get('patient', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        # Filter by type
        type_filter = self.request.query_params.get('type', None)
        if type_filter:
            queryset = queryset.filter(type=type_filter)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's appointments"""
        today = timezone.now().date()
        appointments = self.get_queryset().filter(date=today)
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def tomorrow(self, request):
        """Get tomorrow's appointments"""
        tomorrow = timezone.now().date() + timedelta(days=1)
        appointments = self.get_queryset().filter(date=tomorrow)
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def this_week(self, request):
        """Get this week's appointments"""
        today = timezone.now().date()
        week_end = today + timedelta(days=7)
        appointments = self.get_queryset().filter(date__range=[today, week_end])
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming appointments"""
        today = timezone.now().date()
        appointments = self.get_queryset().filter(
            date__gte=today,
            status='scheduled'
        )
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def past(self, request):
        """Get past appointments"""
        today = timezone.now().date()
        appointments = self.get_queryset().filter(date__lt=today)
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get appointment analytics"""
        total_appointments = Appointment.objects.count()
        scheduled_appointments = Appointment.objects.filter(status='scheduled').count()
        completed_appointments = Appointment.objects.filter(status='completed').count()
        cancelled_appointments = Appointment.objects.filter(status='cancelled').count()
        no_show_appointments = Appointment.objects.filter(status='no_show').count()
        
        # Today's statistics
        today = timezone.now().date()
        today_appointments = Appointment.objects.filter(date=today).count()
        today_completed = Appointment.objects.filter(date=today, status='completed').count()
        
        # Type distribution
        type_distribution = Appointment.objects.values('type').annotate(count=Count('type'))
        
        # Weekly appointments
        week_start = today - timedelta(days=today.weekday())
        weekly_appointments = []
        for i in range(7):
            day = week_start + timedelta(days=i)
            count = Appointment.objects.filter(date=day).count()
            weekly_appointments.append({
                'date': day.strftime('%Y-%m-%d'),
                'day': day.strftime('%A'),
                'count': count
            })
        
        return Response({
            'total_appointments': total_appointments,
            'scheduled_appointments': scheduled_appointments,
            'completed_appointments': completed_appointments,
            'cancelled_appointments': cancelled_appointments,
            'no_show_appointments': no_show_appointments,
            'today_appointments': today_appointments,
            'today_completed': today_completed,
            'type_distribution': list(type_distribution),
            'weekly_appointments': weekly_appointments
        })
    
    @action(detail=True, methods=['patch'])
    def complete(self, request, pk=None):
        """Mark appointment as completed"""
        appointment = self.get_object()
        
        # Only allow doctors to complete their own appointments
        if request.user.role == 'doctor' and appointment.doctor != request.user:
            return Response(
                {'error': 'You can only complete your own appointments'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        appointment.status = 'completed'
        appointment.save()
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        """Cancel appointment"""
        appointment = self.get_object()
        reason = request.data.get('reason', '')
        
        appointment.status = 'cancelled'
        if reason:
            appointment.notes = f"Cancelled: {reason}"
        appointment.save()
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def no_show(self, request, pk=None):
        """Mark appointment as no show"""
        appointment = self.get_object()
        appointment.status = 'no_show'
        appointment.save()
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def reschedule(self, request, pk=None):
        """Reschedule appointment"""
        appointment = self.get_object()
        new_date = request.data.get('date')
        new_time = request.data.get('time')
        
        if not new_date or not new_time:
            return Response(
                {'error': 'New date and time are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if new slot is available
        existing = Appointment.objects.filter(
            doctor=appointment.doctor,
            date=new_date,
            time=new_time,
            status='scheduled'
        ).exclude(id=appointment.id)
        
        if existing.exists():
            return Response(
                {'error': 'Time slot is not available'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.date = new_date
        appointment.time = new_time
        appointment.save()
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available_slots(self, request):
        """Get available appointment slots for a doctor on a specific date"""
        doctor_id = request.query_params.get('doctor_id')
        date = request.query_params.get('date')
        
        if not doctor_id or not date:
            return Response(
                {'error': 'Doctor ID and date are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get existing appointments for the doctor on that date
        existing_appointments = Appointment.objects.filter(
            doctor_id=doctor_id,
            date=date,
            status='scheduled'
        ).values_list('time', flat=True)
        
        # Generate available time slots (9 AM to 5 PM, 30-minute intervals)
        available_slots = []
        start_time = datetime.strptime('09:00', '%H:%M').time()
        end_time = datetime.strptime('17:00', '%H:%M').time()
        
        current_time = datetime.combine(datetime.today(), start_time)
        end_datetime = datetime.combine(datetime.today(), end_time)
        
        while current_time < end_datetime:
            time_str = current_time.strftime('%H:%M')
            if current_time.time() not in existing_appointments:
                available_slots.append(time_str)
            current_time += timedelta(minutes=30)
        
        return Response({'available_slots': available_slots})
    
    @action(detail=False, methods=['get'])
    def doctor_schedule(self, request):
        """Get doctor's schedule for a specific date range"""
        doctor_id = request.query_params.get('doctor_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not doctor_id:
            return Response(
                {'error': 'Doctor ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = Appointment.objects.filter(doctor_id=doctor_id)
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        appointments = queryset.order_by('date', 'time')
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)