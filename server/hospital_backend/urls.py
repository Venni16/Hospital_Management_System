from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from accounts.views import UserViewSet
from patients.views import PatientViewSet
from wards.views import WardViewSet, BedViewSet
from appointments.views import AppointmentViewSet
from medical_records.views import MedicalRecordViewSet, PrescriptionViewSet, LabTestViewSet
from inventory.views import InventoryItemViewSet, InventoryTransactionViewSet
from billing.views import BillViewSet, PaymentViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'patients', PatientViewSet)
router.register(r'wards', WardViewSet)
router.register(r'beds', BedViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'medical-records', MedicalRecordViewSet)
router.register(r'prescriptions', PrescriptionViewSet)
router.register(r'lab-tests', LabTestViewSet)
router.register(r'inventory', InventoryItemViewSet)
router.register(r'inventory-transactions', InventoryTransactionViewSet)
router.register(r'bills', BillViewSet)
router.register(r'payments', PaymentViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
]