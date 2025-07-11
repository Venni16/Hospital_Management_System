#!/usr/bin/env python3
"""
Complete Hospital Management System Setup Script
This script sets up the Django backend with sample data
"""

import os
import sys
import django
from django.core.management import execute_from_command_line

def setup_django():
    """Setup Django environment"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hospital_backend.settings')
    django.setup()

def create_sample_data():
    """Create sample data for the hospital system"""
    from django.contrib.auth import get_user_model
    from patients.models import Patient
    from wards.models import Ward, Bed
    from appointments.models import Appointment
    from inventory.models import InventoryItem
    from billing.models import Bill
    from datetime import date, timedelta
    
    User = get_user_model()
    
    print("Creating sample users...")
    
    # Create admin user
    admin_user, created = User.objects.get_or_create(
        username='admin1',
        defaults={
            'first_name': 'Admin',
            'last_name': 'Manager',
            'email': 'admin@hospital.com',
            'role': 'admin',
            'department': 'Administration',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print("✓ Admin user created")

    # Create doctor
    doctor1, created = User.objects.get_or_create(
        username='doctor1',
        defaults={
            'first_name': 'Emily',
            'last_name': 'Davis',
            'email': 'emily.davis@hospital.com',
            'role': 'doctor',
            'department': 'Cardiology',
            'specialization': 'Cardiologist',
            'experience': '15 years'
        }
    )
    if created:
        doctor1.set_password('doctor123')
        doctor1.save()
        print("✓ Doctor user created")

    # Create nurse
    nurse1, created = User.objects.get_or_create(
        username='nurse1',
        defaults={
            'first_name': 'Lisa',
            'last_name': 'Wilson',
            'email': 'lisa.wilson@hospital.com',
            'role': 'nurse',
            'department': 'Emergency',
            'specialization': 'Emergency Care',
            'experience': '8 years'
        }
    )
    if created:
        nurse1.set_password('nurse123')
        nurse1.save()
        print("✓ Nurse user created")

    # Create receptionist
    receptionist1, created = User.objects.get_or_create(
        username='receptionist1',
        defaults={
            'first_name': 'Mary',
            'last_name': 'Thompson',
            'email': 'mary.thompson@hospital.com',
            'role': 'receptionist',
            'department': 'Front Desk',
            'experience': '5 years'
        }
    )
    if created:
        receptionist1.set_password('receptionist123')
        receptionist1.save()
        print("✓ Receptionist user created")

    print("Creating sample wards...")
    
    # Create sample wards
    ward1, created = Ward.objects.get_or_create(
        name='General Ward A',
        defaults={
            'department': 'General Medicine',
            'floor': 2,
            'total_beds': 20,
            'nurse_in_charge': 'Lisa Wilson',
            'description': 'General medical care and observation'
        }
    )
    if created:
        print("✓ General Ward A created")
        # Create beds for this ward
        for i in range(1, 21):
            bed_number = f"GA-{str(i).zfill(2)}"
            Bed.objects.get_or_create(
                ward=ward1,
                number=bed_number,
                defaults={'status': 'available'}
            )

    ward2, created = Ward.objects.get_or_create(
        name='ICU',
        defaults={
            'department': 'Intensive Care',
            'floor': 3,
            'total_beds': 10,
            'nurse_in_charge': 'Lisa Wilson',
            'description': 'Intensive care unit for critical patients'
        }
    )
    if created:
        print("✓ ICU created")
        # Create beds for this ward
        for i in range(1, 11):
            bed_number = f"ICU-{str(i).zfill(2)}"
            Bed.objects.get_or_create(
                ward=ward2,
                number=bed_number,
                defaults={'status': 'available'}
            )

    print("Creating sample patients...")
    
    # Create sample patients
    patient1, created = Patient.objects.get_or_create(
        name='John Smith',
        defaults={
            'age': 45,
            'gender': 'Male',
            'phone': '555-0101',
            'email': 'john.smith@email.com',
            'address': '123 Main St, City, State',
            'emergency_contact': 'Jane Smith - 555-0102',
            'blood_type': 'O+',
            'allergies': 'Penicillin',
            'assigned_doctor': doctor1,
            'status': 'outpatient'
        }
    )
    if created:
        print("✓ Patient John Smith created")

    patient2, created = Patient.objects.get_or_create(
        name='Sarah Johnson',
        defaults={
            'age': 32,
            'gender': 'Female',
            'phone': '555-0102',
            'email': 'sarah.johnson@email.com',
            'address': '456 Oak Ave, City, State',
            'emergency_contact': 'Mike Johnson - 555-0103',
            'blood_type': 'A+',
            'allergies': 'None',
            'assigned_doctor': doctor1,
            'status': 'admitted',
            'ward': ward1,
            'bed_number': 'GA-01',
            'admission_date': date.today()
        }
    )
    if created:
        print("✓ Patient Sarah Johnson created")
        # Update bed status
        bed = Bed.objects.filter(ward=ward1, number='GA-01').first()
        if bed:
            bed.status = 'occupied'
            bed.patient = patient2
            bed.admission_date = date.today()
            bed.save()

    print("Creating sample appointments...")
    
    # Create sample appointment
    appointment1, created = Appointment.objects.get_or_create(
        patient=patient1,
        doctor=doctor1,
        date=date.today(),
        time='10:00',
        defaults={
            'type': 'consultation',
            'status': 'scheduled',
            'notes': 'Regular checkup',
            'created_by': receptionist1
        }
    )
    if created:
        print("✓ Sample appointment created")

    print("Creating sample inventory...")
    
    # Create sample inventory items
    inventory1, created = InventoryItem.objects.get_or_create(
        name='Paracetamol 500mg',
        defaults={
            'category': 'medication',
            'quantity': 100,
            'unit': 'Tablets',
            'min_stock': 20,
            'supplier': 'PharmaCorp',
            'expiry_date': date.today() + timedelta(days=365),
            'cost_per_unit': 0.50,
            'location': 'Pharmacy A-1'
        }
    )
    if created:
        print("✓ Sample inventory item created")

    inventory2, created = InventoryItem.objects.get_or_create(
        name='Surgical Gloves',
        defaults={
            'category': 'medical_supplies',
            'quantity': 5,  # Low stock to trigger alert
            'unit': 'Boxes',
            'min_stock': 10,
            'supplier': 'MedSupply Co',
            'expiry_date': date.today() + timedelta(days=180),
            'cost_per_unit': 15.00,
            'location': 'Storage B-2'
        }
    )
    if created:
        print("✓ Low stock inventory item created")

    print("Creating sample bill...")
    
    # Create sample bill
    bill1, created = Bill.objects.get_or_create(
        patient=patient1,
        defaults={
            'services': [
                {'name': 'Consultation', 'amount': 100.00},
                {'name': 'Blood Test', 'amount': 50.00}
            ],
            'total_amount': 150.00,
            'paid_amount': 0.00,
            'status': 'pending',
            'created_by': receptionist1
        }
    )
    if created:
        print("✓ Sample bill created")

    print("\n🎉 Sample data created successfully!")
    print("\n📋 Demo Credentials:")
    print("Admin: admin1 / admin123")
    print("Doctor: doctor1 / doctor123")
    print("Nurse: nurse1 / nurse123")
    print("Receptionist: receptionist1 / receptionist123")

def main():
    """Main setup function"""
    print("🏥 Hospital Management System Setup")
    print("=" * 50)
    
    # Setup Django
    setup_django()
    
    # Run migrations
    print("Running database migrations...")
    execute_from_command_line(['manage.py', 'makemigrations'])
    execute_from_command_line(['manage.py', 'migrate'])
    print("✓ Database migrations completed")
    
    # Create sample data
    create_sample_data()
    
    print("\n🚀 Setup completed successfully!")
    print("\nTo start the server, run:")
    print("python manage.py runserver")
    print("\nThen open your React app at http://localhost:5173")

if __name__ == '__main__':
    main()