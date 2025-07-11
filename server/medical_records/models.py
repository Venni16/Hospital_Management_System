from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class MedicalRecord(models.Model):
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='medical_records')
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='medical_records')
    date = models.DateField(auto_now_add=True)
    symptoms = models.TextField()
    diagnosis = models.CharField(max_length=200)
    treatment = models.TextField()
    medications = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True)
    follow_up = models.DateField(null=True, blank=True)
    vital_signs = models.JSONField(default=dict, blank=True)  # Blood pressure, temperature, etc.
    allergies_noted = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.patient.name} - {self.date} - {self.diagnosis}"
    
    class Meta:
        db_table = 'medical_records'
        ordering = ['-date']

class Prescription(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE)
    doctor = models.ForeignKey(User, on_delete=models.CASCADE)
    medical_record = models.ForeignKey(MedicalRecord, on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateField(auto_now_add=True)
    medications = models.JSONField(default=list)
    instructions = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    duration = models.CharField(max_length=50, blank=True)  # e.g., "7 days", "2 weeks"
    refills_allowed = models.IntegerField(default=0)
    refills_used = models.IntegerField(default=0)
    pharmacy_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Prescription for {self.patient.name} - {self.date}"
    
    class Meta:
        db_table = 'prescriptions'
        ordering = ['-date']

class LabTest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('routine', 'Routine'),
        ('urgent', 'Urgent'),
        ('stat', 'STAT'),
    ]
    
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE)
    ordered_by = models.ForeignKey(User, on_delete=models.CASCADE)
    test_type = models.CharField(max_length=100)
    test_code = models.CharField(max_length=20, blank=True)  # Lab test code
    ordered_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='routine')
    results = models.TextField(blank=True)
    reference_values = models.TextField(blank=True)  # Normal ranges
    completed_date = models.DateField(null=True, blank=True)
    technician = models.CharField(max_length=100, blank=True)  # Lab technician name
    notes = models.TextField(blank=True)
    sample_type = models.CharField(max_length=50, blank=True)  # Blood, Urine, etc.
    fasting_required = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.test_type} for {self.patient.name}"
    
    class Meta:
        db_table = 'lab_tests'
        ordering = ['-ordered_date']