import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { 
  Users, Activity, Package, Bed, Plus, Edit3, Eye, Clock, CheckCircle, 
  AlertTriangle, Heart, Thermometer, Droplets, Pill, Stethoscope,
  Calendar, User, Building, Syringe, ClipboardList, TrendingUp,
  Shield, Bell, FileText, Monitor, Zap, UserCheck, Settings, Trash
} from 'lucide-react';

import InventoryModal from '../components/InventoryModal';


export default function NurseDashboard() {
  const { 
    patients, wards, inventory, currentUser, loading, error, clearError,
    fetchPatients, fetchWards, fetchInventory, updateBedStatus, updateInventoryItem,
    addInventoryItem,
    medicationSchedule, fetchMedicationSchedule, dispatch
  } = useApp();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showVitalSignsModal, setShowVitalSignsModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showPatientCareModal, setShowPatientCareModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showNursingNotesModal, setShowNursingNotesModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);

  // Mock data for nursing-specific features
  const [vitalSigns, setVitalSigns] = useState([
    {
      id: 1,
      patientId: 1,
      patientName: 'John Smith',
      bedNumber: 'GA-01',
      temperature: '98.6°F',
      bloodPressure: '120/80',
      heartRate: '72 bpm',
      respiratoryRate: '16/min',
      oxygenSaturation: '98%',
      timestamp: new Date().toLocaleString(),
      recordedBy: currentUser?.first_name + ' ' + currentUser?.last_name
    },
    {
      id: 2,
      patientId: 2,
      patientName: 'Sarah Johnson',
      bedNumber: 'ICU-05',
      temperature: '99.2°F',
      bloodPressure: '130/85',
      heartRate: '78 bpm',
      respiratoryRate: '18/min',
      oxygenSaturation: '97%',
      timestamp: new Date(Date.now() - 3600000).toLocaleString(),
      recordedBy: currentUser?.first_name + ' ' + currentUser?.last_name
    }
  ]);

  const [nursingNotes, setNursingNotes] = useState([
    {
      id: 1,
      patientId: 1,
      patientName: 'John Smith',
      bedNumber: 'GA-01',
      note: 'Patient ambulating well. No complaints of pain. Appetite good.',
      category: 'General Care',
      timestamp: new Date().toLocaleString(),
      nurseId: currentUser?.id,
      nurseName: currentUser?.first_name + ' ' + currentUser?.last_name
    },
    {
      id: 2,
      patientId: 2,
      patientName: 'Sarah Johnson',
      bedNumber: 'ICU-05',
      note: 'Patient stable. Monitoring vital signs closely. Family visited.',
      category: 'Critical Care',
      timestamp: new Date(Date.now() - 1800000).toLocaleString(),
      nurseId: currentUser?.id,
      nurseName: currentUser?.first_name + ' ' + currentUser?.last_name
    }
  ]);

  const [patientCareActivities, setPatientCareActivities] = useState([
    {
      id: 1,
      patientId: 1,
      patientName: 'John Smith',
      bedNumber: 'GA-01',
      activity: 'Wound Dressing Change',
      status: 'completed',
      scheduledTime: '10:00',
      completedTime: '10:15',
      notes: 'Wound healing well, no signs of infection',
      nurseId: currentUser?.id
    },
    {
      id: 2,
      patientId: 2,
      patientName: 'Sarah Johnson',
      bedNumber: 'ICU-05',
      activity: 'Catheter Care',
      status: 'pending',
      scheduledTime: '14:00',
      completedTime: null,
      notes: '',
      nurseId: currentUser?.id
    },
    {
      id: 3,
      patientId: 1,
      patientName: 'John Smith',
      bedNumber: 'GA-01',
      activity: 'Physical Therapy Assistance',
      status: 'in-progress',
      scheduledTime: '15:30',
      completedTime: null,
      notes: 'Patient responding well to exercises',
      nurseId: currentUser?.id
    }
  ]);

  // Fetch data on component mount
  useEffect(() => {
    if (currentUser?.role === 'nurse') {
      fetchPatients();
      fetchWards();
      fetchInventory();
      fetchMedicationSchedule();
    }
  }, [currentUser]);

  // Filter data
  const admittedPatients = patients.filter(patient => patient.status === 'admitted');
  const filteredPatients = admittedPatients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.bed_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.quantity <= item.min_stock);
  const criticalPatients = admittedPatients.filter(patient => 
    patient.ward_name?.toLowerCase().includes('icu') || 
    patient.ward_name?.toLowerCase().includes('critical')
  );

  // Calculate statistics
  const totalAdmittedPatients = admittedPatients.length;
  const pendingMedications = medicationSchedule.filter(med => !med.administered).length;
  const completedActivities = patientCareActivities.filter(activity => activity.status === 'completed').length;
  const pendingActivities = patientCareActivities.filter(activity => activity.status === 'pending').length;

  // Handle functions
  const handleAdministerMedication = (medicationId) => {
    dispatch({
      type: 'ADMINISTER_MEDICATION',
      payload: {
        id: medicationId,
        administeredBy: currentUser?.first_name + ' ' + currentUser?.last_name
      }
    });
  };

  const handleAddVitalSigns = (vitalData) => {
    const newVital = {
      id: vitalSigns.length + 1,
      ...vitalData,
      timestamp: new Date().toLocaleString(),
      recordedBy: currentUser?.first_name + ' ' + currentUser?.last_name
    };
    setVitalSigns([newVital, ...vitalSigns]);
    setShowVitalSignsModal(false);
    setSelectedPatient(null);
  };

  const handleAddNursingNote = (noteData) => {
    const newNote = {
      id: nursingNotes.length + 1,
      ...noteData,
      timestamp: new Date().toLocaleString(),
      nurseId: currentUser?.id,
      nurseName: currentUser?.first_name + ' ' + currentUser?.last_name
    };
    setNursingNotes([newNote, ...nursingNotes]);
    setShowNursingNotesModal(false);
    setSelectedPatient(null);
  };

  const handleCompleteActivity = (activityId) => {
    setPatientCareActivities(activities =>
      activities.map(activity =>
        activity.id === activityId
          ? {
              ...activity,
              status: 'completed',
              completedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          : activity
      )
    );
  };

  const handleUpdateBedStatus = async (bedId, newStatus, patientId = null) => {
    try {
      const updateData = { status: newStatus };
      if (patientId) updateData.patient = patientId;
      
      await updateBedStatus(bedId, updateData);
    } catch (error) {
      console.error('Error updating bed status:', error);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'patients', name: 'Patient Care', icon: Users },
    { id: 'medications', name: 'Medications', icon: Pill },
    { id: 'vitals', name: 'Vital Signs', icon: Heart },
    { id: 'wards', name: 'Ward Management', icon: Building },
    { id: 'inventory', name: 'Inventory', icon: Package },
    { id: 'notes', name: 'Nursing Notes', icon: FileText }
  ];

  const [loadingInventory, setLoadingInventory] = React.useState(false);
  const [errorInventory, setErrorInventory] = React.useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState(null);

  const handleSaveInventoryItem = async (itemData) => {
    setLoadingInventory(true);
    setErrorInventory(null);
    try {
      if (selectedInventoryItem) {
        // Update existing item
        await updateInventoryItem(selectedInventoryItem.id, itemData);
      } else {
        // Add new item
        await addInventoryItem(itemData);
      }
      await fetchInventory();
      setShowInventoryModal(false);
      setSelectedInventoryItem(null);
    } catch (error) {
      setErrorInventory(error.message || 'Failed to save inventory item');
    } finally {
      setLoadingInventory(false);
    }
  };

  const { api } = useApp();

  const handleDeleteInventoryItem = async (id) => {
    setLoadingInventory(true);
    setErrorInventory(null);
    try {
      await api.deleteInventoryItem(id);
      dispatch({ type: 'SET_INVENTORY', payload: inventory.filter(item => item.id !== id) });
      await fetchInventory();
      setItemToDelete(null);
      setShowDeleteConfirmModal(false);
    } catch (error) {
      setErrorInventory(error.message || 'Failed to delete inventory item');
    } finally {
      setLoadingInventory(false);
    }
  };

  const openDeleteConfirmModal = (item) => {
    setItemToDelete(item);
    setShowDeleteConfirmModal(true);
  };

  const closeDeleteConfirmModal = () => {
    setItemToDelete(null);
    setShowDeleteConfirmModal(false);
  };

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
          <h1 className="text-2xl font-semibold text-gray-900">Nurse Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Welcome back, Nurse {currentUser?.first_name} {currentUser?.last_name}
          </p>
          <p className="text-sm text-gray-500">
            {currentUser?.department} • {currentUser?.experience}
          </p>
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
                    ? 'border-green-500 text-green-600'
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
                    <Users className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Admitted Patients
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {totalAdmittedPatients}
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
                    <Pill className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Medications
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {pendingMedications}
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
                        Completed Activities
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {completedActivities}
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
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Low Stock Items
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {lowStockItems.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow-soft rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setShowVitalSignsModal(true)}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
              >
                <Heart className="h-8 w-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Record Vitals</span>
              </button>
              <button
                onClick={() => setShowMedicationModal(true)}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <Pill className="h-8 w-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Administer Meds</span>
              </button>
              <button
                onClick={() => setShowPatientCareModal(true)}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
              >
                <UserCheck className="h-8 w-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Patient Care</span>
              </button>
              <button
                onClick={() => setShowNursingNotesModal(true)}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 transition-colors"
              >
                <FileText className="h-8 w-8 text-yellow-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Add Notes</span>
              </button>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow-soft rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Pending Medications
                </h3>
                {medicationSchedule.filter(med => !med.administered).length === 0 ? (
                  <p className="text-gray-500">No pending medications.</p>
                ) : (
                  <div className="space-y-3">
                    {medicationSchedule.filter(med => !med.administered).slice(0, 5).map((medication) => (
                      <div key={medication.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                        <div className="flex items-center space-x-3">
                          <Pill className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{medication.time}</p>
                            <p className="text-sm text-gray-600">{medication.patientName} - {medication.bedNumber}</p>
                            <p className="text-xs text-gray-500">{medication.medication} ({medication.dosage})</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAdministerMedication(medication.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                        >
                          Administer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white shadow-soft rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Pending Care Activities
                </h3>
                {pendingActivities === 0 ? (
                  <p className="text-gray-500">No pending activities.</p>
                ) : (
                  <div className="space-y-3">
                    {patientCareActivities.filter(activity => activity.status === 'pending').map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-md">
                        <div className="flex items-center space-x-3">
                          <UserCheck className="h-5 w-5 text-purple-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{activity.scheduledTime}</p>
                            <p className="text-sm text-gray-600">{activity.patientName} - {activity.bedNumber}</p>
                            <p className="text-xs text-gray-500">{activity.activity}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCompleteActivity(activity.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200"
                        >
                          Complete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Critical Alerts */}
          {(lowStockItems.length > 0 || criticalPatients.length > 0) && (
            <div className="space-y-4">
              {lowStockItems.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Low Stock Alert
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{lowStockItems.length} items are running low on stock and need restocking.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {criticalPatients.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <Monitor className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Critical Care Patients
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>{criticalPatients.length} patients in critical care units require close monitoring.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Patient Care Tab */}
      {activeTab === 'patients' && (
        <div className="space-y-6 animate-fade-in">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search patients by name or bed number..."
              />
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => setShowPatientCareModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Care Activity
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => (
              <div key={patient.id} className="bg-white shadow-soft rounded-lg p-6 card-hover">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">{patient.name}</h3>
                      <p className="text-sm text-gray-500">Bed: {patient.bed_number}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    patient.ward_name?.toLowerCase().includes('icu') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {patient.ward_name}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Age:</span>
                    <span className="text-gray-900">{patient.age} years</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Blood Type:</span>
                    <span className="text-gray-900">{patient.blood_type || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Allergies:</span>
                    <span className="text-gray-900">{patient.allergies || 'None'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Doctor:</span>
                    <span className="text-gray-900">{patient.assigned_doctor_name || 'Unassigned'}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedPatient(patient);
                      setShowVitalSignsModal(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                  >
                    <Heart className="h-3 w-3 mr-1" />
                    Vitals
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPatient(patient);
                      setShowNursingNotesModal(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Notes
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPatient(patient);
                      setShowPatientCareModal(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200"
                  >
                    <UserCheck className="h-3 w-3 mr-1" />
                    Care
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medications Tab */}
      {activeTab === 'medications' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white shadow-soft rounded-lg">
            <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Medication Schedule
              </h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {medicationSchedule.map((medication) => (
                <li key={medication.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          medication.administered ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          <Pill className={`h-5 w-5 ${
                            medication.administered ? 'text-green-600' : 'text-blue-600'
                          }`} />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {medication.patientName} - {medication.bedNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {medication.medication} ({medication.dosage}) at {medication.time}
                        </div>
                        {medication.administered && (
                          <div className="text-xs text-green-600">
                            Administered by {medication.administeredBy} at {medication.administeredAt}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        medication.administered ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {medication.administered ? 'Administered' : 'Pending'}
                      </span>
                      {!medication.administered && (
                        <button
                          onClick={() => handleAdministerMedication(medication.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Administer
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

      {/* Vital Signs Tab */}
      {activeTab === 'vitals' && (
        <div className="space-y-6 animate-fade-in">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Vital Signs Records
              </h3>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => setShowVitalSignsModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Record Vital Signs
              </button>
            </div>
          </div>

          <div className="bg-white shadow-soft overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {vitalSigns.map((vital) => (
                <li key={vital.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900">
                          {vital.patientName} - {vital.bedNumber}
                        </div>
                        <div className="text-sm text-gray-500">{vital.timestamp}</div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="flex items-center">
                          <Thermometer className="h-4 w-4 text-red-500 mr-2" />
                          <span className="text-sm text-gray-600">Temp: {vital.temperature}</span>
                        </div>
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 text-red-500 mr-2" />
                          <span className="text-sm text-gray-600">HR: {vital.heartRate}</span>
                        </div>
                        <div className="flex items-center">
                          <Monitor className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm text-gray-600">BP: {vital.bloodPressure}</span>
                        </div>
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-600">RR: {vital.respiratoryRate}</span>
                        </div>
                        <div className="flex items-center">
                          <Droplets className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm text-gray-600">O2: {vital.oxygenSaturation}</span>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Recorded by: {vital.recordedBy}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Ward Management Tab */}
      {activeTab === 'wards' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wards.map((ward) => (
              <div key={ward.id} className="bg-white shadow-soft rounded-lg p-6 card-hover">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Building className="h-6 w-6 text-green-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">{ward.name}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedWard(ward)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">{ward.department}</p>
                  <p className="text-sm text-gray-600">Floor: {ward.floor}</p>
                  <p className="text-sm text-gray-600">
                    Beds: {ward.occupied_beds || 0}/{ward.total_beds}
                  </p>
                  <p className="text-sm text-gray-600">
                    Nurse in Charge: {ward.nurse_in_charge}
                  </p>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Occupancy</span>
                    <span>{ward.occupancy_percentage || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        (ward.occupancy_percentage || 0) > 80 ? 'bg-red-600' :
                        (ward.occupancy_percentage || 0) > 60 ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${ward.occupancy_percentage || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Bed Layout Preview */}
                {ward.beds && ward.beds.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Bed Status</h4>
                    <div className="grid grid-cols-5 gap-1">
                      {ward.beds.slice(0, 10).map((bed) => (
                        <div
                          key={bed.id}
                          className={`w-8 h-8 rounded text-xs flex items-center justify-center font-medium ${
                            bed.status === 'occupied' ? 'bg-red-200 text-red-800' :
                            bed.status === 'available' ? 'bg-green-200 text-green-800' :
                            bed.status === 'maintenance' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-blue-200 text-blue-800'
                          }`}
                          title={`${bed.number} - ${bed.status}${bed.patient_name ? ` (${bed.patient_name})` : ''}`}
                        >
                          {bed.number.split('-')[1]}
                        </div>
                      ))}
                      {ward.beds.length > 10 && (
                        <div className="w-8 h-8 rounded bg-gray-200 text-gray-600 text-xs flex items-center justify-center">
                          +{ward.beds.length - 10}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Ward Details Modal */}
          {selectedWard && (
            <WardDetailsModal
              ward={selectedWard}
              onClose={() => setSelectedWard(null)}
              onUpdateBedStatus={handleUpdateBedStatus}
              patients={patients}
            />
          )}
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <>
          <div className="space-y-6 animate-fade-in">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div className="sm:flex-auto">
                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search inventory items..."
                />
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-4 sm:flex-none">
              <button
                type="button"
                onClick={() => {
                  setSelectedInventoryItem(null);
                  setShowInventoryModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Inventory Item
              </button>
              </div>
            </div>

            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Low Stock Alert
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{lowStockItems.length} items are running low on stock.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white shadow-soft overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {inventory.filter(item =>
                  item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.category?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((item) => (
                  <li key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.location}</div>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-600">
                            Category: {item.category} • Unit: {item.unit}
                          </p>
                          <p className="text-sm text-gray-600">
                            Supplier: {item.supplier} • Expires: {new Date(item.expiry_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {item.quantity} {item.unit}
                          </div>
                          <div className={`text-xs ${
                            item.quantity <= item.min_stock ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            Min: {item.min_stock}
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.quantity <= item.min_stock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {item.quantity <= item.min_stock ? 'Low Stock' : 'In Stock'}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedInventoryItem(item);
                            setShowInventoryModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Inventory Item"
                        >
                          <Edit3 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirmModal(item)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Inventory Item"
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

      {showInventoryModal && (
        <InventoryModal
          isOpen={showInventoryModal}
          onClose={() => setShowInventoryModal(false)}
          onSave={handleSaveInventoryItem}
          initialData={selectedInventoryItem}
        />
      )}

      {showDeleteConfirmModal && itemToDelete && (
        <Modal
          isOpen={showDeleteConfirmModal}
          onClose={closeDeleteConfirmModal}
          title="Confirm Delete"
          size="sm"
        >
      <div className="space-y-4">
        <p>Are you sure you want to delete the inventory item <strong>{itemToDelete.name}</strong>?</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={closeDeleteConfirmModal}
            className="btn-secondary"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleDeleteInventoryItem(itemToDelete.id);
            }}
            className="btn-danger"
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
        </Modal>
      )}
        </>
      )}

      {/* Nursing Notes Tab */}
      {activeTab === 'notes' && (
        <div className="space-y-6 animate-fade-in">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Nursing Notes
              </h3>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => setShowNursingNotesModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </button>
            </div>
          </div>

          <div className="bg-white shadow-soft overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {nursingNotes.map((note) => (
                <li key={note.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900">
                          {note.patientName} - {note.bedNumber}
                        </div>
                        <div className="text-sm text-gray-500">{note.timestamp}</div>
                      </div>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          note.category === 'Critical Care' ? 'bg-red-100 text-red-800' :
                          note.category === 'General Care' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {note.category}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-700">{note.note}</p>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        By: {note.nurseName}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Modals */}
      <VitalSignsModal
        isOpen={showVitalSignsModal}
        onClose={() => {
          setShowVitalSignsModal(false);
          setSelectedPatient(null);
        }}
        onSave={handleAddVitalSigns}
        patient={selectedPatient}
        patients={admittedPatients}
      />

      <NursingNotesModal
        isOpen={showNursingNotesModal}
        onClose={() => {
          setShowNursingNotesModal(false);
          setSelectedPatient(null);
        }}
        onSave={handleAddNursingNote}
        patient={selectedPatient}
        patients={admittedPatients}
      />

      <PatientCareModal
        isOpen={showPatientCareModal}
        onClose={() => {
          setShowPatientCareModal(false);
          setSelectedPatient(null);
        }}
        onSave={(careData) => {
          const newActivity = {
            id: patientCareActivities.length + 1,
            ...careData,
            status: 'pending',
            completedTime: null,
            nurseId: currentUser?.id
          };
          setPatientCareActivities([...patientCareActivities, newActivity]);
          setShowPatientCareModal(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
        patients={admittedPatients}
      />
    </div>
  );
}

// Vital Signs Modal Component
function VitalSignsModal({ isOpen, onClose, onSave, patient, patients }) {
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    bedNumber: '',
    temperature: '',
    bloodPressure: '',
    heartRate: '',
    respiratoryRate: '',
    oxygenSaturation: ''
  });

  React.useEffect(() => {
    if (patient) {
      setFormData({
        patientId: patient.id,
        patientName: patient.name,
        bedNumber: patient.bed_number || '',
        temperature: '',
        bloodPressure: '',
        heartRate: '',
        respiratoryRate: '',
        oxygenSaturation: ''
      });
    } else {
      setFormData({
        patientId: '',
        patientName: '',
        bedNumber: '',
        temperature: '',
        bloodPressure: '',
        heartRate: '',
        respiratoryRate: '',
        oxygenSaturation: ''
      });
    }
  }, [patient]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      patientId: '',
      patientName: '',
      bedNumber: '',
      temperature: '',
      bloodPressure: '',
      heartRate: '',
      respiratoryRate: '',
      oxygenSaturation: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePatientSelect = (e) => {
    const selectedPatient = patients.find(p => p.id === parseInt(e.target.value));
    if (selectedPatient) {
      setFormData({
        ...formData,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        bedNumber: selectedPatient.bed_number || ''
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Vital Signs"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!patient && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Patient</label>
            <select
              required
              value={formData.patientId}
              onChange={handlePatientSelect}
              className="form-input mt-1 block w-full"
            >
              <option value="">Select Patient</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.bed_number}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <Thermometer className="inline h-4 w-4 mr-1" />
              Temperature (°F)
            </label>
            <input
              type="text"
              name="temperature"
              required
              value={formData.temperature}
              onChange={handleChange}
              placeholder="98.6"
              className="form-input mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <Heart className="inline h-4 w-4 mr-1" />
              Heart Rate (bpm)
            </label>
            <input
              type="text"
              name="heartRate"
              required
              value={formData.heartRate}
              onChange={handleChange}
              placeholder="72"
              className="form-input mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <Monitor className="inline h-4 w-4 mr-1" />
              Blood Pressure
            </label>
            <input
              type="text"
              name="bloodPressure"
              required
              value={formData.bloodPressure}
              onChange={handleChange}
              placeholder="120/80"
              className="form-input mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <Activity className="inline h-4 w-4 mr-1" />
              Respiratory Rate (/min)
            </label>
            <input
              type="text"
              name="respiratoryRate"
              required
              value={formData.respiratoryRate}
              onChange={handleChange}
              placeholder="16"
              className="form-input mt-1 block w-full"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              <Droplets className="inline h-4 w-4 mr-1" />
              Oxygen Saturation (%)
            </label>
            <input
              type="text"
              name="oxygenSaturation"
              required
              value={formData.oxygenSaturation}
              onChange={handleChange}
              placeholder="98"
              className="form-input mt-1 block w-full"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-success">
            Record Vital Signs
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Nursing Notes Modal Component
function NursingNotesModal({ isOpen, onClose, onSave, patient, patients }) {
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    bedNumber: '',
    note: '',
    category: 'General Care'
  });

  React.useEffect(() => {
    if (patient) {
      setFormData({
        patientId: patient.id,
        patientName: patient.name,
        bedNumber: patient.bed_number || '',
        note: '',
        category: 'General Care'
      });
    } else {
      setFormData({
        patientId: '',
        patientName: '',
        bedNumber: '',
        note: '',
        category: 'General Care'
      });
    }
  }, [patient]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      patientId: '',
      patientName: '',
      bedNumber: '',
      note: '',
      category: 'General Care'
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePatientSelect = (e) => {
    const selectedPatient = patients.find(p => p.id === parseInt(e.target.value));
    if (selectedPatient) {
      setFormData({
        ...formData,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        bedNumber: selectedPatient.bed_number || ''
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Nursing Note"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!patient && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Patient</label>
            <select
              required
              value={formData.patientId}
              onChange={handlePatientSelect}
              className="form-input mt-1 block w-full"
            >
              <option value="">Select Patient</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.bed_number}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
          >
            <option value="General Care">General Care</option>
            <option value="Critical Care">Critical Care</option>
            <option value="Medication">Medication</option>
            <option value="Wound Care">Wound Care</option>
            <option value="Mobility">Mobility</option>
            <option value="Nutrition">Nutrition</option>
            <option value="Hygiene">Hygiene</option>
            <option value="Mental Health">Mental Health</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nursing Note</label>
          <textarea
            name="note"
            rows={4}
            required
            value={formData.note}
            onChange={handleChange}
            placeholder="Enter detailed nursing observations and care notes..."
            className="form-input mt-1 block w-full"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-success">
            Add Note
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Patient Care Modal Component
function PatientCareModal({ isOpen, onClose, onSave, patient, patients }) {
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    bedNumber: '',
    activity: '',
    scheduledTime: '',
    notes: ''
  });

  React.useEffect(() => {
    if (patient) {
      setFormData({
        patientId: patient.id,
        patientName: patient.name,
        bedNumber: patient.bed_number || '',
        activity: '',
        scheduledTime: '',
        notes: ''
      });
    } else {
      setFormData({
        patientId: '',
        patientName: '',
        bedNumber: '',
        activity: '',
        scheduledTime: '',
        notes: ''
      });
    }
  }, [patient]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      patientId: '',
      patientName: '',
      bedNumber: '',
      activity: '',
      scheduledTime: '',
      notes: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePatientSelect = (e) => {
    const selectedPatient = patients.find(p => p.id === parseInt(e.target.value));
    if (selectedPatient) {
      setFormData({
        ...formData,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        bedNumber: selectedPatient.bed_number || ''
      });
    }
  };

  const careActivities = [
    'Wound Dressing Change',
    'Catheter Care',
    'Physical Therapy Assistance',
    'Medication Administration',
    'Vital Signs Check',
    'Patient Hygiene',
    'Mobility Assistance',
    'Nutrition Support',
    'Pain Assessment',
    'Discharge Preparation',
    'Family Education',
    'Other'
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Patient Care Activity"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!patient && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Patient</label>
            <select
              required
              value={formData.patientId}
              onChange={handlePatientSelect}
              className="form-input mt-1 block w-full"
            >
              <option value="">Select Patient</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.bed_number}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Care Activity</label>
            <select
              name="activity"
              required
              value={formData.activity}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            >
              <option value="">Select Activity</option>
              {careActivities.map(activity => (
                <option key={activity} value={activity}>
                  {activity}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Scheduled Time</label>
            <input
              type="time"
              name="scheduledTime"
              required
              value={formData.scheduledTime}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional notes or special instructions..."
            className="form-input mt-1 block w-full"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-success">
            Schedule Activity
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Ward Details Modal Component
function WardDetailsModal({ ward, onClose, onUpdateBedStatus, patients }) {
  const [selectedBed, setSelectedBed] = useState(null);
  const [showBedModal, setShowBedModal] = useState(false);

  const handleBedClick = (bed) => {
    setSelectedBed(bed);
    setShowBedModal(true);
  };

  const handleBedStatusUpdate = async (bedId, newStatus, patientId = null) => {
    await onUpdateBedStatus(bedId, newStatus, patientId);
    setShowBedModal(false);
    setSelectedBed(null);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`${ward.name} - Bed Management`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Ward Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Department:</span>
              <p className="text-gray-900">{ward.department}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Floor:</span>
              <p className="text-gray-900">{ward.floor}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Total Beds:</span>
              <p className="text-gray-900">{ward.total_beds}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Occupancy:</span>
              <p className="text-gray-900">{ward.occupancy_percentage}%</p>
            </div>
          </div>
        </div>

        {/* Bed Layout */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Bed Layout</h4>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {ward.beds?.map((bed) => (
              <button
                key={bed.id}
                onClick={() => handleBedClick(bed)}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all hover:scale-105 ${
                  bed.status === 'occupied' ? 'bg-red-100 border-red-300 text-red-800' :
                  bed.status === 'available' ? 'bg-green-100 border-green-300 text-green-800' :
                  bed.status === 'maintenance' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' :
                  'bg-blue-100 border-blue-300 text-blue-800'
                }`}
                title={`${bed.number} - ${bed.status}${bed.patient_name ? ` (${bed.patient_name})` : ''}`}
              >
                <div>{bed.number}</div>
                {bed.patient_name && (
                  <div className="text-xs mt-1 truncate">{bed.patient_name}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-200 rounded mr-2"></div>
            <span>Available ({ward.beds?.filter(b => b.status === 'available').length || 0})</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-200 rounded mr-2"></div>
            <span>Occupied ({ward.beds?.filter(b => b.status === 'occupied').length || 0})</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-200 rounded mr-2"></div>
            <span>Maintenance ({ward.beds?.filter(b => b.status === 'maintenance').length || 0})</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-200 rounded mr-2"></div>
            <span>Cleaning ({ward.beds?.filter(b => b.status === 'cleaning').length || 0})</span>
          </div>
        </div>
      </div>

      {/* Bed Management Modal */}
      {showBedModal && selectedBed && (
        <BedManagementModal
          bed={selectedBed}
          patients={patients}
          onClose={() => {
            setShowBedModal(false);
            setSelectedBed(null);
          }}
          onUpdateStatus={handleBedStatusUpdate}
        />
      )}
    </Modal>
  );
}

// Bed Management Modal Component
function BedManagementModal({ bed, patients, onClose, onUpdateStatus }) {
  const [newStatus, setNewStatus] = useState(bed.status);
  const [selectedPatient, setSelectedPatient] = useState(bed.patient?.id || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateStatus(bed.id, newStatus, selectedPatient || null);
  };

  const availablePatients = patients.filter(p => p.status === 'outpatient' || !p.bed_number);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Manage Bed ${bed.number}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
          <p className="text-sm text-gray-600">
            Status: <span className="font-medium">{bed.status}</span>
          </p>
          {bed.patient_name && (
            <p className="text-sm text-gray-600">
              Patient: <span className="font-medium">{bed.patient_name}</span>
            </p>
          )}
          {bed.admission_date && (
            <p className="text-sm text-gray-600">
              Admitted: <span className="font-medium">{new Date(bed.admission_date).toLocaleDateString()}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">New Status</label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="form-input mt-1 block w-full"
          >
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
            <option value="cleaning">Cleaning</option>
          </select>
        </div>

        {newStatus === 'occupied' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Assign Patient</label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="form-input mt-1 block w-full"
              required
            >
              <option value="">Select Patient</option>
              {availablePatients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.phone}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-success">
            Update Bed Status
          </button>
        </div>
      </form>
    </Modal>
  );
}