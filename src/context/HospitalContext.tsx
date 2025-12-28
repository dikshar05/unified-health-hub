import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { 
  Patient, Doctor, Visit, Prescription, User, AuthState,
  DEMO_CREDENTIALS, SeverityChange
} from '@/types/hospital';

// State interface
interface HospitalState {
  patients: Patient[];
  doctors: Doctor[];
  visits: Visit[];
  prescriptions: Prescription[];
  auth: AuthState;
}

// Action types
type HospitalAction =
  | { type: 'ADD_PATIENT'; payload: Patient }
  | { type: 'ADD_PATIENTS'; payload: Patient[] }
  | { type: 'UPDATE_PATIENT'; payload: Patient }
  | { type: 'DELETE_PATIENT'; payload: string }
  | { type: 'ADD_DOCTOR'; payload: Doctor }
  | { type: 'ADD_DOCTORS'; payload: Doctor[] }
  | { type: 'UPDATE_DOCTOR'; payload: Doctor }
  | { type: 'DELETE_DOCTOR'; payload: string }
  | { type: 'ADD_VISIT'; payload: Visit }
  | { type: 'ADD_VISITS'; payload: Visit[] }
  | { type: 'UPDATE_VISIT'; payload: Visit }
  | { type: 'DELETE_VISIT'; payload: string }
  | { type: 'ADD_PRESCRIPTION'; payload: Prescription }
  | { type: 'ADD_PRESCRIPTIONS'; payload: Prescription[] }
  | { type: 'UPDATE_PRESCRIPTION'; payload: Prescription }
  | { type: 'DELETE_PRESCRIPTION'; payload: string }
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'LOAD_STATE'; payload: HospitalState };

// Initial state with demo doctors
const initialDoctors: Doctor[] = DEMO_CREDENTIALS.doctors.map(d => ({
  doctor_id: d.doctor_id,
  doctor_name: d.doctor_name,
  user_id: d.user_id,
  password: d.password,
  doctor_speciality: d.doctor_speciality,
}));

const initialState: HospitalState = {
  patients: [],
  doctors: initialDoctors,
  visits: [],
  prescriptions: [],
  auth: {
    user: null,
    isAuthenticated: false,
  },
};

// Reducer
function hospitalReducer(state: HospitalState, action: HospitalAction): HospitalState {
  switch (action.type) {
    case 'ADD_PATIENT':
      return { ...state, patients: [...state.patients, action.payload] };
    case 'ADD_PATIENTS':
      return { ...state, patients: [...state.patients, ...action.payload] };
    case 'UPDATE_PATIENT':
      return {
        ...state,
        patients: state.patients.map(p => p.patient_id === action.payload.patient_id ? action.payload : p),
      };
    case 'DELETE_PATIENT':
      return { ...state, patients: state.patients.filter(p => p.patient_id !== action.payload) };
    case 'ADD_DOCTOR':
      return { ...state, doctors: [...state.doctors, action.payload] };
    case 'ADD_DOCTORS':
      return { ...state, doctors: [...state.doctors, ...action.payload] };
    case 'UPDATE_DOCTOR':
      return {
        ...state,
        doctors: state.doctors.map(d => d.doctor_id === action.payload.doctor_id ? action.payload : d),
      };
    case 'DELETE_DOCTOR':
      return { ...state, doctors: state.doctors.filter(d => d.doctor_id !== action.payload) };
    case 'ADD_VISIT':
      return { ...state, visits: [...state.visits, action.payload] };
    case 'ADD_VISITS':
      return { ...state, visits: [...state.visits, ...action.payload] };
    case 'UPDATE_VISIT':
      return {
        ...state,
        visits: state.visits.map(v => v.visit_id === action.payload.visit_id ? action.payload : v),
      };
    case 'DELETE_VISIT':
      return { ...state, visits: state.visits.filter(v => v.visit_id !== action.payload) };
    case 'ADD_PRESCRIPTION':
      return { ...state, prescriptions: [...state.prescriptions, action.payload] };
    case 'ADD_PRESCRIPTIONS':
      return { ...state, prescriptions: [...state.prescriptions, ...action.payload] };
    case 'UPDATE_PRESCRIPTION':
      return {
        ...state,
        prescriptions: state.prescriptions.map(p => p.prescription_id === action.payload.prescription_id ? action.payload : p),
      };
    case 'DELETE_PRESCRIPTION':
      return { ...state, prescriptions: state.prescriptions.filter(p => p.prescription_id !== action.payload) };
    case 'LOGIN':
      return { ...state, auth: { user: action.payload, isAuthenticated: true } };
    case 'LOGOUT':
      return { ...state, auth: { user: null, isAuthenticated: false } };
    case 'LOAD_STATE':
      return { ...action.payload, auth: state.auth };
    default:
      return state;
  }
}

