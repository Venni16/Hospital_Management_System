from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Count, Q
from decimal import Decimal
from datetime import datetime, timedelta
from .models import Bill, Payment
from .serializers import BillSerializer, PaymentSerializer

class BillViewSet(viewsets.ModelViewSet):
    queryset = Bill.objects.all()
    serializer_class = BillSerializer
    
    def get_queryset(self):
        queryset = Bill.objects.all()
        
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
        
        # Search by patient name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(patient__name__icontains=search)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending bills"""
        bills = Bill.objects.filter(status__in=['pending', 'partial'])
        serializer = self.get_serializer(bills, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def paid(self, request):
        """Get paid bills"""
        bills = Bill.objects.filter(status='paid')
        serializer = self.get_serializer(bills, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue bills (pending for more than 30 days)"""
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        bills = Bill.objects.filter(
            status__in=['pending', 'partial'],
            date__lt=thirty_days_ago
        )
        serializer = self.get_serializer(bills, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def revenue_stats(self, request):
        """Get comprehensive revenue statistics"""
        # Basic stats
        total_revenue = Bill.objects.filter(status='paid').aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        pending_amount = Bill.objects.filter(status__in=['pending', 'partial']).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        paid_amount = Bill.objects.aggregate(total=Sum('paid_amount'))['total'] or 0
        
        # Today's revenue
        today = timezone.now().date()
        today_revenue = Payment.objects.filter(date__date=today).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # This month's revenue
        month_start = today.replace(day=1)
        month_revenue = Payment.objects.filter(date__date__gte=month_start).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # This year's revenue
        year_start = today.replace(month=1, day=1)
        year_revenue = Payment.objects.filter(date__date__gte=year_start).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Bill counts
        total_bills = Bill.objects.count()
        paid_bills = Bill.objects.filter(status='paid').count()
        pending_bills = Bill.objects.filter(status__in=['pending', 'partial']).count()
        
        # Average bill amount
        avg_bill_amount = Bill.objects.aggregate(avg=Sum('total_amount'))['avg'] or 0
        if total_bills > 0:
            avg_bill_amount = avg_bill_amount / total_bills
        
        # Payment method distribution
        payment_methods = Payment.objects.values('payment_method').annotate(
            count=Count('payment_method'),
            total=Sum('amount')
        )
        
        # Daily revenue for last 30 days
        daily_revenue = []
        for i in range(30):
            date = today - timedelta(days=i)
            revenue = Payment.objects.filter(date__date=date).aggregate(
                total=Sum('amount')
            )['total'] or 0
            daily_revenue.append({
                'date': date.strftime('%Y-%m-%d'),
                'revenue': float(revenue)
            })
        
        return Response({
            'total_revenue': float(total_revenue),
            'pending_amount': float(pending_amount),
            'paid_amount': float(paid_amount),
            'today_revenue': float(today_revenue),
            'month_revenue': float(month_revenue),
            'year_revenue': float(year_revenue),
            'total_bills': total_bills,
            'paid_bills': paid_bills,
            'pending_bills': pending_bills,
            'avg_bill_amount': float(avg_bill_amount),
            'payment_methods': list(payment_methods),
            'daily_revenue': daily_revenue
        })
    
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """Add payment to a bill"""
        bill = self.get_object()
        amount = request.data.get('amount')
        payment_method = request.data.get('payment_method', 'cash')
        
        try:
            # Convert to Decimal to match the model field type
            amount = Decimal(str(amount))
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid payment amount'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if amount <= 0:
            return Response(
                {'error': 'Payment amount must be greater than 0'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if amount > bill.remaining_amount:
            return Response(
                {'error': 'Payment amount exceeds remaining balance'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create payment record
        payment = Payment.objects.create(
            bill=bill,
            amount=amount,
            payment_method=payment_method,
            transaction_id=request.data.get('transaction_id', ''),
            notes=request.data.get('notes', ''),
            processed_by=request.user
        )
        
        # Update bill - use Decimal arithmetic
        bill.paid_amount += amount
        if bill.paid_amount >= bill.total_amount:
            bill.status = 'paid'
            bill.payment_date = timezone.now().date()
        else:
            bill.status = 'partial'
        
        bill.save()
        
        serializer = self.get_serializer(bill)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def mark_paid(self, request, pk=None):
        """Mark bill as fully paid"""
        bill = self.get_object()
        
        remaining = bill.remaining_amount
        if remaining > 0:
            # Create payment for remaining amount
            Payment.objects.create(
                bill=bill,
                amount=remaining,
                payment_method=request.data.get('payment_method', 'cash'),
                notes='Marked as paid',
                processed_by=request.user
            )
            
            bill.paid_amount = bill.total_amount
        
        bill.status = 'paid'
        bill.payment_date = timezone.now().date()
        bill.save()
        
        serializer = self.get_serializer(bill)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        """Cancel bill"""
        bill = self.get_object()
        
        if bill.paid_amount > 0:
            return Response(
                {'error': 'Cannot cancel bill with payments'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        bill.status = 'cancelled'
        bill.save()
        
        serializer = self.get_serializer(bill)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get detailed billing analytics"""
        # Revenue trends
        today = timezone.now().date()
        
        # Weekly revenue
        weekly_revenue = []
        for i in range(7):
            date = today - timedelta(days=i)
            revenue = Payment.objects.filter(date__date=date).aggregate(
                total=Sum('amount')
            )['total'] or 0
            weekly_revenue.append({
                'date': date.strftime('%Y-%m-%d'),
                'day': date.strftime('%A'),
                'revenue': float(revenue)
            })
        
        # Monthly revenue for last 12 months
        monthly_revenue = []
        for i in range(12):
            if i == 0:
                month_start = today.replace(day=1)
            else:
                month_start = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
                for _ in range(i-1):
                    month_start = (month_start - timedelta(days=1)).replace(day=1)
            
            if i == 11:
                month_end = month_start.replace(day=28) + timedelta(days=4)
                month_end = month_end - timedelta(days=month_end.day)
            else:
                next_month = month_start.replace(day=28) + timedelta(days=4)
                month_end = next_month - timedelta(days=next_month.day)
            
            revenue = Payment.objects.filter(
                date__date__range=[month_start, month_end]
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            monthly_revenue.append({
                'month': month_start.strftime('%Y-%m'),
                'month_name': month_start.strftime('%B %Y'),
                'revenue': float(revenue)
            })
        
        # Top paying patients
        top_patients = Bill.objects.values(
            'patient__name', 'patient__id'
        ).annotate(
            total_paid=Sum('paid_amount')
        ).order_by('-total_paid')[:10]
        
        return Response({
            'weekly_revenue': weekly_revenue,
            'monthly_revenue': monthly_revenue,
            'top_patients': list(top_patients)
        })

class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    
    def get_queryset(self):
        queryset = Payment.objects.all()
        
        # Filter by bill
        bill_id = self.request.query_params.get('bill', None)
        if bill_id:
            queryset = queryset.filter(bill_id=bill_id)
        
        # Filter by payment method
        payment_method = self.request.query_params.get('payment_method', None)
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date:
            queryset = queryset.filter(date__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__date__lte=end_date)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's payments"""
        today = timezone.now().date()
        payments = Payment.objects.filter(date__date=today)
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get payment analytics"""
        total_payments = Payment.objects.count()
        total_amount = Payment.objects.aggregate(total=Sum('amount'))['total'] or 0
        
        # Payment method distribution
        method_distribution = Payment.objects.values('payment_method').annotate(
            count=Count('payment_method'),
            total=Sum('amount')
        )
        
        # Today's payments
        today = timezone.now().date()
        today_payments = Payment.objects.filter(date__date=today).count()
        today_amount = Payment.objects.filter(date__date=today).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Average payment amount
        avg_payment = total_amount / total_payments if total_payments > 0 else 0
        
        return Response({
            'total_payments': total_payments,
            'total_amount': float(total_amount),
            'method_distribution': list(method_distribution),
            'today_payments': today_payments,
            'today_amount': float(today_amount),
            'avg_payment': float(avg_payment)
        })