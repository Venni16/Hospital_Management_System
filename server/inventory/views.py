from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, F, Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta
from .models import InventoryItem, InventoryTransaction
from .serializers import InventoryItemSerializer, InventoryTransactionSerializer

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    
    def get_queryset(self):
        queryset = InventoryItem.objects.all()
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(category__icontains=search) |
                Q(supplier__icontains=search) |
                Q(location__icontains=search)
            )
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by supplier
        supplier = self.request.query_params.get('supplier', None)
        if supplier:
            queryset = queryset.filter(supplier__icontains=supplier)
        
        # Filter by location
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        # Filter by stock status
        stock_status = self.request.query_params.get('stock_status', None)
        if stock_status == 'low':
            queryset = queryset.filter(quantity__lte=F('min_stock'))
        elif stock_status == 'out':
            queryset = queryset.filter(quantity=0)
        elif stock_status == 'normal':
            queryset = queryset.filter(quantity__gt=F('min_stock'))
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get items with low stock"""
        items = InventoryItem.objects.filter(quantity__lte=F('min_stock'))
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def out_of_stock(self, request):
        """Get items that are out of stock"""
        items = InventoryItem.objects.filter(quantity=0)
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get items expiring within specified days (default 30)"""
        days = int(self.request.query_params.get('days', 30))
        expiry_date = timezone.now().date() + timedelta(days=days)
        items = InventoryItem.objects.filter(expiry_date__lte=expiry_date)
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def expired(self, request):
        """Get expired items"""
        today = timezone.now().date()
        items = InventoryItem.objects.filter(expiry_date__lt=today)
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get inventory analytics"""
        total_items = InventoryItem.objects.count()
        total_value = InventoryItem.objects.aggregate(
            total=Sum(F('quantity') * F('cost_per_unit'))
        )['total'] or 0
        
        low_stock_items = InventoryItem.objects.filter(quantity__lte=F('min_stock')).count()
        out_of_stock_items = InventoryItem.objects.filter(quantity=0).count()
        
        # Expiring items (next 30 days)
        thirty_days = timezone.now().date() + timedelta(days=30)
        expiring_items = InventoryItem.objects.filter(expiry_date__lte=thirty_days).count()
        
        # Category distribution
        category_distribution = InventoryItem.objects.values('category').annotate(
            count=Count('category'),
            total_value=Sum(F('quantity') * F('cost_per_unit'))
        )
        
        # Top suppliers by item count
        top_suppliers = InventoryItem.objects.values('supplier').annotate(
            count=Count('supplier'),
            total_value=Sum(F('quantity') * F('cost_per_unit'))
        ).order_by('-count')[:10]
        
        # Recent transactions (last 30 days)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent_transactions = InventoryTransaction.objects.filter(
            date__gte=thirty_days_ago
        ).count()
        
        return Response({
            'total_items': total_items,
            'total_value': float(total_value),
            'low_stock_items': low_stock_items,
            'out_of_stock_items': out_of_stock_items,
            'expiring_items': expiring_items,
            'category_distribution': list(category_distribution),
            'top_suppliers': list(top_suppliers),
            'recent_transactions': recent_transactions
        })
    
    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        """Adjust item stock"""
        item = self.get_object()
        quantity_change = request.data.get('quantity_change', 0)
        reason = request.data.get('reason', 'Manual adjustment')
        
        try:
            quantity_change = int(quantity_change)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid quantity change'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        new_quantity = item.quantity + quantity_change
        if new_quantity < 0:
            return Response(
                {'error': 'Insufficient stock'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create transaction record
        transaction_type = 'in' if quantity_change > 0 else 'out'
        InventoryTransaction.objects.create(
            item=item,
            transaction_type=transaction_type,
            quantity=abs(quantity_change),
            reason=reason,
            performed_by=request.user
        )
        
        item.quantity = new_quantity
        item.save()
        
        serializer = self.get_serializer(item)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def restock(self, request, pk=None):
        """Restock item"""
        item = self.get_object()
        quantity = request.data.get('quantity', 0)
        supplier = request.data.get('supplier', item.supplier)
        cost_per_unit = request.data.get('cost_per_unit', item.cost_per_unit)
        expiry_date = request.data.get('expiry_date', item.expiry_date)
        
        try:
            quantity = int(quantity)
            cost_per_unit = float(cost_per_unit)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid quantity or cost'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if quantity <= 0:
            return Response(
                {'error': 'Quantity must be greater than 0'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create transaction record
        InventoryTransaction.objects.create(
            item=item,
            transaction_type='in',
            quantity=quantity,
            reason=f'Restocked from {supplier}',
            performed_by=request.user
        )
        
        # Update item
        item.quantity += quantity
        item.supplier = supplier
        item.cost_per_unit = cost_per_unit
        if expiry_date:
            item.expiry_date = expiry_date
        item.save()
        
        serializer = self.get_serializer(item)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all categories with counts"""
        categories = InventoryItem.objects.values('category').annotate(
            count=Count('category'),
            total_quantity=Sum('quantity'),
            total_value=Sum(F('quantity') * F('cost_per_unit'))
        ).order_by('category')
        
        return Response(list(categories))
    
    @action(detail=False, methods=['get'])
    def suppliers(self, request):
        """Get all suppliers with counts"""
        suppliers = InventoryItem.objects.values('supplier').annotate(
            count=Count('supplier'),
            total_quantity=Sum('quantity'),
            total_value=Sum(F('quantity') * F('cost_per_unit'))
        ).order_by('supplier')
        
        return Response(list(suppliers))
    
    @action(detail=False, methods=['get'])
    def locations(self, request):
        """Get all locations with counts"""
        locations = InventoryItem.objects.values('location').annotate(
            count=Count('location'),
            total_quantity=Sum('quantity')
        ).order_by('location')
        
        return Response(list(locations))

class InventoryTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryTransaction.objects.all()
    serializer_class = InventoryTransactionSerializer
    
    def get_queryset(self):
        queryset = InventoryTransaction.objects.all()
        
        # Filter by item
        item_id = self.request.query_params.get('item', None)
        if item_id:
            queryset = queryset.filter(item_id=item_id)
        
        # Filter by transaction type
        transaction_type = self.request.query_params.get('type', None)
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Filter by user
        user_id = self.request.query_params.get('user', None)
        if user_id:
            queryset = queryset.filter(performed_by_id=user_id)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent transactions"""
        days = int(self.request.query_params.get('days', 7))
        start_date = timezone.now().date() - timedelta(days=days)
        transactions = self.get_queryset().filter(date__gte=start_date)
        serializer = self.get_serializer(transactions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get transaction analytics"""
        total_transactions = InventoryTransaction.objects.count()
        
        # Transaction type distribution
        type_distribution = InventoryTransaction.objects.values('transaction_type').annotate(
            count=Count('transaction_type'),
            total_quantity=Sum('quantity')
        )
        
        # Recent activity (last 30 days)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent_transactions = InventoryTransaction.objects.filter(
            date__gte=thirty_days_ago
        ).count()
        
        # Most active users
        active_users = InventoryTransaction.objects.values(
            'performed_by__first_name', 'performed_by__last_name'
        ).annotate(
            count=Count('performed_by')
        ).order_by('-count')[:10]
        
        # Daily transaction counts for last 30 days
        daily_transactions = []
        for i in range(30):
            date = timezone.now().date() - timedelta(days=i)
            count = InventoryTransaction.objects.filter(date=date).count()
            daily_transactions.append({
                'date': date.strftime('%Y-%m-%d'),
                'count': count
            })
        
        return Response({
            'total_transactions': total_transactions,
            'type_distribution': list(type_distribution),
            'recent_transactions': recent_transactions,
            'active_users': list(active_users),
            'daily_transactions': daily_transactions
        })