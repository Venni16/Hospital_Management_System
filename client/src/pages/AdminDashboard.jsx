import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { 
  Users, Calendar, DollarSign, Package, Plus, Edit3, Trash2, 
  Eye, TrendingUp, Activity, UserPlus, Settings, BarChart3,
  Shield, Stethoscope, Building, AlertTriangle, Key, User
} from 'lucide-react';

export default function AdminDashboard() {
  const { 
    patients, appointments, bills, staff, wards, inventory,
    currentUser, loading, error, clearError,
    fetchPatients, fetchStaff, fetchWards, fetchAppointments, fetchBills, fetchInventory,
    addPatient, updatePatient, deletePatient,
    addWard, updateWard, deleteWard,
    addStaff, updateStaff, deleteStaff
  } = useApp();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchPatients();
      fetchStaff();
      fetchWards();
      fetchAppointments();
      fetchBills();
      fetchInventory();
    }
  }, [currentUser]);

  // Filter data based on search
  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStaff = staff.filter(member =>
    member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWards = wards.filter(ward =>
    ward.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ward.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const totalRevenue = bills.reduce((sum, bill) => {
    const amount = Number(bill.paid_amount) || 0;
    return sum + amount;
  }, 0);
  const pendingBills = bills.filter(bill => bill.status === 'pending' || bill.status === 'partial');
  const lowStockItems = inventory.filter(item => item.quantity <= item.min_stock);
  const todayAppointments = appointments.filter(apt => apt.date === new Date().toISOString().split('T')[0]);

  const handleAddPatient = async (patientData) => {
    try {
      await addPatient(patientData);
      setShowPatientModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error adding patient:', error);
    }
  };

  const handleUpdatePatient = async (patientData) => {
    try {
      await updatePatient(editingItem.id, patientData);
      setShowPatientModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating patient:', error);
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await deletePatient(patientId);
      } catch (error) {
        console.error('Error deleting patient:', error);
      }
    }
  };

  const handleAddStaff = async (staffData) => {
    try {
      await addStaff(staffData);
      setShowStaffModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error adding staff:', error);
    }
  };

  const handleUpdateStaff = async (staffData) => {
    try {
      await updateStaff(editingItem.id, staffData);
      setShowStaffModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating staff:', error);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await deleteStaff(staffId);
      } catch (error) {
        console.error('Error deleting staff:', error);
      }
    }
  };

  const handleAddWard = async (wardData) => {
    try {
      await addWard(wardData);
      setShowWardModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error adding ward:', error);
    }
  };

  const handleUpdateWard = async (wardData) => {
    try {
      await updateWard(editingItem.id, wardData);
      setShowWardModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating ward:', error);
    }
  };

  const handleDeleteWard = async (wardId) => {
    if (window.confirm('Are you sure you want to delete this ward?')) {
      try {
        await deleteWard(wardId);
      } catch (error) {
        console.error('Error deleting ward:', error);
      }
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'patients', name: 'Patients', icon: Users },
    { id: 'staff', name: 'Staff Management', icon: UserPlus },
    { id: 'wards', name: 'Ward Management', icon: Building },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 }
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
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Welcome back, {currentUser?.first_name} {currentUser?.last_name}
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
                    ? 'border-purple-500 text-purple-600'
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
                        Total Patients
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {patients.length}
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
                    <UserPlus className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Staff Members
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {staff.length}
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
                    <DollarSign className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Revenue
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ${totalRevenue.toLocaleString()}
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
                    <Building className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Wards
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {wards.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {(lowStockItems.length > 0 || pendingBills.length > 0) && (
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
                        <p>{lowStockItems.length} items are running low on stock.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {pendingBills.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Pending Payments
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>{pendingBills.length} bills are pending payment.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow-soft rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Today's Activity
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Appointments</span>
                    <span className="text-sm font-medium text-gray-900">{todayAppointments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Admitted Patients</span>
                    <span className="text-sm font-medium text-gray-900">
                      {patients.filter(p => p.status === 'admitted').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Available Beds</span>
                    <span className="text-sm font-medium text-gray-900">
                      {wards.reduce((sum, ward) => sum + (ward.available_beds || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-soft rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Staff Distribution
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Doctors</span>
                    <span className="text-sm font-medium text-gray-900">
                      {staff.filter(s => s.role === 'doctor').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Nurses</span>
                    <span className="text-sm font-medium text-gray-900">
                      {staff.filter(s => s.role === 'nurse').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Receptionists</span>
                    <span className="text-sm font-medium text-gray-900">
                      {staff.filter(s => s.role === 'receptionist').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
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
                placeholder="Search patients..."
              />
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowPatientModal(true);
                }}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Patient
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
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                        <div className="text-sm text-gray-500">
                          {patient.age} years • {patient.gender} • {patient.phone}
                        </div>
                        <div className="text-sm text-gray-500">{patient.email}</div>
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
                          setEditingItem(patient);
                          setShowPatientModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePatient(patient.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="space-y-6 animate-fade-in">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search staff..."
              />
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowStaffModal(true);
                }}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </button>
            </div>
          </div>

          <div className="bg-white shadow-soft overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredStaff.map((member) => (
                <li key={member.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          member.role === 'doctor' ? 'bg-blue-100' :
                          member.role === 'nurse' ? 'bg-green-100' :
                          member.role === 'receptionist' ? 'bg-yellow-100' :
                          'bg-purple-100'
                        }`}>
                          {member.role === 'doctor' ? (
                            <Stethoscope className={`h-5 w-5 ${
                              member.role === 'doctor' ? 'text-blue-600' :
                              member.role === 'nurse' ? 'text-green-600' :
                              member.role === 'receptionist' ? 'text-yellow-600' :
                              'text-purple-600'
                            }`} />
                          ) : (
                            <UserPlus className={`h-5 w-5 ${
                              member.role === 'doctor' ? 'text-blue-600' :
                              member.role === 'nurse' ? 'text-green-600' :
                              member.role === 'receptionist' ? 'text-yellow-600' :
                              'text-purple-600'
                            }`} />
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{member.username} • {member.role} • {member.department}
                        </div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        member.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                        member.role === 'nurse' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {member.role}
                      </span>
                      <button
                        onClick={() => {
                          setEditingItem(member);
                          setShowStaffModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(member.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Wards Tab */}
      {activeTab === 'wards' && (
        <div className="space-y-6 animate-fade-in">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search wards..."
              />
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowWardModal(true);
                }}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Ward
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWards.map((ward) => (
              <div key={ward.id} className="bg-white shadow-soft rounded-lg p-6 card-hover">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Building className="h-6 w-6 text-purple-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">{ward.name}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingItem(ward);
                        setShowWardModal(true);
                      }}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteWard(ward.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{ward.department}</p>
                  <p className="text-sm text-gray-600">Floor: {ward.floor}</p>
                  <p className="text-sm text-gray-600">
                    Beds: {ward.occupied_beds || 0}/{ward.total_beds}
                  </p>
                  <p className="text-sm text-gray-600">
                    Nurse in Charge: {ward.nurse_in_charge}
                  </p>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Occupancy</span>
                      <span>{ward.occupancy_percentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${ward.occupancy_percentage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow-soft rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <span className="text-lg font-semibold text-green-600">
                    ${totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending Amount</span>
                  <span className="text-lg font-semibold text-yellow-600">
                    ${pendingBills.reduce((sum, bill) => sum + (bill.total_amount - bill.paid_amount), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Bills</span>
                  <span className="text-lg font-semibold text-gray-900">{bills.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-soft rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Patients</span>
                  <span className="text-lg font-semibold text-blue-600">{patients.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Admitted</span>
                  <span className="text-lg font-semibold text-green-600">
                    {patients.filter(p => p.status === 'admitted').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Outpatients</span>
                  <span className="text-lg font-semibold text-yellow-600">
                    {patients.filter(p => p.status === 'outpatient').length}
                  </span>
                </div>
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
          setEditingItem(null);
        }}
        onSave={editingItem ? handleUpdatePatient : handleAddPatient}
        patient={editingItem}
        staff={staff.filter(s => s.role === 'doctor')}
      />

      <StaffModal
        isOpen={showStaffModal}
        onClose={() => {
          setShowStaffModal(false);
          setEditingItem(null);
        }}
        onSave={editingItem ? handleUpdateStaff : handleAddStaff}
        staff={editingItem}
      />

      <WardModal
        isOpen={showWardModal}
        onClose={() => {
          setShowWardModal(false);
          setEditingItem(null);
        }}
        onSave={editingItem ? handleUpdateWard : handleAddWard}
        ward={editingItem}
      />
    </div>
  );
}

// Patient Modal Component
function PatientModal({ isOpen, onClose, onSave, patient, staff }) {
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
    status: 'outpatient'
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
        status: patient.status || 'outpatient'
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
        status: 'outpatient'
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
      title={patient ? 'Edit Patient' : 'Add New Patient'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
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
            <label className="block text-sm font-medium text-gray-700">Age</label>
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
            <label className="block text-sm font-medium text-gray-700">Gender</label>
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
            <label className="block text-sm font-medium text-gray-700">Phone</label>
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
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            />
          </div>
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Assigned Doctor</label>
          <select
            name="assigned_doctor"
            value={formData.assigned_doctor}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
          >
            <option value="">Select Doctor</option>
            {staff.map(doctor => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.first_name} {doctor.last_name} - {doctor.department}
              </option>
            ))}
          </select>
        </div>
        
        <div>
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
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Allergies</label>
          <input
            type="text"
            name="allergies"
            value={formData.allergies}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {patient ? 'Update' : 'Add'} Patient
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Enhanced Staff Modal Component with Manual Credentials
function StaffModal({ isOpen, onClose, onSave, staff }) {
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: '',
    department: '',
    phone: '',
    specialization: '',
    experience: '',
    status: 'active'
  });

  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (staff) {
      setFormData({
        username: staff.username || '',
        first_name: staff.first_name || '',
        last_name: staff.last_name || '',
        email: staff.email || '',
        password: '', // Don't populate password for editing
        role: staff.role || '',
        department: staff.department || '',
        phone: staff.phone || '',
        specialization: staff.specialization || '',
        experience: staff.experience || '',
        status: staff.status || 'active'
      });
    } else {
      setFormData({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: '',
        department: '',
        phone: '',
        specialization: '',
        experience: '',
        status: 'active'
      });
    }
  }, [staff]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (staff && !submitData.password) {
      delete submitData.password; // Don't send empty password for updates
    }
    onSave(submitData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generateUsername = () => {
    if (formData.first_name && formData.last_name && formData.role) {
      const username = `${formData.first_name.toLowerCase()}.${formData.last_name.toLowerCase()}.${formData.role}`;
      setFormData({
        ...formData,
        username: username
      });
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({
      ...formData,
      password: password
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={staff ? 'Edit Staff Member' : 'Add New Staff Member'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Credentials Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Key className="h-5 w-5 text-blue-600 mr-2" />
            <h4 className="text-lg font-medium text-blue-900">Login Credentials</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="form-input flex-1 block w-full rounded-none rounded-l-md"
                  placeholder="e.g., john.doe.doctor"
                />
                <button
                  type="button"
                  onClick={generateUsername}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100"
                  title="Auto-generate username"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                This will be used to login to the system
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
                {staff && <span className="text-gray-500 font-normal">(leave blank to keep current)</span>}
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required={!staff}
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input flex-1 block w-full rounded-none rounded-l-md"
                  placeholder={staff ? "Leave blank to keep current" : "Enter secure password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm hover:bg-gray-100"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100"
                  title="Generate random password"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Minimum 8 characters recommended
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Personal Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
              />
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Professional Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="receptionist">Receptionist</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="department"
                required
                value={formData.department}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
                placeholder="e.g., Cardiology, Emergency, Administration"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Specialization</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
                placeholder="e.g., Cardiologist, Emergency Care"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Experience</label>
              <input
                type="text"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                className="form-input mt-1 block w-full"
                placeholder="e.g., 5 years, 10+ years"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="form-input mt-1 block w-full max-w-xs"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            <UserPlus className="h-4 w-4 mr-2" />
            {staff ? 'Update' : 'Create'} Staff Member
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Ward Modal Component
function WardModal({ isOpen, onClose, onSave, ward }) {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    floor: '',
    total_beds: '',
    nurse_in_charge: '',
    description: ''
  });

  React.useEffect(() => {
    if (ward) {
      setFormData({
        name: ward.name || '',
        department: ward.department || '',
        floor: ward.floor || '',
        total_beds: ward.total_beds || '',
        nurse_in_charge: ward.nurse_in_charge || '',
        description: ward.description || ''
      });
    } else {
      setFormData({
        name: '',
        department: '',
        floor: '',
        total_beds: '',
        nurse_in_charge: '',
        description: ''
      });
    }
  }, [ward]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      floor: parseInt(formData.floor),
      total_beds: parseInt(formData.total_beds)
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
      title={ward ? 'Edit Ward' : 'Add New Ward'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Ward Name</label>
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
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <input
              type="text"
              name="department"
              required
              value={formData.department}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Floor</label>
            <input
              type="number"
              name="floor"
              required
              value={formData.floor}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Beds</label>
            <input
              type="number"
              name="total_beds"
              required
              value={formData.total_beds}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Nurse in Charge</label>
          <input
            type="text"
            name="nurse_in_charge"
            required
            value={formData.nurse_in_charge}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
            placeholder="Ward description and specialization..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {ward ? 'Update' : 'Add'} Ward
          </button>
        </div>
      </form>
    </Modal>
  );
}