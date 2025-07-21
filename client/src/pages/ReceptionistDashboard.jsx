import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { useApp } from '../context/AppContext';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { 
  Users, Calendar, DollarSign, UserPlus, Plus, Edit3, Eye,
  Clock, CheckCircle, AlertCircle, CreditCard, Activity, User,
  Stethoscope, Phone, Mail, MapPin, FileText, Printer, Download,
  UserCheck, UserX, Search, Filter, RefreshCw, Bell, Settings,
  ClipboardList, Building, Bed, Heart, Shield, AlertTriangle,
  TrendingUp, BarChart3, PieChart, Calendar as CalendarIcon,
  Receipt, Banknote, CreditCard as CardIcon, Wallet, DollarSign as MoneyIcon
} from 'lucide-react';

export default function ReceptionistDashboard() {
  const { 
    patients, appointments, bills, staff, currentUser, loading, error, clearError,
    fetchPatients, fetchAppointments, fetchBills, fetchStaff,
    addPatient, updatePatient, addAppointment, addBill, addPayment
  } = useApp();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');

  // Mock data for additional receptionist features
  const [visitors, setVisitors] = useState([
    { id: 1, name: 'Robert Wilson', patientName: 'John Smith', relationship: 'Brother', checkInTime: '10:30', status: 'visiting', phone: '555-0123' },
    { id: 2, name: 'Emma Davis', patientName: 'Sarah Johnson', relationship: 'Daughter', checkInTime: '14:15', status: 'waiting', phone: '555-0124' },
    { id: 3, name: 'Michael Brown', patientName: 'John Smith', relationship: 'Friend', checkInTime: '16:00', status: 'checked-out', phone: '555-0125' }
  ]);

  const [insuranceClaims, setInsuranceClaims] = useState([
    { id: 1, patientName: 'John Smith', claimNumber: 'CLM-2024-001', amount: 1500, status: 'pending', submittedDate: '2024-01-15', insuranceProvider: 'Blue Cross' },
    { id: 2, patientName: 'Sarah Johnson', claimNumber: 'CLM-2024-002', amount: 2300, status: 'approved', submittedDate: '2024-01-14', insuranceProvider: 'Aetna' },
    { id: 3, patientName: 'Michael Brown', claimNumber: 'CLM-2024-003', amount: 850, status: 'rejected', submittedDate: '2024-01-13', insuranceProvider: 'Cigna' }
  ]);

  const [phoneLog, setPhoneLog] = useState([
    { id: 1, callerName: 'Jennifer Adams', phone: '555-0201', purpose: 'Appointment Inquiry', time: '09:15', status: 'completed', notes: 'Scheduled for next week' },
    { id: 2, callerName: 'David Miller', phone: '555-0202', purpose: 'Test Results', time: '10:30', status: 'transferred', notes: 'Transferred to Dr. Davis' },
    { id: 3, callerName: 'Lisa Garcia', phone: '555-0203', purpose: 'Billing Question', time: '11:45', status: 'pending', notes: 'Callback requested' }
  ]);

  // Fetch data on component mount
  useEffect(() => {
    if (currentUser?.role === 'receptionist') {
      fetchPatients();
      fetchAppointments();
      fetchBills();
      fetchStaff();
    }
  }, [currentUser]);

  // Filter data
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.phone?.includes(searchTerm) ||
                         patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredAppointments = appointments.filter(apt => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    if (dateFilter === 'today') return apt.date === today;
    if (dateFilter === 'tomorrow') return apt.date === tomorrow;
    if (dateFilter === 'week') {
      const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      return apt.date >= today && apt.date <= weekFromNow;
    }
    return true;
  });

  const todayAppointments = appointments.filter(apt => apt.date === new Date().toISOString().split('T')[0]);
  const pendingBills = bills.filter(bill => bill.status === 'pending' || bill.status === 'partial');
  // Helper function to safely sum monetary values
const safeSum = (items, field) => {
  return items.reduce((total, item) => {
    const value = parseFloat(item[field]);
    return total + (isNaN(value) ? 0 : value);
  }, 0);
};