// Context
interface HospitalContextType {
  state: HospitalState;
  // Patient actions
  addPatient: (patient: Patient) => void;
  addPatients: (patients: Patient[]) => void;
  updatePatient: (patient: Patient) => void;
  deletePatient: (patientId: string) => void;
  // Doctor actions
  addDoctor: (doctor: Doctor) => void;
  addDoctors: (doctors: Doctor[]) => void;
  updateDoctor: (doctor: Doctor) => void;
  deleteDoctor: (doctorId: string) => void;
  // Visit actions
  addVisit: (visit: Visit) => void;
  addVisits: (visits: Visit[]) => void;
  updateVisit: (visit: Visit) => void;
  deleteVisit: (visitId: string) => void;
  // Prescription actions
  addPrescription: (prescription: Prescription) => void;
  addPrescriptions: (prescriptions: Prescription[]) => void;
  updatePrescription: (prescription: Prescription) => void;
  deletePrescription: (prescriptionId: string) => void;
  // Auth actions
  login: (userId: string, password: string, portal: 'admin' | 'doctor') => { success: boolean; error?: string };
  logout: () => void;
  // Utility functions
  getPatientById: (patientId: string) => Patient | undefined;
  getDoctorById: (doctorId: string) => Doctor | undefined;
  getVisitById: (visitId: string) => Visit | undefined;
  getVisitsByPatient: (patientId: string) => Visit[];
  getVisitsByDoctor: (doctorId: string) => Visit[];
  getPrescriptionsByDoctor: (doctorId: string) => Prescription[];
  getPrescriptionsByVisit: (visitId: string) => Prescription[];
  getSeverityChange: (visit: Visit) => SeverityChange;
  generatePatientId: () => string;
  generateVisitId: () => string;
  generateDoctorId: () => string;
  generatePrescriptionId: () => string;
  isPatientIdUnique: (patientId: string) => boolean;
  isVisitIdUnique: (visitId: string) => boolean;
  isDoctorUserIdUnique: (userId: string) => boolean;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

// Provider
export function HospitalProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(hospitalReducer, initialState);

