from django.db import models

class Ward(models.Model):
    name = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    floor = models.IntegerField()
    total_beds = models.IntegerField()
    nurse_in_charge = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default='active')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def occupied_beds(self):
        return self.beds.filter(status='occupied').count()
    
    @property
    def available_beds(self):
        return self.beds.filter(status='available').count()
    
    @property
    def occupancy_percentage(self):
        if self.total_beds == 0:
            return 0
        return round((self.occupied_beds / self.total_beds) * 100, 1)
    
    def __str__(self):
        return f"{self.name} - {self.department}"
    
    class Meta:
        db_table = 'wards'
        ordering = ['name']

class Bed(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('maintenance', 'Maintenance'),
        ('cleaning', 'Cleaning'),
    ]
    
    ward = models.ForeignKey(Ward, related_name='beds', on_delete=models.CASCADE)
    number = models.CharField(max_length=10)
    patient = models.ForeignKey('patients.Patient', on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    admission_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def patient_name(self):
        return self.patient.name if self.patient else None
    
    class Meta:
        unique_together = ['ward', 'number']
        db_table = 'beds'
        ordering = ['ward', 'number']
    
    def __str__(self):
        return f"{self.ward.name} - {self.number}"