// Calculate revenues
const totalRevenue = safeSum(bills, 'paid_amount');
const todayRevenue = safeSum(
  bills.filter(bill => bill.date === new Date().toISOString().split('T')[0]),
  'paid_amount'
);
  // Get available doctors for assignment
  const availableDoctors = staff.filter(member => member.role === 'doctor' && member.status === 'active');

  // Check-in data with more comprehensive tracking
  const checkIns = [
    { id: 1, patientId: 1, patientName: 'John Smith', time: '09:00', status: 'checked-in', appointmentId: 1, doctor: 'Dr. Emily Davis', type: 'consultation' },
    { id: 2, patientId: 2, patientName: 'Sarah Johnson', time: '10:30', status: 'waiting', appointmentId: 2, doctor: 'Dr. Emily Davis', type: 'follow-up' },
    { id: 3, patientId: 3, patientName: 'Michael Brown', time: '14:00', status: 'pending', appointmentId: null, doctor: 'Walk-in', type: 'emergency' },
    { id: 4, patientId: 4, patientName: 'Lisa Wilson', time: '15:30', status: 'completed', appointmentId: 3, doctor: 'Dr. Emily Davis', type: 'routine' }
  ];

  const handleAddPatient = async (patientData) => {
    try {
      await addPatient(patientData);
      setShowPatientModal(false);
      setEditingPatient(null);
    } catch (error) {
      console.error('Error adding patient:', error);
    }
  };

  const handleUpdatePatient = async (patientData) => {
    try {
      await updatePatient(editingPatient.id, patientData);
      setEditingPatient(null);
      setShowPatientModal(false);
    } catch (error) {
      console.error('Error updating patient:', error);
    }
  };

  const handleAddAppointment = async (appointmentData) => {
    try {
      await addAppointment(appointmentData);
      setShowAppointmentModal(false);
    } catch (error) {
      console.error('Error adding appointment:', error);
    }
  };

  const handleAddBill = async (billData) => {
    try {
      const totalAmount = billData.services.reduce((sum, service) => sum + parseFloat(service.amount), 0);
      const newBillData = {
        ...billData,
        services: billData.services,
        total_amount: totalAmount
      };
      await addBill(newBillData);
      setShowBillModal(false);
    } catch (error) {
      console.error('Error adding bill:', error);
    }
  };

  const handlePayment = async (paymentData) => {
    try {
      await addPayment(selectedBill.id, paymentData);
      setShowPaymentModal(false);
      setSelectedBill(null);
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };
        // Generate reports

const generateDailyReport = () => {
  const doc = new jsPDF();
  
  // Report title
  doc.setFontSize(18);
  doc.text('Daily Activity Report', 105, 15, { align: 'center' });
  
  // Date information
  doc.setFontSize(12);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 25);
  
  // Add a line separator
  doc.line(10, 30, 200, 30);
  
  // Today's appointments
  doc.setFontSize(14);
  doc.text('Today\'s Appointments', 14, 40);
  doc.setFontSize(10);
  
  let yPosition = 50;
  todayAppointments.forEach((appointment, index) => {
    doc.text(
      `${index + 1}. ${appointment.patient_name} - ${appointment.time} with ${appointment.doctor_name} (${appointment.status})`,
      14,
      yPosition
    );
    yPosition += 7;
  });
  
  // Today's check-ins
  doc.setFontSize(14);
  doc.text('Patient Check-ins', 14, yPosition + 10);
  doc.setFontSize(10);
  yPosition += 20;
  
  checkIns.forEach((checkIn, index) => {
    doc.text(
      `${index + 1}. ${checkIn.patientName} - ${checkIn.time} (${checkIn.status})`,
      14,
      yPosition
    );
    yPosition += 7;
  });
  
  // Today's revenue
  doc.setFontSize(14);
  doc.text('Financial Summary', 14, yPosition + 10);
  doc.setFontSize(10);
  yPosition += 20;
  
  doc.text(`Total Revenue Today: $${todayRevenue.toFixed(2)}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Pending Bills: ${pendingBills.length}`, 14, yPosition);
  
  // Footer
  doc.setFontSize(8);
  doc.text(`Generated by ${currentUser?.first_name} ${currentUser?.last_name} on ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
  
  doc.save(`daily-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

const generateRevenueReport = () => {
  const doc = new jsPDF();
  
  // Report title
  doc.setFontSize(18);
  doc.text('Revenue Report', 105, 15, { align: 'center' });
  
  // Date range
  doc.setFontSize(12);
  doc.text(`Period: ${new Date().toLocaleDateString()}`, 14, 25);
  
  // Add a line separator
  doc.line(10, 30, 200, 30);
  
  // Summary statistics
  doc.setFontSize(14);
  doc.text('Financial Summary', 14, 40);
  doc.setFontSize(10);
  
  let yPosition = 50;
  doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Today's Revenue: $${todayRevenue.toFixed(2)}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Pending Bills Amount: $${pendingBills.reduce((sum, bill) => sum + (bill.total_amount - bill.paid_amount), 0).toFixed(2)}`, 14, yPosition);
  yPosition += 15;
  
  // Pending bills details
  doc.setFontSize(14);
  doc.text('Pending Bills', 14, yPosition);
  doc.setFontSize(10);
  yPosition += 10;
  
  pendingBills.forEach((bill, index) => {
    doc.text(
      `${index + 1}. ${bill.patient_name} - $${(bill.total_amount - bill.paid_amount).toFixed(2)} remaining (Due: ${bill.due_date || 'N/A'})`,
      14,
      yPosition
    );
    yPosition += 7;
    if (yPosition > 280) {
      doc.addPage();
      yPosition = 20;
    }
  });
  
  // Footer
  doc.setFontSize(8);
  doc.text(`Generated by ${currentUser?.first_name} ${currentUser?.last_name} on ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
  
  doc.save(`revenue-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

const generateAppointmentReport = () => {
  const doc = new jsPDF();
  
  // Report title
  doc.setFontSize(18);
  doc.text('Appointment Report', 105, 15, { align: 'center' });
  
  // Date range
  doc.setFontSize(12);
  doc.text(`Period: Last 30 Days`, 14, 25);
  
  // Add a line separator
  doc.line(10, 30, 200, 30);
  
  // Summary statistics
  doc.setFontSize(14);
  doc.text('Appointment Statistics', 14, 40);
  doc.setFontSize(10);
  
  let yPosition = 50;
  doc.text(`Total Appointments: ${appointments.length}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Completed: ${appointments.filter(a => a.status === 'completed').length}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Scheduled: ${appointments.filter(a => a.status === 'scheduled').length}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Cancelled: ${appointments.filter(a => a.status === 'cancelled').length}`, 14, yPosition);
  yPosition += 15;
  
  // Recent appointments
  doc.setFontSize(14);
  doc.text('Recent Appointments', 14, yPosition);
  doc.setFontSize(10);
  yPosition += 10;
  
  const recentAppointments = [...appointments]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20);
  
  recentAppointments.forEach((appt, index) => {
    doc.text(
      `${index + 1}. ${appt.patient_name} - ${appt.date} at ${appt.time} with ${appt.doctor_name} (${appt.status})`,
      14,
      yPosition
    );
    yPosition += 7;
    if (yPosition > 280) {
      doc.addPage();
      yPosition = 20;
    }
  });
  
  // Footer
  doc.setFontSize(8);
  doc.text(`Generated by ${currentUser?.first_name} ${currentUser?.last_name} on ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
  
  doc.save(`appointment-report-${new Date().toISOString().split('T')[0]}.pdf`);
};



  // Receipt Generation Function

  const handleDownloadReceipt = async (bill) => {
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Add clinic header
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 140);
      doc.text('HEALTH CARE HOSPITAL', 105, 20, { align: 'center' });
      
      // Add clinic information
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('123 CHINATOWN, Cityville', 105, 28, { align: 'center' });
      doc.text('Phone: (555) 123-4567', 105, 35, { align: 'center' });
  
      // Add divider line
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 42, 195, 42);
  
      // Add receipt title
      doc.setFontSize(16);
      doc.text('PAYMENT RECEIPT', 105, 52, { align: 'center' });
  
      // Receipt details
      let yPosition = 65;
      doc.setFontSize(10);
      
      // Bill information
      doc.text(`Receipt #: ${bill.id || 'N/A'}`, 20, yPosition);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 160, yPosition);
      yPosition += 10;
  
      doc.text(`Patient: ${bill.patient_name || 'N/A'}`, 20, yPosition);
      yPosition += 10;
  
      // Payment summary
      doc.setFontSize(12);
      doc.text('Payment Summary', 20, yPosition);
      yPosition += 10;
      doc.setFontSize(10);
  
      const total = Number(bill.total_amount) || 0;
      const paid = Number(bill.paid_amount) || 0;
      const balance = total - paid;
  
      doc.text(`Total Amount: $${total.toFixed(2)}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Amount Paid: $${paid.toFixed(2)}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Balance Due: $${balance.toFixed(2)}`, 20, yPosition);
      yPosition += 15;

      // Thank you message
    doc.setFontSize(11);
    doc.setTextColor(0, 100, 0);
    doc.text('Thank you for your payment!', 105, yPosition, { align: 'center' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('This is an official receipt from Healthcare Clinic', 105, 285, { align: 'center' });
  
      // Create and download the PDF
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `Receipt_${bill.id || 'unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(pdfUrl);
      }, 100);
  
    } catch (error) {
      return false;
    }
  };





    // Handle patient check-in
  const handleCheckIn = (checkInId) => {
    console.log('Checking in patient:', checkInId);
  };

  const handleVisitorRegistration = (visitorData) => {
    const newVisitor = {
      id: visitors.length + 1,
      ...visitorData,
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'visiting'
    };
    setVisitors([...visitors, newVisitor]);
    setShowVisitorModal(false);
  };

  const handleInsuranceClaim = (claimData) => {
    const newClaim = {
      id: insuranceClaims.length + 1,
      ...claimData,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    setInsuranceClaims([...insuranceClaims, newClaim]);
    setShowInsuranceModal(false);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'patients', name: 'Patients', icon: Users },
    { id: 'appointments', name: 'Appointments', icon: Calendar },
    { id: 'checkin', name: 'Check-in', icon: CheckCircle },
    { id: 'billing', name: 'Billing', icon: DollarSign },
    { id: 'visitors', name: 'Visitors', icon: UserCheck },
    { id: 'insurance', name: 'Insurance', icon: Shield },
    { id: 'reports', name: 'Reports', icon: BarChart3 }
  ];

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={clearError} />;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Receptionist Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Welcome back, {currentUser?.first_name} {currentUser?.last_name} - Front Desk Operations
          </p>
        </div>
       {/*<div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-2">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <Bell className="h-4 w-4 mr-2" />
            Alerts
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>*/}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow-soft rounded-lg card-hover">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Patients</dt>
                      <dd className="text-lg font-medium text-gray-900">{patients.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-soft rounded-lg card-hover">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Today's Appointments</dt>
                      <dd className="text-lg font-medium text-gray-900">{todayAppointments.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-soft rounded-lg card-hover">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Today's Revenue</dt>
                      <dd className="text-lg font-medium text-gray-900">${todayRevenue.toLocaleString()}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-soft rounded-lg card-hover">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Bills</dt>
                      <dd className="text-lg font-medium text-gray-900">{pendingBills.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow-soft rounded-lg p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setShowPatientModal(true)}
                className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
              >
                <UserPlus className="h-8 w-8 text-yellow-500 mb-2" />
                <span className="text-sm font-medium text-gray-700">Register Patient</span>
              </button>
              
              <button
                onClick={() => setShowAppointmentModal(true)}
                className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
              >
                <Calendar className="h-8 w-8 text-green-500 mb-2" />
                <span className="text-sm font-medium text-gray-700">Schedule Appointment</span>
              </button>
              
              <button
                onClick={() => setShowBillModal(true)}
                className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <Receipt className="h-8 w-8 text-blue-500 mb-2" />
                <span className="text-sm font-medium text-gray-700">Create Bill</span>
              </button>
              
              <button
                onClick={() => setShowVisitorModal(true)}
                className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
              >
                <UserCheck className="h-8 w-8 text-purple-500 mb-2" />
                <span className="text-sm font-medium text-gray-700">Register Visitor</span>
              </button>
            </div>
          </div>

          {/* Today's Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow-soft rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Today's Schedule</h3>
                {todayAppointments.length === 0 ? (
                  <p className="text-gray-500">No appointments scheduled for today.</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {todayAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-md">
                        <div className="flex items-center space-x-3">
                          <Clock className="h-5 w-5 text-yellow-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{appointment.time}</p>
                            <p className="text-sm text-gray-500">{appointment.patient_name}</p>
                            <p className="text-xs text-gray-400">{appointment.doctor_name}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          appointment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : 
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white shadow-soft rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Pending Payments</h3>
                {pendingBills.length === 0 ? (
                  <p className="text-gray-500">No pending payments.</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {pendingBills.slice(0, 5).map((bill) => (
                      <div key={bill.id} className="flex items-center justify-between p-3 bg-red-50 rounded-md">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{bill.patient_name}</p>
                          <p className="text-sm text-gray-500">
                            ${(bill.total_amount - bill.paid_amount).toFixed(2)} remaining
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedBill(bill);
                            setShowPaymentModal(true);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Collect
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patients Tab */}
      {activeTab === 'patients' && (
        <div className="space-y-6 animate-fade-in">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto flex space-x-4">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search patients by name, phone, or email..."
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-input"
              >
                <option value="all">All Status</option>
                <option value="outpatient">Outpatient</option>
                <option value="admitted">Admitted</option>
                <option value="discharged">Discharged</option>
              </select>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => {
                  setEditingPatient(null);
                  setShowPatientModal(true);
                }}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Register Patient
              </button>
            </div>
          </div>

          <div className="bg-white shadow-soft overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <li key={patient.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-yellow-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                        <div className="text-sm text-gray-500">
                          {patient.age} years • {patient.gender} • {patient.phone}
                        </div>
                        <div className="text-sm text-gray-500">{patient.email}</div>
                        {patient.assigned_doctor_name && (
                          <div className="text-xs text-blue-600 font-medium">
                            Assigned to: {patient.assigned_doctor_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        patient.status === 'admitted' ? 'bg-green-100 text-green-800' :
                        patient.status === 'outpatient' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {patient.status}
                      </span>
                      <button
                        onClick={() => {
                          setEditingPatient(patient);
                          setShowPatientModal(true);
                        }}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowBillModal(true);
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Receipt className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="space-y-6 animate-fade-in">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto flex space-x-4">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="form-input"
              >
                <option value="all">All Appointments</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="week">This Week</option>
              </select>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => setShowAppointmentModal(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule Appointment
              </button>
            </div>
          </div>

          <div className="bg-white shadow-soft overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => (
                <li key={appointment.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Calendar className="h-6 w-6 text-yellow-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{appointment.patient_name}</div>
                        <div className="text-sm text-gray-500">
                          {appointment.date} at {appointment.time}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.doctor_name} • {appointment.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        appointment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {appointment.status}
                      </span>
                      <button className="text-blue-600 hover:text-blue-800">
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Check-in Tab */}
      {activeTab === 'checkin' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white shadow-soft rounded-lg">
            <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Patient Check-in Management</h3>
              <p className="mt-1 text-sm text-gray-500">Manage patient arrivals and check-ins</p>
            </div>
            <ul className="divide-y divide-gray-200">
              {checkIns.map((checkIn) => (
                <li key={checkIn.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          checkIn.status === 'checked-in' ? 'bg-green-100' :
                          checkIn.status === 'waiting' ? 'bg-yellow-100' : 
                          checkIn.status === 'completed' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {checkIn.status === 'checked-in' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : checkIn.status === 'waiting' ? (
                            <Clock className="h-5 w-5 text-yellow-600" />
                          ) : checkIn.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          ) : (
                            <User className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{checkIn.patientName}</div>
                        <div className="text-sm text-gray-500">
                          Expected at {checkIn.time} • {checkIn.doctor} • {checkIn.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        checkIn.status === 'checked-in' ? 'bg-green-100 text-green-800' :
                        checkIn.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                        checkIn.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {checkIn.status === 'checked-in' ? 'Checked In' :
                         checkIn.status === 'waiting' ? 'Waiting' : 
                         checkIn.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                      {checkIn.status === 'pending' && (
                        <button
                          className="btn-success text-xs"
                          onClick={() => handleCheckIn(checkIn.id)}
                        >
                          Check In
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-soft">
              <div className="flex items-center">
                <MoneyIcon className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-lg font-semibold text-gray-900">${totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-soft">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Pending Bills</p>
                  <p className="text-lg font-semibold text-gray-900">{pendingBills.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-soft">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Today's Revenue</p>
                  <p className="text-lg font-semibold text-gray-900">${todayRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Billing Management</h3>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => setShowBillModal(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Bill
              </button>
            </div>
          </div>

          <div className="bg-white shadow-soft overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {bills.map((bill) => (
                <li key={bill.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900">{bill.patient_name}</div>
                        <div className="text-sm text-gray-500">{bill.date}</div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-600">
                          Total: ${bill.total_amount} • Paid: ${bill.paid_amount} • 
                          Remaining: ${(bill.total_amount - bill.paid_amount).toFixed(2)}
                        </p>
                        <div className="text-xs text-gray-500 mt-1">
                          Services: {bill.services?.map(s => s.name).join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                        bill.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {bill.status}
                      </span>
                      {bill.status !== 'paid' && (
                        <button
                          onClick={() => {
                            setSelectedBill(bill);
                            setShowPaymentModal(true);
                          }}
                          className="btn-success text-xs"
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Collect Payment
                        </button>
                      )}
                      <button
                      onClick={() => handleDownloadReceipt(bill)}
                      aria-label="Download receipt"
                      className="text-blue-600 hover:text-blue-800">
                        <Printer className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Visitors Tab */}
      {activeTab === 'visitors' && (
        <div className="space-y-6 animate-fade-in">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Visitor Management</h3>
              <p className="mt-1 text-sm text-gray-500">Track and manage hospital visitors</p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => setShowVisitorModal(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Register Visitor
              </button>
            </div>
          </div>

          <div className="bg-white shadow-soft overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {visitors.map((visitor) => (
                <li key={visitor.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UserCheck className="h-6 w-6 text-purple-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{visitor.name}</div>
                        <div className="text-sm text-gray-500">
                          Visiting: {visitor.patientName} • {visitor.relationship}
                        </div>
                        <div className="text-sm text-gray-500">
                          Check-in: {visitor.checkInTime} • {visitor.phone}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        visitor.status === 'visiting' ? 'bg-green-100 text-green-800' :
                        visitor.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {visitor.status}
                      </span>
                      {visitor.status === 'visiting' && (
                        <button className="btn-secondary text-xs">
                          Check Out
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Insurance Tab */}
      {activeTab === 'insurance' && (
        <div className="space-y-6 animate-fade-in">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Insurance Claims</h3>
              <p className="mt-1 text-sm text-gray-500">Manage insurance claims and approvals</p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => setShowInsuranceModal(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Submit Claim
              </button>
            </div>
          </div>

          <div className="bg-white shadow-soft overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {insuranceClaims.map((claim) => (
                <li key={claim.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900">{claim.patientName}</div>
                        <div className="text-sm text-gray-500">{claim.submittedDate}</div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-600">
                          Claim: {claim.claimNumber} • Amount: ${claim.amount.toLocaleString()}
                        </p>
                        <div className="text-xs text-gray-500 mt-1">
                          Provider: {claim.insuranceProvider}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                        claim.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {claim.status}
                      </span>
                      <button className="text-blue-600 hover:text-blue-800">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      
{/* Reports Tab */}

{activeTab === 'reports' && (
  <div className="space-y-6 animate-fade-in">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Daily Report Card */}
      <div className="bg-white p-6 rounded-lg shadow-soft">
        <div className="flex items-center">
          <BarChart3 className="h-8 w-8 text-blue-500" />
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">Daily Report</h3>
            <p className="text-sm text-gray-500">Today's activities summary</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-sm">
            <span className="font-medium">Appointments:</span> {todayAppointments.length}
          </p>
          <p className="text-sm">
            <span className="font-medium">Check-ins:</span> {checkIns.length}
          </p>
          <p className="text-sm">
            <span className="font-medium">Revenue:</span> ${todayRevenue.toFixed(2)}
          </p>
        </div>
        <div className="mt-4">
          <button 
            onClick={generateDailyReport} 
            className="btn-primary w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Daily Report
          </button>
        </div>
      </div>

      {/* Revenue Report Card */}
      <div className="bg-white p-6 rounded-lg shadow-soft">
        <div className="flex items-center">
          <PieChart className="h-8 w-8 text-green-500" />
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">Revenue Report</h3>
            <p className="text-sm text-gray-500">Financial summary</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-sm">
            <span className="font-medium">Total Revenue:</span> ${totalRevenue.toFixed(2)}
          </p>
          <p className="text-sm">
            <span className="font-medium">Pending Bills:</span> {pendingBills.length}
          </p>
          <p className="text-sm">
            <span className="font-medium">Pending Amount:</span> ${pendingBills.reduce((sum, bill) => sum + (bill.total_amount - bill.paid_amount), 0).toFixed(2)}
          </p>
        </div>
        <div className="mt-4">
          <button 
            onClick={generateRevenueReport} 
            className="btn-primary w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Revenue Report
          </button>
        </div>
      </div>

      {/* Appointment Report Card */}
      <div className="bg-white p-6 rounded-lg shadow-soft">
        <div className="flex items-center">
          <CalendarIcon className="h-8 w-8 text-purple-500" />
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">Appointment Report</h3>
            <p className="text-sm text-gray-500">Scheduling analytics</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-sm">
            <span className="font-medium">Total Appointments:</span> {appointments.length}
          </p>
          <p className="text-sm">
            <span className="font-medium">Completed:</span> {appointments.filter(a => a.status === 'completed').length}
          </p>
          <p className="text-sm">
            <span className="font-medium">Scheduled:</span> {appointments.filter(a => a.status === 'scheduled').length}
          </p>
        </div>
        <div className="mt-4">
          <button 
            onClick={generateAppointmentReport} 
            className="btn-primary w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Appointment Report
          </button>
        </div>
      </div>
    </div>

  </div>
)}

      

      {/* Modals */}
      <PatientModal
        isOpen={showPatientModal}
        onClose={() => {
          setShowPatientModal(false);
          setEditingPatient(null);
        }}
        onSave={editingPatient ? handleUpdatePatient : handleAddPatient}
        patient={editingPatient}
        availableDoctors={availableDoctors}
      />

      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onSave={handleAddAppointment}
        patients={patients}
        availableDoctors={availableDoctors}
      />

      <BillModal
        isOpen={showBillModal}
        onClose={() => {
          setShowBillModal(false);
          setSelectedPatient(null);
        }}
        onSave={handleAddBill}
        patients={patients}
        selectedPatient={selectedPatient}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedBill(null);
        }}
        onSave={handlePayment}
        bill={selectedBill}
      />

      <VisitorModal
        isOpen={showVisitorModal}
        onClose={() => setShowVisitorModal(false)}
        onSave={handleVisitorRegistration}
        patients={patients}
      />

      <InsuranceModal
        isOpen={showInsuranceModal}
        onClose={() => setShowInsuranceModal(false)}
        onSave={handleInsuranceClaim}
        patients={patients}
      />
    </div>
  );
}

// Enhanced Patient Modal Component
function PatientModal({ isOpen, onClose, onSave, patient, availableDoctors }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    emergency_contact: '',
    blood_type: '',
    allergies: '',
    assigned_doctor: '',
    status: 'outpatient',
    insurance_provider: '',
    insurance_number: '',
    occupation: '',
    marital_status: ''
  });

  React.useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        age: patient.age || '',
        gender: patient.gender || '',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        emergency_contact: patient.emergency_contact || '',
        blood_type: patient.blood_type || '',
        allergies: patient.allergies || '',
        assigned_doctor: patient.assigned_doctor || '',
        status: patient.status || 'outpatient',
        insurance_provider: patient.insurance_provider || '',
        insurance_number: patient.insurance_number || '',
        occupation: patient.occupation || '',
        marital_status: patient.marital_status || ''
      });
    } else {
      setFormData({
        name: '',
        age: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        emergency_contact: '',
        blood_type: '',
        allergies: '',
        assigned_doctor: '',
        status: 'outpatient',
        insurance_provider: '',
        insurance_number: '',
        occupation: '',
        marital_status: ''
      });
    }
  }, [patient]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={patient ? 'Edit Patient' : 'Register New Patient'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Age *</label>
              <input
                type="number"
                name="age"
                required
                value={formData.age}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender *</label>
              <select
                name="gender"
                required
                value={formData.gender}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Marital Status</label>
              <select
                name="marital_status"
                value={formData.marital_status}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
              >
                <option value="">Select Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
              <input
                type="text"
                name="emergency_contact"
                value={formData.emergency_contact}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
                placeholder="Name - Phone Number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Occupation</label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
              />
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Blood Type</label>
              <select
                name="blood_type"
                value={formData.blood_type}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
              >
                <option value="">Select Blood Type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                <Stethoscope className="inline h-4 w-4 mr-1" />
                Assign to Doctor
              </label>
              <select
                name="assigned_doctor"
                value={formData.assigned_doctor}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
              >
                <option value="">Select Doctor</option>
                {availableDoctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.first_name} {doctor.last_name} - {doctor.department}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Allergies</label>
              <input
                type="text"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
                placeholder="List any known allergies"
              />
            </div>
          </div>
        </div>

        {/* Insurance Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Insurance Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Insurance Provider</label>
              <input
                type="text"
                name="insurance_provider"
                value={formData.insurance_provider}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
                placeholder="e.g., Blue Cross, Aetna"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Insurance Number</label>
              <input
                type="text"
                name="insurance_number"
                value={formData.insurance_number}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {patient ? 'Update' : 'Register'} Patient
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Enhanced Appointment Modal Component
function AppointmentModal({ isOpen, onClose, onSave, patients, availableDoctors }) {
  const [formData, setFormData] = useState({
    patient: '',
    doctor: '',
    date: '',
    time: '',
    type: '',
    notes: '',
    priority: 'routine',
    duration: '30'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      patient: '',
      doctor: '',
      date: '',
      time: '',
      type: '',
      notes: '',
      priority: 'routine',
      duration: '30'
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule New Appointment"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Patient *</label>
            <select
              name="patient"
              required
              value={formData.patient}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            >
              <option value="">Select Patient</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.phone}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Doctor *</label>
            <select
              name="doctor"
              required
              value={formData.doctor}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            >
              <option value="">Select Doctor</option>
              {availableDoctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.first_name} {doctor.last_name} - {doctor.department}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date *</label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Time *</label>
            <input
              type="time"
              name="time"
              required
              value={formData.time}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type *</label>
            <select
              name="type"
              required
              value={formData.type}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            >
              <option value="">Select Type</option>
              <option value="consultation">Consultation</option>
              <option value="follow-up">Follow-up</option>
              <option value="emergency">Emergency</option>
              <option value="routine">Routine Check</option>
              <option value="surgery">Surgery</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
            placeholder="Additional notes or special instructions..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Schedule Appointment
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Enhanced Bill Modal Component
function BillModal({ isOpen, onClose, onSave, patients, selectedPatient }) {
  const [formData, setFormData] = useState({
    patient: selectedPatient?.id || '',
    services: [{ name: '', amount: '', quantity: 1 }],
    discount: 0,
    tax: 0,
    payment_terms: 'immediate'
  });

  React.useEffect(() => {
    if (selectedPatient) {
      setFormData(prev => ({
        ...prev,
        patient: selectedPatient.id
      }));
    }
  }, [selectedPatient]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const services = formData.services.map(service => ({
      ...service,
      amount: parseFloat(service.amount),
      quantity: parseInt(service.quantity)
    }));
    
    onSave({
      patient: parseInt(formData.patient),
      services,
      discount: parseFloat(formData.discount),
      tax: parseFloat(formData.tax),
      payment_terms: formData.payment_terms
    });
    
    setFormData({
      patient: '',
      services: [{ name: '', amount: '', quantity: 1 }],
      discount: 0,
      tax: 0,
      payment_terms: 'immediate'
    });
  };

  const handleServiceChange = (index, field, value) => {
    const newServices = [...formData.services];
    newServices[index][field] = value;
    setFormData({
      ...formData,
      services: newServices
    });
  };

  const addService = () => {
    setFormData({
      ...formData,
      services: [...formData.services, { name: '', amount: '', quantity: 1 }]
    });
  };

  const removeService = (index) => {
    if (formData.services.length > 1) {
      const newServices = formData.services.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        services: newServices
      });
    }
  };

  const calculateTotal = () => {
    const subtotal = formData.services.reduce((sum, service) => {
      return sum + (parseFloat(service.amount || 0) * parseInt(service.quantity || 1));
    }, 0);
    const discount = parseFloat(formData.discount || 0);
    const tax = parseFloat(formData.tax || 0);
    return subtotal - discount + tax;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Bill"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Patient *</label>
          <select
            name="patient"
            required
            value={formData.patient}
            onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
            className="form-input mt-1 block w-full"
            disabled={selectedPatient}
          >
            <option value="">Select Patient</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.name} - {patient.phone}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700">Services & Charges</label>
            <button
              type="button"
              onClick={addService}
              className="btn-secondary text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Service
            </button>
          </div>
          
          {formData.services.map((service, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3 p-4 border rounded-md bg-gray-50">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Service/Item name"
                  required
                  value={service.name}
                  onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                  className="form-input block w-full"
                />
              </div>
              <div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Unit Price"
                  required
                  value={service.amount}
                  onChange={(e) => handleServiceChange(index, 'amount', e.target.value)}
                  className="form-input block w-full"
                />
              </div>
              <div>
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  required
                  value={service.quantity}
                  onChange={(e) => handleServiceChange(index, 'quantity', e.target.value)}
                  className="form-input block w-full"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  ${((parseFloat(service.amount) || 0) * (parseInt(service.quantity) || 1)).toFixed(2)}
                </span>
                {formData.services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Discount ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              className="form-input mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tax ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.tax}
              onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
              className="form-input mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
            <select
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              className="form-input mt-1 block w-full"
            >
              <option value="immediate">Immediate</option>
              <option value="net_30">Net 30 Days</option>
              <option value="net_60">Net 60 Days</option>
            </select>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total Amount:</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Create Bill
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Enhanced Payment Modal Component
function PaymentModal({ isOpen, onClose, onSave, bill }) {
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'cash',
    transaction_id: '',
    notes: '',
    received_by: ''
  });

  React.useEffect(() => {
    if (bill) {
      setFormData({
        amount: (bill.total_amount - bill.paid_amount).toString(),
        payment_method: 'cash',
        transaction_id: '',
        notes: '',
        received_by: ''
      });
    }
  }, [bill]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      amount: parseFloat(formData.amount),
      payment_method: formData.payment_method,
      transaction_id: formData.transaction_id,
      notes: formData.notes,
      received_by: formData.received_by
    });
    setFormData({
      amount: '',
      payment_method: 'cash',
      transaction_id: '',
      notes: '',
      received_by: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!bill) return null;

  const remainingAmount = bill.total_amount - bill.paid_amount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Collect Payment - ${bill.patient_name}`}
      size="md"
    >
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">Patient:</span> {bill.patient_name}</p>
          <p><span className="font-medium">Bill Date:</span> {bill.date}</p>
          <p><span className="font-medium">Total Amount:</span> ${bill.total_amount}</p>
          <p><span className="font-medium">Paid Amount:</span> ${bill.paid_amount}</p>
          <p><span className="font-medium text-red-600">Remaining:</span> ${remainingAmount.toFixed(2)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Payment Amount *</label>
          <input
            type="number"
            step="0.01"
            name="amount"
            required
            max={remainingAmount}
            value={formData.amount}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Payment Method *</label>
          <select
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
          >
            <option value="cash">Cash</option>
            <option value="card">Credit/Debit Card</option>
            <option value="check">Check</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="insurance">Insurance</option>
            <option value="mobile_payment">Mobile Payment</option>
          </select>
        </div>

        {(formData.payment_method === 'card' || formData.payment_method === 'bank_transfer') && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
            <input
              type="text"
              name="transaction_id"
              value={formData.transaction_id}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
              placeholder="Enter transaction reference"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Received By</label>
          <input
            type="text"
            name="received_by"
            value={formData.received_by}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
            placeholder="Staff member name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
            placeholder="Additional payment notes..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Process Payment
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Visitor Modal Component
function VisitorModal({ isOpen, onClose, onSave, patients }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    patientName: '',
    relationship: '',
    purpose: '',
    idType: '',
    idNumber: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      name: '',
      phone: '',
      patientName: '',
      relationship: '',
      purpose: '',
      idType: '',
      idNumber: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register Visitor"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Visitor Name *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Patient to Visit *</label>
            <select
              name="patientName"
              required
              value={formData.patientName}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            >
              <option value="">Select Patient</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.name}>
                  {patient.name} - {patient.phone}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Relationship *</label>
            <select
              name="relationship"
              required
              value={formData.relationship}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            >
              <option value="">Select Relationship</option>
              <option value="Spouse">Spouse</option>
              <option value="Parent">Parent</option>
              <option value="Child">Child</option>
              <option value="Sibling">Sibling</option>
              <option value="Friend">Friend</option>
              <option value="Relative">Relative</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ID Type</label>
            <select
              name="idType"
              value={formData.idType}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            >
              <option value="">Select ID Type</option>
              <option value="drivers_license">Driver's License</option>
              <option value="passport">Passport</option>
              <option value="national_id">National ID</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ID Number</label>
            <input
              type="text"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Purpose of Visit</label>
          <textarea
            name="purpose"
            rows={2}
            value={formData.purpose}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
            placeholder="Brief description of visit purpose..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Register Visitor
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Insurance Modal Component
function InsuranceModal({ isOpen, onClose, onSave, patients }) {
  const [formData, setFormData] = useState({
    patientName: '',
    claimNumber: '',
    amount: '',
    insuranceProvider: '',
    serviceDate: '',
    diagnosis: '',
    treatment: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: parseFloat(formData.amount)
    });
    setFormData({
      patientName: '',
      claimNumber: '',
      amount: '',
      insuranceProvider: '',
      serviceDate: '',
      diagnosis: '',
      treatment: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Insurance Claim"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Patient *</label>
            <select
              name="patientName"
              required
              value={formData.patientName}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            >
              <option value="">Select Patient</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.name}>
                  {patient.name} - {patient.phone}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Claim Number *</label>
            <input
              type="text"
              name="claimNumber"
              required
              value={formData.claimNumber}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
              placeholder="CLM-2024-XXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Claim Amount *</label>
            <input
              type="number"
              step="0.01"
              name="amount"
              required
              value={formData.amount}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Insurance Provider *</label>
            <input
              type="text"
              name="insuranceProvider"
              required
              value={formData.insuranceProvider}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
              placeholder="e.g., Blue Cross, Aetna"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Service Date *</label>
            <input
              type="date"
              name="serviceDate"
              required
              value={formData.serviceDate}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
          <input
            type="text"
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
            placeholder="Primary diagnosis"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Treatment/Services</label>
          <textarea
            name="treatment"
            rows={3}
            value={formData.treatment}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
            placeholder="Description of treatment or services provided..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Submit Claim
          </button>
        </div>
      </form>
    </Modal>
  );
}