  // Persist state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('hospitalState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        dispatch({ type: 'LOAD_STATE', payload: { ...initialState, ...parsed } });
      } catch (e) {
        console.error('Failed to parse saved state');
      }
    }
  }, []);

  useEffect(() => {
    const { auth, ...stateToSave } = state;
    localStorage.setItem('hospitalState', JSON.stringify(stateToSave));
  }, [state.patients, state.doctors, state.visits, state.prescriptions]);

  // Check session on mount
  useEffect(() => {
    const session = sessionStorage.getItem('hospitalSession');
    if (session) {
      try {
        const user = JSON.parse(session);
        dispatch({ type: 'LOGIN', payload: user });
      } catch (e) {
        sessionStorage.removeItem('hospitalSession');
      }
    }
  }, []);

  // Patient actions
  const addPatient = useCallback((patient: Patient) => {
    dispatch({ type: 'ADD_PATIENT', payload: patient });
  }, []);

  const addPatients = useCallback((patients: Patient[]) => {
    dispatch({ type: 'ADD_PATIENTS', payload: patients });
  }, []);

  const updatePatient = useCallback((patient: Patient) => {
    dispatch({ type: 'UPDATE_PATIENT', payload: patient });
  }, []);

  const deletePatient = useCallback((patientId: string) => {
    dispatch({ type: 'DELETE_PATIENT', payload: patientId });
  }, []);

  // Doctor actions
  const addDoctor = useCallback((doctor: Doctor) => {
    dispatch({ type: 'ADD_DOCTOR', payload: doctor });
  }, []);

  const addDoctors = useCallback((doctors: Doctor[]) => {
    dispatch({ type: 'ADD_DOCTORS', payload: doctors });
  }, []);

  const updateDoctor = useCallback((doctor: Doctor) => {
    dispatch({ type: 'UPDATE_DOCTOR', payload: doctor });
  }, []);

  const deleteDoctor = useCallback((doctorId: string) => {
    dispatch({ type: 'DELETE_DOCTOR', payload: doctorId });
  }, []);

  // Visit actions
  const addVisit = useCallback((visit: Visit) => {
    dispatch({ type: 'ADD_VISIT', payload: visit });
  }, []);

  const addVisits = useCallback((visits: Visit[]) => {
    dispatch({ type: 'ADD_VISITS', payload: visits });
  }, []);

  const updateVisit = useCallback((visit: Visit) => {
    dispatch({ type: 'UPDATE_VISIT', payload: visit });
  }, []);

  const deleteVisit = useCallback((visitId: string) => {
    dispatch({ type: 'DELETE_VISIT', payload: visitId });
  }, []);

  // Prescription actions
  const addPrescription = useCallback((prescription: Prescription) => {
    dispatch({ type: 'ADD_PRESCRIPTION', payload: prescription });
  }, []);

  const addPrescriptions = useCallback((prescriptions: Prescription[]) => {
    dispatch({ type: 'ADD_PRESCRIPTIONS', payload: prescriptions });
  }, []);

  const updatePrescription = useCallback((prescription: Prescription) => {
    dispatch({ type: 'UPDATE_PRESCRIPTION', payload: prescription });
  }, []);

  const deletePrescription = useCallback((prescriptionId: string) => {
    dispatch({ type: 'DELETE_PRESCRIPTION', payload: prescriptionId });
  }, []);

  // Auth actions
  const login = useCallback((userId: string, password: string, portal: 'admin' | 'doctor'): { success: boolean; error?: string } => {
    if (portal === 'admin') {
      if (userId === DEMO_CREDENTIALS.admin.user_id && password === DEMO_CREDENTIALS.admin.password) {
        const user: User = { user_id: userId, role: 'admin' };
        dispatch({ type: 'LOGIN', payload: user });
        sessionStorage.setItem('hospitalSession', JSON.stringify(user));
        return { success: true };
      }
      // Check if trying to use doctor credentials in admin portal
      const doctorMatch = state.doctors.find(d => d.user_id === userId);
      if (doctorMatch) {
        return { success: false, error: 'Doctor credentials cannot be used in Admin portal' };
      }
      return { success: false, error: 'Invalid admin credentials' };
    } else {
      // Doctor login
      const doctor = state.doctors.find(d => d.user_id === userId && d.password === password);
      if (doctor) {
        const user: User = {
          user_id: userId,
          role: 'doctor',
          doctor_id: doctor.doctor_id,
          doctor_name: doctor.doctor_name,
          doctor_speciality: doctor.doctor_speciality,
        };
        dispatch({ type: 'LOGIN', payload: user });
        sessionStorage.setItem('hospitalSession', JSON.stringify(user));
        return { success: true };
      }
      // Check if trying to use admin credentials in doctor portal
      if (userId === DEMO_CREDENTIALS.admin.user_id) {
        return { success: false, error: 'Admin credentials cannot be used in Doctor portal' };
      }
      return { success: false, error: 'Invalid doctor credentials' };
    }
  }, [state.doctors]);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
    sessionStorage.removeItem('hospitalSession');
  }, []);

  // Utility functions
  const getPatientById = useCallback((patientId: string) => {
    return state.patients.find(p => p.patient_id === patientId);
  }, [state.patients]);

  const getDoctorById = useCallback((doctorId: string) => {
    return state.doctors.find(d => d.doctor_id === doctorId);
  }, [state.doctors]);

  const getVisitById = useCallback((visitId: string) => {
    return state.visits.find(v => v.visit_id === visitId);
  }, [state.visits]);

  const getVisitsByPatient = useCallback((patientId: string) => {
    return state.visits
      .filter(v => v.patient_id === patientId)
      .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
  }, [state.visits]);

  const getVisitsByDoctor = useCallback((doctorId: string) => {
    return state.visits
      .filter(v => v.doctor_id === doctorId)
      .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
  }, [state.visits]);

  const getPrescriptionsByDoctor = useCallback((doctorId: string) => {
    return state.prescriptions
      .filter(p => p.doctor_id === doctorId)
      .sort((a, b) => new Date(b.prescribed_date).getTime() - new Date(a.prescribed_date).getTime());
  }, [state.prescriptions]);

  const getPrescriptionsByVisit = useCallback((visitId: string) => {
    return state.prescriptions.filter(p => p.visit_id === visitId);
  }, [state.prescriptions]);

  const getSeverityChange = useCallback((visit: Visit): SeverityChange => {
    const patientVisits = state.visits
      .filter(v => v.patient_id === visit.patient_id && v.visit_id !== visit.visit_id)
      .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
    
    const previousVisit = patientVisits.find(v => new Date(v.visit_date) < new Date(visit.visit_date));
    
    if (!previousVisit) return 'first-visit';
    
    if (visit.severity_score > previousVisit.severity_score) return 'increased';
    if (visit.severity_score < previousVisit.severity_score) return 'improved';
    return 'unchanged';
  }, [state.visits]);

  const generatePatientId = useCallback(() => {
    const count = state.patients.length + 1;
    return `PAT${String(count).padStart(5, '0')}`;
  }, [state.patients.length]);

  const generateVisitId = useCallback(() => {
    const count = state.visits.length + 1;
    return `VIS${String(count).padStart(5, '0')}`;
  }, [state.visits.length]);

  const generateDoctorId = useCallback(() => {
    const count = state.doctors.length + 1;
    return `DOC${String(count).padStart(3, '0')}`;
  }, [state.doctors.length]);

  const generatePrescriptionId = useCallback(() => {
    const count = state.prescriptions.length + 1;
    return `PRE${String(count).padStart(5, '0')}`;
  }, [state.prescriptions.length]);

  const isPatientIdUnique = useCallback((patientId: string) => {
    return !state.patients.some(p => p.patient_id === patientId);
  }, [state.patients]);

  const isVisitIdUnique = useCallback((visitId: string) => {
    return !state.visits.some(v => v.visit_id === visitId);
  }, [state.visits]);

  const isDoctorUserIdUnique = useCallback((userId: string) => {
    return !state.doctors.some(d => d.user_id === userId) && userId !== DEMO_CREDENTIALS.admin.user_id;
  }, [state.doctors]);

  const value: HospitalContextType = {
    state,
    addPatient,
    addPatients,
    updatePatient,
    deletePatient,
    addDoctor,
    addDoctors,
    updateDoctor,
    deleteDoctor,
    addVisit,
    addVisits,
    updateVisit,
    deleteVisit,
    addPrescription,
    addPrescriptions,
    updatePrescription,
    deletePrescription,
    login,
    logout,
    getPatientById,
    getDoctorById,
    getVisitById,
    getVisitsByPatient,
    getVisitsByDoctor,
    getPrescriptionsByDoctor,
    getPrescriptionsByVisit,
    getSeverityChange,
    generatePatientId,
    generateVisitId,
    generateDoctorId,
    generatePrescriptionId,
    isPatientIdUnique,
    isVisitIdUnique,
    isDoctorUserIdUnique,
  };

  return (
    <HospitalContext.Provider value={value}>
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error('useHospital must be used within a HospitalProvider');
  }
  return context;
}
