from django.db import models

# Create your models here.
from django.db import models
from django.utils import timezone
from patients.models import Patient

class Visitor(models.Model):
    STATUS_CHOICES = [
        ('visiting', 'Visiting'),
        ('waiting', 'Waiting'),
        ('checked-out', 'Checked Out'),
    ]

    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    relationship = models.CharField(max_length=100)
    purpose = models.TextField(blank=True)
    idType = models.CharField(max_length=50, blank=True)
    idNumber = models.CharField(max_length=100, blank=True)
    checkInTime = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='visiting')

    def __str__(self):
        return f"{self.name} visiting {self.patient.name} - {self.status}"
