from django.db import models

class InventoryItem(models.Model):
    CATEGORY_CHOICES = [
        ('medication', 'Medication'),
        ('medical_supplies', 'Medical Supplies'),
        ('equipment', 'Equipment'),
        ('consumables', 'Consumables'),
    ]
    
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    quantity = models.IntegerField()
    unit = models.CharField(max_length=20)
    min_stock = models.IntegerField()
    supplier = models.CharField(max_length=100)
    expiry_date = models.DateField()
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    location = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def is_low_stock(self):
        return self.quantity <= self.min_stock
    
    @property
    def total_value(self):
        return self.quantity * self.cost_per_unit
    
    def __str__(self):
        return f"{self.name} - {self.quantity} {self.unit}"
    
    class Meta:
        db_table = 'inventory_items'
        ordering = ['name']

class InventoryTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('in', 'Stock In'),
        ('out', 'Stock Out'),
        ('adjustment', 'Adjustment'),
    ]
    
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.IntegerField()
    reason = models.CharField(max_length=200)
    performed_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    date = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.item.name} - {self.transaction_type} - {self.quantity}"
    
    class Meta:
        db_table = 'inventory_transactions'
        ordering = ['-date']