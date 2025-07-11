import React, { createContext, useContext, useReducer, useEffect } from 'react';
import ApiService from '../services/api';

const AppContext = createContext();

// Initial state
const initialState = {
  currentUser: null,
  isAuthenticated: false,
  patients: [],
  staff: [],
  wards: [],
  appointments: [],
  medicalRecords: [],
  prescriptions: [],
  labTests: [],
  inventory: [],
  bills: [],
  medicationSchedule: [],
  loading: false,
  error: null
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        currentUser: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    
    case 'LOGOUT':
      return {
        ...initialState
      };
    
    case 'SET_PATIENTS':
      return { ...state, patients: action.payload };
    
    case 'ADD_PATIENT':
      return { ...state, patients: [...state.patients, action.payload] };
    
    case 'UPDATE_PATIENT':
      return {
        ...state,
        patients: state.patients.map(patient =>
          patient.id === action.payload.id ? action.payload : patient
        )
      };
    
    case 'DELETE_PATIENT':
      return {
        ...state,
        patients: state.patients.filter(patient => patient.id !== action.payload)
      };
    
    case 'SET_WARDS':
      return { ...state, wards: action.payload };
    
    case 'ADD_WARD':
      return { ...state, wards: [...state.wards, action.payload] };
    
    case 'UPDATE_WARD':
      return {
        ...state,
        wards: state.wards.map(ward =>
          ward.id === action.payload.id ? action.payload : ward
        )
      };
    
    case 'DELETE_WARD':
      return {
        ...state,
        wards: state.wards.filter(ward => ward.id !== action.payload)
      };
    
    case 'UPDATE_BED_STATUS':
      return {
        ...state,
        wards: state.wards.map(ward => {
          if (ward.id === action.payload.wardId) {
            return {
              ...ward,
              beds: ward.beds?.map(bed =>
                bed.id === action.payload.bedId
                  ? { ...bed, ...action.payload.bedData }
                  : bed
              ) || []
            };
          }
          return ward;
        })
      };
    
    case 'SET_APPOINTMENTS':
      return { ...state, appointments: action.payload };
    
    case 'ADD_APPOINTMENT':
      return { ...state, appointments: [...state.appointments, action.payload] };
    
    case 'UPDATE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.map(appointment =>
          appointment.id === action.payload.id ? action.payload : appointment
        )
      };
    
    case 'SET_MEDICAL_RECORDS':
      return { ...state, medicalRecords: action.payload };
    
    case 'ADD_MEDICAL_RECORD':
      return { ...state, medicalRecords: [...state.medicalRecords, action.payload] };
    
    case 'SET_PRESCRIPTIONS':
      return { ...state, prescriptions: action.payload };
    
    case 'ADD_PRESCRIPTION':
      return { ...state, prescriptions: [...state.prescriptions, action.payload] };
    
    case 'SET_LAB_TESTS':
      return { ...state, labTests: action.payload };
    
    case 'ADD_LAB_TEST':
      return { ...state, labTests: [...state.labTests, action.payload] };
    
    case 'UPDATE_LAB_TEST':
      return {
        ...state,
        labTests: state.labTests.map(test =>
          test.id === action.payload.id ? action.payload : test
        )
      };
    
    case 'SET_INVENTORY':
      return { ...state, inventory: action.payload };
    
    case 'ADD_INVENTORY':
      return { ...state, inventory: [...state.inventory, action.payload] };
    
    case 'UPDATE_INVENTORY':
      return {
        ...state,
        inventory: state.inventory.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };
    
    case 'SET_BILLS':
      return { ...state, bills: action.payload };
    
    case 'ADD_BILL':
      return { ...state, bills: [...state.bills, action.payload] };
    
    case 'UPDATE_BILL':
      return {
        ...state,
        bills: state.bills.map(bill =>
          bill.id === action.payload.id ? action.payload : bill
        )
      };
    
    case 'SET_STAFF':
      return { ...state, staff: action.payload };
    
    case 'ADD_STAFF':
      return { ...state, staff: [...state.staff, action.payload] };
    
    case 'UPDATE_STAFF':
      return {
        ...state,
        staff: state.staff.map(member =>
          member.id === action.payload.id ? action.payload : member
        )
      };
    
    case 'DELETE_STAFF':
      return {
        ...state,
        staff: state.staff.filter(member => member.id !== action.payload)
      };

    case 'SET_MEDICATION_SCHEDULE':
      return { ...state, medicationSchedule: action.payload };

    case 'ADMINISTER_MEDICATION':
      return {
        ...state,
        medicationSchedule: state.medicationSchedule.map(med =>
          med.id === action.payload.id
            ? { 
                ...med, 
                administered: true, 
                administeredBy: action.payload.administeredBy,
                administeredAt: new Date().toLocaleTimeString()
              }
            : med
        )
      };
    
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Authentication functions
  const login = async (username, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await ApiService.login(username, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.user });
      
      // After successful login, fetch initial data based on user role
      await fetchInitialData(response.user);
      
      return true;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return false;
    }
  };

  const logout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Fetch initial data based on user role
  const fetchInitialData = async (user) => {
    try {
      if (user.role === 'admin') {
        await Promise.all([
          fetchPatients(),
          fetchWards(),
          fetchAppointments(),
          fetchInventory(),
          fetchBills(),
          fetchStaff()
        ]);
      } else if (user.role === 'doctor') {
        await Promise.all([
          fetchPatients(),
          fetchAppointments(),
          fetchMedicalRecords(),
          fetchPrescriptions(),
          fetchLabTests()
        ]);
      } else if (user.role === 'nurse') {
        await Promise.all([
          fetchPatients(),
          fetchWards(),
          fetchInventory(),
          fetchMedicationSchedule()
        ]);
      } else if (user.role === 'receptionist') {
        await Promise.all([
          fetchPatients(),
          fetchAppointments(),
          fetchBills()
        ]);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  // Data fetching functions
  const fetchPatients = async (params = {}) => {
    try {
      const response = await ApiService.getPatients(params);
      dispatch({ type: 'SET_PATIENTS', payload: response.results || response });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const fetchWards = async (params = {}) => {
    try {
      const response = await ApiService.getWards(params);
      dispatch({ type: 'SET_WARDS', payload: response.results || response });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const fetchAppointments = async (params = {}) => {
    try {
      const response = await ApiService.getAppointments(params);
      dispatch({ type: 'SET_APPOINTMENTS', payload: response.results || response });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const fetchMedicalRecords = async (params = {}) => {
    try {
      const response = await ApiService.getMedicalRecords(params);
      dispatch({ type: 'SET_MEDICAL_RECORDS', payload: response.results || response });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const fetchPrescriptions = async (params = {}) => {
    try {
      const response = await ApiService.getPrescriptions(params);
      dispatch({ type: 'SET_PRESCRIPTIONS', payload: response.results || response });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const fetchLabTests = async (params = {}) => {
    try {
      const response = await ApiService.getLabTests(params);
      dispatch({ type: 'SET_LAB_TESTS', payload: response.results || response });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const fetchInventory = async (params = {}) => {
    try {
      const response = await ApiService.getInventory(params);
      dispatch({ type: 'SET_INVENTORY', payload: response.results || response });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const fetchBills = async (params = {}) => {
    try {
      const response = await ApiService.getBills(params);
      dispatch({ type: 'SET_BILLS', payload: response.results || response });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await ApiService.getStaff();
      dispatch({ type: 'SET_STAFF', payload: response.results || response });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const fetchMedicationSchedule = async () => {
    try {
      // Mock medication schedule data
      const mockSchedule = [
        {
          id: 1,
          patientId: 1,
          patientName: "John Smith",
          bedNumber: "A-101",
          medication: "Paracetamol 500mg",
          dosage: "1 tablet",
          time: "08:00",
          administered: false
        },
        {
          id: 2,
          patientId: 2,
          patientName: "Sarah Johnson",
          bedNumber: "ICU-05",
          medication: "Insulin",
          dosage: "10 units",
          time: "09:00",
          administered: false
        }
      ];
      dispatch({ type: 'SET_MEDICATION_SCHEDULE', payload: mockSchedule });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // CRUD operations
  const addPatient = async (patientData) => {
    try {
      const newPatient = await ApiService.createPatient(patientData);
      dispatch({ type: 'ADD_PATIENT', payload: newPatient });
      return newPatient;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const updatePatient = async (id, patientData) => {
    try {
      const updatedPatient = await ApiService.updatePatient(id, patientData);
      dispatch({ type: 'UPDATE_PATIENT', payload: updatedPatient });
      return updatedPatient;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const deletePatient = async (id) => {
    try {
      await ApiService.deletePatient(id);
      dispatch({ type: 'DELETE_PATIENT', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateBedStatus = async (bedId, status) => {
    try {
      const updatedBed = await ApiService.updateBedStatus(bedId, status);
      
      // Find which ward this bed belongs to and update
      const ward = state.wards.find(w => w.beds && w.beds.some(b => b.id === bedId));
      if (ward) {
        dispatch({
          type: 'UPDATE_BED_STATUS',
          payload: {
            wardId: ward.id,
            bedId: bedId,
            bedData: updatedBed
          }
        });
        
        // Refresh ward data to get updated occupancy
        await fetchWards();
      }
      return updatedBed;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const addWard = async (wardData) => {
    try {
      const newWard = await ApiService.createWard(wardData);
      dispatch({ type: 'ADD_WARD', payload: newWard });
      // Refresh wards to get the complete data with beds
      await fetchWards();
      return newWard;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateWard = async (id, wardData) => {
    try {
      const updatedWard = await ApiService.updateWard(id, wardData);
      dispatch({ type: 'UPDATE_WARD', payload: updatedWard });
      // Refresh wards to get the complete data
      await fetchWards();
      return updatedWard;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const deleteWard = async (id) => {
    try {
      await ApiService.deleteWard(id);
      dispatch({ type: 'DELETE_WARD', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const addAppointment = async (appointmentData) => {
    try {
      const newAppointment = await ApiService.createAppointment(appointmentData);
      dispatch({ type: 'ADD_APPOINTMENT', payload: newAppointment });
      return newAppointment;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const addMedicalRecord = async (recordData) => {
    try {
      const newRecord = await ApiService.createMedicalRecord(recordData);
      dispatch({ type: 'ADD_MEDICAL_RECORD', payload: newRecord });
      return newRecord;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const addPrescription = async (prescriptionData) => {
    try {
      const newPrescription = await ApiService.createPrescription(prescriptionData);
      dispatch({ type: 'ADD_PRESCRIPTION', payload: newPrescription });
      return newPrescription;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const addLabTest = async (testData) => {
    try {
      const newTest = await ApiService.createLabTest(testData);
      dispatch({ type: 'ADD_LAB_TEST', payload: newTest });
      return newTest;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const addInventoryItem = async (itemData) => {
    try {
      const newItem = await ApiService.createInventoryItem(itemData);
      dispatch({ type: 'ADD_INVENTORY', payload: newItem });
      return newItem;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateInventoryItem = async (id, itemData) => {
    try {
      const updatedItem = await ApiService.updateInventoryItem(id, itemData);
      dispatch({ type: 'UPDATE_INVENTORY', payload: updatedItem });
      return updatedItem;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const addBill = async (billData) => {
    try {
      const newBill = await ApiService.createBill(billData);
      dispatch({ type: 'ADD_BILL', payload: newBill });
      return newBill;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const addPayment = async (billId, paymentData) => {
    try {
      const updatedBill = await ApiService.addPayment(billId, paymentData);
      dispatch({ type: 'UPDATE_BILL', payload: updatedBill });
      return updatedBill;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const addStaff = async (staffData) => {
    try {
      const newStaff = await ApiService.createUser(staffData);
      dispatch({ type: 'ADD_STAFF', payload: newStaff });
      return newStaff;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateStaff = async (id, staffData) => {
    try {
      const updatedStaff = await ApiService.updateUser(id, staffData);
      dispatch({ type: 'UPDATE_STAFF', payload: updatedStaff });
      return updatedStaff;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const deleteStaff = async (id) => {
    try {
      await ApiService.deleteUser(id);
      dispatch({ type: 'DELETE_STAFF', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Auto-login from localStorage - but don't fetch data until after login
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        
        // Fetch initial data for the logged-in user
        fetchInitialData(user);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const value = {
    ...state,
    // Auth functions
    login,
    logout,
    // Fetch functions
    fetchPatients,
    fetchWards,
    fetchAppointments,
    fetchMedicalRecords,
    fetchPrescriptions,
    fetchLabTests,
    fetchInventory,
    fetchBills,
    fetchStaff,
    fetchMedicationSchedule,
    // CRUD functions
    addPatient,
    updatePatient,
    deletePatient,
    updateBedStatus,
    addWard,
    updateWard,
    deleteWard,
    addAppointment,
    addMedicalRecord,
    addPrescription,
    addLabTest,
    addInventoryItem,
    updateInventoryItem,
    addBill,
    addPayment,
    addStaff,
    updateStaff,
    deleteStaff,
    // Utility functions
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
    dispatch,
    // Direct API access
    api: ApiService
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}