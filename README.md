# Hospital Management System

A comprehensive hospital management system built with React frontend and Django backend.

## 🚀 Quick Start

### Backend Setup (Django)

1. **Create virtual environment**
   ```bash
   cd server
   python -m venv hospital_env
   hospital_env\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run migrations**
   ```bash
   python setup_complete.py
   ```

4. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

5. **Start Django server**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup (React)

1. **Install dependencies**
   ```bash
   cd client
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

## 🔗 Integration

The React frontend is configured to connect to the Django backend at `http://localhost:8000/api/`.

### Demo Credentials

- **Admin**: `admin1` / `admin123`
- **Doctor**: `doctor1` / `doctor123`
- **Nurse**: `nurse1` / `nurse123`
- **Receptionist**: `receptionist1` / `receptionist123`

## 📱 Features

### Role-Based Access Control
- **Admin**: Full system access, user management, analytics
- **Doctor**: Patient records, prescriptions, appointments
- **Nurse**: Patient care, medication, ward management
- **Receptionist**: Patient registration, appointments, billing

### Core Modules
- 👥 **Patient Management**: Registration, records, admission/discharge
- 🏥 **Ward Management**: Bed allocation, occupancy tracking
- 📅 **Appointment System**: Scheduling, management
- 📋 **Medical Records**: Diagnoses, treatments, prescriptions
- 💊 **Inventory**: Stock management, low stock alerts
- 💰 **Billing**: Invoice generation, payment processing

## 🛠 API Endpoints

### Authentication
- `POST /api/users/login/` - User login
- `POST /api/users/logout/` - User logout
- `GET /api/users/me/` - Current user info

### Patients
- `GET /api/patients/` - List patients
- `POST /api/patients/` - Create patient
- `PUT /api/patients/{id}/` - Update patient
- `DELETE /api/patients/{id}/` - Delete patient

### Wards & Beds
- `GET /api/wards/` - List wards
- `POST /api/wards/` - Create ward
- `PATCH /api/beds/{id}/update_status/` - Update bed status

### Appointments
- `GET /api/appointments/` - List appointments
- `POST /api/appointments/` - Create appointment
- `GET /api/appointments/today/` - Today's appointments

### Medical Records
- `GET /api/medical-records/` - List records
- `POST /api/medical-records/` - Create record
- `GET /api/prescriptions/` - List prescriptions

### Inventory
- `GET /api/inventory/` - List items
- `POST /api/inventory/` - Create item
- `GET /api/inventory/low_stock/` - Low stock items

### Billing
- `GET /api/bills/` - List bills
- `POST /api/bills/` - Create bill
- `POST /api/bills/{id}/add_payment/` - Add payment

## 🔧 Configuration

### CORS Configuration
The backend is configured to allow requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative React dev server)

## 📊 Database Schema

### Core Models
- **User**: Custom user model with roles
- **Patient**: Patient information and medical data
- **Ward/Bed**: Hospital infrastructure
- **Appointment**: Scheduling system
- **MedicalRecord**: Patient medical history
- **Prescription**: Medication prescriptions
- **InventoryItem**: Stock management
- **Bill/Payment**: Financial transactions

## 🔒 Security Features

- Token-based authentication
- Role-based permissions
- CORS protection
- Input validation
- SQL injection prevention
- XSS protection

## 🚀 Deployment

### Backend (Django)
1. Set `DEBUG=False` in production
2. Configure proper database (PostgreSQL recommended)
3. Set up static file serving
4. Configure ALLOWED_HOSTS
5. Use environment variables for secrets

### Frontend (React)
1. Build for production: `npm run build`
2. Serve static files
3. Configure API base URL for production

## 📝 License

This project is licensed under the MIT License.