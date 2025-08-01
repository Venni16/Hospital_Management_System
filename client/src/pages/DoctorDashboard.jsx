import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { 
  Users, Calendar, FileText, Pill, TestTube, Clock, Plus, Edit3, Eye,
  CheckCircle, XCircle, AlertCircle, Activity, Stethoscope, User,
  ClipboardList, Heart, Brain, Thermometer, Zap, Phone, Mail,
  MapPin, Calendar as CalendarIcon, Timer, Star, Award, TrendingUp
} from 'lucide-react';

import CompleteLabTestModal from '../components/CompleteLabTestModal';

export default function DoctorDashboard() {
  const { 
    patients, appointments, medicalRecords, prescriptions, labTests, staff,
    currentUser, loading, error, clearError,
    fetchPatients, fetchAppointments, fetchMedicalRecords, fetchPrescriptions, fetchLabTests,
    addMedicalRecord, addPrescription, addLabTest, updateAppointment, api
  } = useApp();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showLabTestModal, setShowLabTestModal] = useState(false);
  const [showPatientDetailModal, setShowPatientDetailModal] = useState(false);
  const [showAppointmentDetailModal, setShowAppointmentDetailModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch data on component mount
  useEffect(() => {
    if (currentUser?.role === 'doctor') {
      fetchPatients();
      fetchAppointments();
      fetchMedicalRecords();
      fetchPrescriptions();
      fetchLabTests();
    }
  }, [currentUser]);

  // Filter data
  const myPatients = patients.filter(patient => patient.assigned_doctor === currentUser?.id);
  const myAppointments = appointments.filter(apt => apt.doctor === currentUser?.id);
  const todayAppointments = myAppointments.filter(apt => apt.date === new Date().toISOString().split('T')[0]);
  const upcomingAppointments = myAppointments.filter(apt => 
    new Date(apt.date) >= new Date() && apt.status === 'scheduled'
  );
  const myMedicalRecords = medicalRecords.filter(record => record.doctor === currentUser?.id);
  const myPrescriptions = prescriptions.filter(prescription => prescription.doctor === currentUser?.id);
  const myLabTests = labTests.filter(test => test.ordered_by === currentUser?.id);
  const pendingLabTests = myLabTests.filter(test => test.status === 'pending');

  // Filter patients based on search
  const filteredPatients = myPatients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter appointments by selected date
  const dateFilteredAppointments = myAppointments.filter(apt => apt.date === selectedDate);

  // Statistics
  const totalPatients = myPatients.length;
  const todayAppointmentsCount = todayAppointments.length;
  const completedAppointments = myAppointments.filter(apt => apt.status === 'completed').length;
  const activePrescriptions = myPrescriptions.filter(p => p.status === 'active').length;

  // Handle functions
  const handleCompleteAppointment = async (appointmentId) => {
    try {
      await api.completeAppointment(appointmentId);
      await fetchAppointments();
    } catch (error) {
      console.error('Error completing appointment:', error);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await api.cancelAppointment(appointmentId);
        await fetchAppointments();
      } catch (error) {
        console.error('Error canceling appointment:', error);
      }
    }
  };

  const handleNoShowAppointment = async (appointmentId) => {
    try {
      await api.noShowAppointment(appointmentId);
      await fetchAppointments();
    } catch (error) {
      console.error('Error marking no show:', error);
    }
  };

  const handleAddMedicalRecord = async (recordData) => {
    try {
      const recordDataWithDoctor = { ...recordData, doctor: currentUser.id };
      console.log('Adding medical record with data:', recordDataWithDoctor);
      await addMedicalRecord(recordDataWithDoctor);
      setShowMedicalRecordModal(false);
      setSelectedPatient(null);
    } catch (error) {
      console.error('Error adding medical record:', error);
      if (error.response) {
        try {
          const errorData = await error.response.json();
          alert('Failed to add medical record: ' + JSON.stringify(errorData));
        } catch (parseError) {
          alert('Failed to add medical record: ' + (error.message || error));
        }
      } else {
        alert('Failed to add medical record: ' + (error.message || error));
      }
    }
  };

  const handleAddPrescription = async (prescriptionData) => {
    try {
      const prescriptionDataWithDoctor = { ...prescriptionData, doctor: currentUser.id };
      await addPrescription(prescriptionDataWithDoctor);
      setShowPrescriptionModal(false);
      setSelectedPatient(null);
    } catch (error) {
      console.error('Error adding prescription:', error);
    }
  };

  const [showCompleteLabTestModal, setShowCompleteLabTestModal] = useState(false);
  const [selectedLabTest, setSelectedLabTest] = useState(null);
  const [completingLabTest, setCompletingLabTest] = useState(false);
  const [labTestCompletionError, setLabTestCompletionError] = useState(null);

  const handleAddLabTest = async (testData) => {
    try {
      await addLabTest(testData);
      setShowLabTestModal(false);
      setSelectedPatient(null);
      await fetchLabTests();
      // Removed window alert for success message
    } catch (error) {
      console.error('Error ordering lab test:', error);
      // Removed window alert for error message
    }
  };

  const handleCompleteLabTest = async (testId, results, notes) => {
    setCompletingLabTest(true);
    setLabTestCompletionError(null);
    try {
      await api.completeLabTest(testId, results, notes);
      await fetchLabTests();
      setShowCompleteLabTestModal(false);
      setSelectedLabTest(null);
      // Removed window alert for success message
    } catch (error) {
      console.error('Error completing lab test:', error);
      setLabTestCompletionError(error.message || 'Failed to complete lab test.');
    } finally {
      setCompletingLabTest(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'appointments', name: 'Appointments', icon: Calendar },
    { id: 'patients', name: 'My Patients', icon: Users },
    { id: 'medical-records', name: 'Medical Records', icon: FileText },
    { id: 'prescriptions', name: 'Prescriptions', icon: Pill },
    { id: 'lab-tests', name: 'Lab Tests', icon: TestTube }
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
          <h1 className="text-2xl font-semibold text-gray-900">Doctor Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Welcome back, Dr. {currentUser?.first_name} {currentUser?.last_name}
          </p>
          <p className="text-sm text-blue-600 font-medium">{currentUser?.department} • {currentUser?.specialization}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
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
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        My Patients
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {totalPatients}
                      </dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Today's Appointments
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {todayAppointmentsCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-soft rounded-lg card-hover">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completed Today
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {todayAppointments.filter(apt => apt.status === 'completed').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-soft rounded-lg card-hover">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TestTube className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Lab Tests
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {pendingLabTests.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Schedule & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Appointments */}
            <div className="bg-white shadow-soft rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Today's Schedule
                </h3>
                {todayAppointments.length === 0 ? (
                  <p className="text-gray-500">No appointments scheduled for today.</p>
                ) : (
                  <div className="space-y-3">
                    {todayAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                        <div className="flex items-center space-x-3">
                          <Clock className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{appointment.time}</p>
                            <p className="text-sm text-gray-500">{appointment.patient_name}</p>
                            <p className="text-xs text-gray-400">{appointment.type}</p>
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
                          {appointment.status === 'scheduled' && (
                            <button
                              onClick={() => handleCompleteAppointment(appointment.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Mark as completed"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow-soft rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowMedicalRecordModal(true)}
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FileText className="h-6 w-6 text-blue-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900">Add Record</span>
                  </button>
                  <button
                    onClick={() => setShowPrescriptionModal(true)}
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Pill className="h-6 w-6 text-green-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900">Prescribe</span>
                  </button>
                  <button
                    onClick={() => setShowLabTestModal(true)}
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <TestTube className="h-6 w-6 text-purple-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900">Order Test</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('patients')}
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Users className="h-6 w-6 text-yellow-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900">View Patients</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow-soft rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {myMedicalRecords.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Medical record for {record.patient_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {record.diagnosis} • {record.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="space-y-6 animate-fade-in">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  My Appointments
                </h3>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-soft overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {dateFilteredAppointments.map((appointment) => (
                <li key={appointment.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Calendar className="h-6 w-6 text-blue-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{appointment.patient_name}</div>
                        <div className="text-sm text-gray-500">
                          {appointment.time} • {appointment.type}
                        </div>
                        {appointment.notes && (
                          <div className="text-sm text-gray-400">{appointment.notes}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        appointment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.status}
                      </span>
                      
                      {appointment.status === 'scheduled' && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleCompleteAppointment(appointment.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Mark as completed"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleNoShowAppointment(appointment.id)}
                            className="text-orange-600 hover:text-orange-800"
                            title="Mark as no show"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCancelAppointment(appointment.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Cancel appointment"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowAppointmentDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="View details"
                      >
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

      {/* Patients Tab */}
      {activeTab === 'patients' && (
        <div className="space-y-6 animate-fade-in">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search my patients..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => (
              <div key={patient.id} className="bg-white shadow-soft rounded-lg p-6 card-hover">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">{patient.name}</h3>
                      <p className="text-sm text-gray-500">{patient.age} years • {patient.gender}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    patient.status === 'admitted' ? 'bg-green-100 text-green-800' :
                    patient.status === 'outpatient' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {patient.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {patient.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {patient.email}
                  </div>
                  {patient.blood_type && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Heart className="h-4 w-4 mr-2" />
                      Blood Type: {patient.blood_type}
                    </div>
                  )}
                  {patient.allergies && (
                    <div className="flex items-center text-sm text-red-600">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Allergies: {patient.allergies}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedPatient(patient);
                      setShowPatientDetailModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        setShowMedicalRecordModal(true);
                      }}
                      className="text-green-600 hover:text-green-800"
                      title="Add medical record"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        setShowPrescriptionModal(true);
                      }}
                      className="text-purple-600 hover:text-purple-800"
                      title="Add prescription"
                    >
                      <Pill className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        setShowLabTestModal(true);
                      }}
                      className="text-yellow-600 hover:text-yellow-800"
                      title="Order lab test"
                    >
                      <TestTube className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medical Records Tab */}
      {activeTab === 'medical-records' && (
        <div className="space-y-6 animate-fade-in">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Medical Records
              </h3>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => setShowMedicalRecordModal(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </button>
            </div>
          </div>

          <div className="overflow-hidden sm:rounded-md bg-transparent shadow-none border-none">
            <ul className="divide-y divide-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {myMedicalRecords.map((record) => (
                <li key={record.id} className="p-4 mb-3 bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow max-w-full">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{record.patient_name}</h3>
                    <time className="text-sm text-gray-500">{record.date}</time>
                  </div>
                  <div className="space-y-4 text-gray-700">
                    <div className="flex items-start space-x-2 border-b border-gray-200 pb-2">
                      <FileText className="w-5 h-5 text-blue-500 mt-1" />
                      <div>
                        <h4 className="text-md font-semibold text-gray-900">Diagnosis</h4>
                        <p className="text-sm text-gray-700">{record.diagnosis}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 border-b border-gray-200 pb-2">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-1" />
                      <div>
                        <h4 className="text-md font-semibold text-gray-900">Symptoms</h4>
                        <p className="text-sm text-gray-700">{record.symptoms}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 border-b border-gray-200 pb-2">
                      <Heart className="w-5 h-5 text-pink-500 mt-1" />
                      <div>
                        <h4 className="text-md font-semibold text-gray-900">Treatment</h4>
                        <p className="text-sm text-gray-700">{record.treatment}</p>
                      </div>
                    </div>
                    {record.follow_up && (
                      <div className="flex items-start space-x-2 text-blue-600">
                        <CalendarIcon className="w-5 h-5 mt-1" />
                        <div>
                          <h4 className="text-md font-semibold">Follow-up</h4>
                          <p className="text-sm">{record.follow_up}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-6 animate-fade-in">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Prescriptions
              </h3>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => setShowPrescriptionModal(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Prescription
              </button>
            </div>
          </div>

          <div className="bg-white shadow-soft overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {myPrescriptions.map((prescription) => (
                <li key={prescription.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900">{prescription.patient_name}</div>
                        <div className="text-sm text-gray-500">{prescription.date}</div>
                      </div>
                      <div className="mt-1">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Medications:</span>
                          <ul className="mt-1 ml-4">
                            {prescription.medications?.map((med, index) => (
                              <li key={index} className="text-sm">
                                • {med.name} - {med.dosage} ({med.frequency})
                              </li>
                            ))}
                          </ul>
                        </div>
                        {prescription.instructions && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Instructions:</span> {prescription.instructions}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        prescription.status === 'active' ? 'bg-green-100 text-green-800' :
                        prescription.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {prescription.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Lab Tests Tab */}
      {activeTab === 'lab-tests' && (
        <div className="space-y-6 animate-fade-in">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Lab Tests
              </h3>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => setShowLabTestModal(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Order Test
              </button>
            </div>
          </div>

          <div className="bg-white shadow-soft overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {myLabTests.map((test) => (
                <li key={test.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900">{test.patient_name}</div>
                        <div className="text-sm text-gray-500">{test.ordered_date}</div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Test:</span> {test.test_type}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Priority:</span> {test.priority}
                        </p>
                      {test.results && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Results:</span> {test.results}
                        </p>
                      )}
                      {test.notes && (
                        <p className="text-sm text-gray-600 mt-1 italic">
                          <span className="font-medium">Notes:</span> {test.notes}
                        </p>
                      )}
                      {test.completed_date && (
                        <p className="text-sm text-green-600">
                          <span className="font-medium">Completed:</span> {test.completed_date}
                        </p>
                      )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        test.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        test.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        test.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {test.status.replace('_', ' ')}
                      </span>
                      
                      {test.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedLabTest(test);
                            setShowCompleteLabTestModal(true);
                          }}
                          disabled={completingLabTest}
                          className={`text-green-600 hover:text-green-800 ${completingLabTest ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Complete test"
                        >
                          <CheckCircle className="h-4 w-4" />
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

      {/* Modals */}
      <MedicalRecordModal
        isOpen={showMedicalRecordModal}
        onClose={() => {
          setShowMedicalRecordModal(false);
          setSelectedPatient(null);
        }}
        onSave={handleAddMedicalRecord}
        patients={myPatients}
        selectedPatient={selectedPatient}
      />

      <PrescriptionModal
        isOpen={showPrescriptionModal}
        onClose={() => {
          setShowPrescriptionModal(false);
          setSelectedPatient(null);
        }}
        onSave={handleAddPrescription}
        patients={myPatients}
        selectedPatient={selectedPatient}
      />

      <LabTestModal
        isOpen={showLabTestModal}
        onClose={() => {
          setShowLabTestModal(false);
          setSelectedPatient(null);
        }}
        onSave={handleAddLabTest}
        patients={myPatients}
        selectedPatient={selectedPatient}
      />

      {showCompleteLabTestModal && selectedLabTest && (
        <CompleteLabTestModal
          isOpen={showCompleteLabTestModal}
          onClose={() => {
            setShowCompleteLabTestModal(false);
            setSelectedLabTest(null);
            setLabTestCompletionError(null);
          }}
          labTest={selectedLabTest}
          onComplete={handleCompleteLabTest}
          loading={completingLabTest}
          error={labTestCompletionError}
        />
      )}

      <PatientDetailModal
        isOpen={showPatientDetailModal}
        onClose={() => {
          setShowPatientDetailModal(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
        medicalRecords={myMedicalRecords.filter(r => r.patient === selectedPatient?.id)}
        prescriptions={myPrescriptions.filter(p => p.patient === selectedPatient?.id)}
        labTests={myLabTests.filter(t => t.patient === selectedPatient?.id)}
      />

      <AppointmentDetailModal
        isOpen={showAppointmentDetailModal}
        onClose={() => {
          setShowAppointmentDetailModal(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onComplete={handleCompleteAppointment}
        onCancel={handleCancelAppointment}
        onNoShow={handleNoShowAppointment}
      />
    </div>
  );
}

// Medical Record Modal Component
function MedicalRecordModal({ isOpen, onClose, onSave, patients, selectedPatient }) {
  const [formData, setFormData] = useState({
    patient: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    medications: [{ name: '', dosage: '', frequency: '' }],
    notes: '',
    follow_up: ''
  });

  React.useEffect(() => {
    if (selectedPatient) {
      setFormData(prev => ({ ...prev, patient: selectedPatient.id }));
    }
  }, [selectedPatient]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      patient: '',
      symptoms: '',
      diagnosis: '',
      treatment: '',
      medications: [{ name: '', dosage: '', frequency: '' }],
      notes: '',
      follow_up: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMedicationChange = (index, field, value) => {
    const newMedications = [...formData.medications];
    newMedications[index][field] = value;
    setFormData({
      ...formData,
      medications: newMedications
    });
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: '', dosage: '', frequency: '' }]
    });
  };

  const removeMedication = (index) => {
    if (formData.medications.length > 1) {
      const newMedications = formData.medications.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        medications: newMedications
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Medical Record"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Patient</label>
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
          <label className="block text-sm font-medium text-gray-700">Symptoms</label>
          <textarea
            name="symptoms"
            required
            rows={3}
            value={formData.symptoms}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
            placeholder="Describe the patient's symptoms..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
          <input
            type="text"
            name="diagnosis"
            required
            value={formData.diagnosis}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
            placeholder="Primary diagnosis..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Treatment</label>
          <textarea
            name="treatment"
            required
            rows={3}
            value={formData.treatment}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
            placeholder="Treatment plan and procedures..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Medications</label>
          {formData.medications.map((medication, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3 p-3 border rounded-md">
              <input
                type="text"
                placeholder="Name"
                required
                value={medication.name}
                onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                className="form-input block w-full"
              />
              <input
                type="text"
                placeholder="Dosage"
                required
                value={medication.dosage}
                onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                className="form-input block w-full"
              />
              <input
                type="text"
                placeholder="Frequency"
                required
                value={medication.frequency}
                onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                className="form-input block w-full"
              />
              {formData.medications.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMedication(index)}
                  className="text-red-600 hover:text-red-800 col-span-3 text-right"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addMedication}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Medication
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
            placeholder="Additional notes..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Follow-up Date</label>
          <input
            type="date"
            name="follow_up"
            value={formData.follow_up}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Save Record
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Prescription Modal Component
function PrescriptionModal({ isOpen, onClose, onSave, patients, selectedPatient }) {
  const [formData, setFormData] = useState({
    patient: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
    instructions: ''
  });

  React.useEffect(() => {
    if (selectedPatient) {
      setFormData(prev => ({ ...prev, patient: selectedPatient.id }));
    }
  }, [selectedPatient]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      patient: '',
      medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
      instructions: ''
    });
  };

  const handleMedicationChange = (index, field, value) => {
    const newMedications = [...formData.medications];
    newMedications[index][field] = value;
    setFormData({
      ...formData,
      medications: newMedications
    });
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: '', dosage: '', frequency: '', duration: '' }]
    });
  };

  const removeMedication = (index) => {
    if (formData.medications.length > 1) {
      const newMedications = formData.medications.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        medications: newMedications
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Prescription"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Patient</label>
          <select
            name="patient"
            required
            value={formData.patient}
            onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Medications</label>
          {formData.medications.map((medication, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3 p-3 border rounded-md">
              <div>
                <input
                  type="text"
                  placeholder="Medication name"
                  required
                  value={medication.name}
                  onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                  className="form-input block w-full"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Dosage"
                  required
                  value={medication.dosage}
                  onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                  className="form-input block w-full"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Frequency"
                  required
                  value={medication.frequency}
                  onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                  className="form-input block w-full"
                />
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Duration"
                  required
                  value={medication.duration}
                  onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                  className="form-input block w-full"
                />
                {formData.medications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedication(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addMedication}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Medication
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Instructions</label>
          <textarea
            name="instructions"
            rows={3}
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            className="form-input mt-1 block w-full"
            placeholder="Special instructions for the patient..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Create Prescription
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Lab Test Modal Component
function LabTestModal({ isOpen, onClose, onSave, patients, selectedPatient }) {
  const [formData, setFormData] = useState({
    patient: '',
    test_type: '',
    priority: 'routine',
    notes: ''
  });

  React.useEffect(() => {
    if (selectedPatient) {
      setFormData(prev => ({ ...prev, patient: selectedPatient.id }));
    }
  }, [selectedPatient]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      patient: '',
      test_type: '',
      priority: 'routine',
      notes: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const commonTests = [
    'Complete Blood Count (CBC)',
    'Basic Metabolic Panel',
    'Lipid Panel',
    'Liver Function Tests',
    'Thyroid Function Tests',
    'Urinalysis',
    'Chest X-Ray',
    'ECG',
    'Blood Glucose',
    'HbA1c',
    'Vitamin D',
    'Vitamin B12',
    'Iron Studies',
    'Inflammatory Markers (ESR, CRP)'
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Order Lab Test"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Patient</label>
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
          <label className="block text-sm font-medium text-gray-700">Test Type</label>
          <select
            name="test_type"
            required
            value={formData.test_type}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
          >
            <option value="">Select Test</option>
            {commonTests.map(test => (
              <option key={test} value={test}>
                {test}
              </option>
            ))}
            <option value="other">Other (specify in notes)</option>
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
            <option value="stat">STAT</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
            placeholder="Additional notes or specific test details..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Order Test
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Patient Detail Modal Component
function PatientDetailModal({ isOpen, onClose, patient, medicalRecords, prescriptions, labTests }) {
  if (!patient) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Patient Details - ${patient.name}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Patient Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name: <span className="font-medium text-gray-900">{patient.name}</span></p>
              <p className="text-sm text-gray-600">Age: <span className="font-medium text-gray-900">{patient.age} years</span></p>
              <p className="text-sm text-gray-600">Gender: <span className="font-medium text-gray-900">{patient.gender}</span></p>
              <p className="text-sm text-gray-600">Blood Type: <span className="font-medium text-gray-900">{patient.blood_type || 'Not specified'}</span></p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone: <span className="font-medium text-gray-900">{patient.phone}</span></p>
              <p className="text-sm text-gray-600">Email: <span className="font-medium text-gray-900">{patient.email}</span></p>
              <p className="text-sm text-gray-600">Status: <span className="font-medium text-gray-900">{patient.status}</span></p>
              {patient.allergies && (
                <p className="text-sm text-red-600">Allergies: <span className="font-medium">{patient.allergies}</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Medical Records */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Medical Records</h3>
          {medicalRecords.length === 0 ? (
            <p className="text-gray-500">No medical records found.</p>
          ) : (
            <div className="space-y-3">
              {medicalRecords.slice(0, 3).map((record) => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{record.diagnosis}</h4>
                    <span className="text-sm text-gray-500">{record.date}</span>
                  </div>
                  <p className="text-sm text-gray-600">Symptoms: {record.symptoms}</p>
                  <p className="text-sm text-gray-600">Treatment: {record.treatment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prescriptions */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Active Prescriptions</h3>
          {prescriptions.filter(p => p.status === 'active').length === 0 ? (
            <p className="text-gray-500">No active prescriptions.</p>
          ) : (
            <div className="space-y-3">
              {prescriptions.filter(p => p.status === 'active').map((prescription) => (
                <div key={prescription.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">Prescription</h4>
                    <span className="text-sm text-gray-500">{prescription.date}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {prescription.medications?.map((med, index) => (
                      <p key={index}>• {med.name} - {med.dosage} ({med.frequency})</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lab Tests */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Lab Tests</h3>
          {labTests.length === 0 ? (
            <p className="text-gray-500">No lab tests found.</p>
          ) : (
            <div className="space-y-3">
              {labTests.slice(0, 3).map((test) => (
                <div key={test.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{test.test_type}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      test.status === 'completed' ? 'bg-green-100 text-green-800' :
                      test.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {test.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Ordered: {test.ordered_date}</p>
                  {test.results && (
                    <p className="text-sm text-gray-600">Results: {test.results}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// Appointment Detail Modal Component
function AppointmentDetailModal({ isOpen, onClose, appointment, onComplete, onCancel, onNoShow }) {
  if (!appointment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Appointment Details"
      size="lg"
    >
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Patient: <span className="font-medium text-gray-900">{appointment.patient_name}</span></p>
              <p className="text-sm text-gray-600">Date: <span className="font-medium text-gray-900">{appointment.date}</span></p>
              <p className="text-sm text-gray-600">Time: <span className="font-medium text-gray-900">{appointment.time}</span></p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type: <span className="font-medium text-gray-900">{appointment.type}</span></p>
              <p className="text-sm text-gray-600">Status: 
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  appointment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                  appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {appointment.status}
                </span>
              </p>
            </div>
          </div>
          {appointment.notes && (
            <div className="mt-3">
              <p className="text-sm text-gray-600">Notes: <span className="font-medium text-gray-900">{appointment.notes}</span></p>
            </div>
          )}
        </div>

        {appointment.status === 'scheduled' && (
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                onNoShow(appointment.id);
                onClose();
              }}
              className="btn-warning"
            >
              Mark No Show
            </button>
            <button
              onClick={() => {
                onCancel(appointment.id);
                onClose();
              }}
              className="btn-danger"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onComplete(appointment.id);
                onClose();
              }}
              className="btn-success"
            >
              Mark Completed
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}