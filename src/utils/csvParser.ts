import { Patient, Visit, Prescription, CHRONIC_CONDITIONS, BLOOD_GROUPS } from '@/types/hospital';

export interface CSVParseResult<T> {
  valid: T[];
  errors: { row: number; message: string }[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

function parseCSV(csvText: string): { headers: string[]; rows: string[][] } {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows = lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });
  
  return { headers, rows };
}

// Patient CSV validation
const PATIENT_REQUIRED_HEADERS = [
  'patient_id', 'full_name', 'age', 'gender', 'blood_group', 'phone_number',
  'email', 'emergency_contact', 'hospital_location', 'bmi', 'smoker_status',
  'alcohol_use', 'chronic_conditions', 'registration_date', 'insurance_type'
];

export function parsePatientCSV(
  csvText: string, 
  existingPatientIds: string[]
): CSVParseResult<Patient> {
  const { headers, rows } = parseCSV(csvText);
  const errors: { row: number; message: string }[] = [];
  const valid: Patient[] = [];
  
  // Validate headers
  const missingHeaders = PATIENT_REQUIRED_HEADERS.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return {
      valid: [],
      errors: [{ row: 0, message: `Missing required columns: ${missingHeaders.join(', ')}` }],
      summary: { total: rows.length, valid: 0, invalid: rows.length }
    };
  }
  
  const headerIndex = PATIENT_REQUIRED_HEADERS.reduce((acc, h) => {
    acc[h] = headers.indexOf(h);
    return acc;
  }, {} as Record<string, number>);
  
  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // 1-indexed, accounting for header
    const rowErrors: string[] = [];
    
    const patient_id = row[headerIndex.patient_id]?.trim();
    const full_name = row[headerIndex.full_name]?.trim();
    const ageStr = row[headerIndex.age]?.trim();
    const gender = row[headerIndex.gender]?.trim();
    const blood_group = row[headerIndex.blood_group]?.trim();
    const phone_number = row[headerIndex.phone_number]?.trim();
    const email = row[headerIndex.email]?.trim();
    const emergency_contact = row[headerIndex.emergency_contact]?.trim();
    const hospital_location = row[headerIndex.hospital_location]?.trim();
    const bmiStr = row[headerIndex.bmi]?.trim();
    const smoker_status = row[headerIndex.smoker_status]?.trim()?.toLowerCase();
    const alcohol_use = row[headerIndex.alcohol_use]?.trim()?.toLowerCase();
    const chronic_conditions_str = row[headerIndex.chronic_conditions]?.trim();
    const registration_date = row[headerIndex.registration_date]?.trim();
    const insurance_type = row[headerIndex.insurance_type]?.trim();
    
    // Validate patient_id
    if (!patient_id) rowErrors.push('patient_id is required');
    else if (existingPatientIds.includes(patient_id) || valid.some(p => p.patient_id === patient_id)) {
      rowErrors.push(`patient_id "${patient_id}" already exists`);
    }
    
    // Validate full_name
    if (!full_name) rowErrors.push('full_name is required');
    
    // Validate age
    const age = parseInt(ageStr);
    if (isNaN(age) || age < 0 || age > 150) rowErrors.push('age must be a valid number between 0-150');
    
    // Validate gender
    if (!['Male', 'Female', 'Other'].includes(gender)) {
      rowErrors.push('gender must be Male, Female, or Other');
    }
    
    // Validate blood_group
    if (!BLOOD_GROUPS.includes(blood_group)) {
      rowErrors.push(`blood_group must be one of: ${BLOOD_GROUPS.join(', ')}`);
    }
    
    // Validate BMI
    const bmi = parseFloat(bmiStr);
    if (isNaN(bmi) || bmi < 10 || bmi > 100) rowErrors.push('bmi must be a valid number between 10-100');
    
    // Validate boolean fields
    if (!['yes', 'no', 'true', 'false', '1', '0'].includes(smoker_status)) {
      rowErrors.push('smoker_status must be Yes or No');
    }
    if (!['yes', 'no', 'true', 'false', '1', '0'].includes(alcohol_use)) {
      rowErrors.push('alcohol_use must be Yes or No');
    }
    
    // Validate chronic_conditions
    const chronic_conditions = chronic_conditions_str
      ? chronic_conditions_str.split(';').map(c => c.trim()).filter(c => c)
      : [];
    const invalidConditions = chronic_conditions.filter(c => !CHRONIC_CONDITIONS.includes(c));
    if (invalidConditions.length > 0) {
      rowErrors.push(`Invalid chronic conditions: ${invalidConditions.join(', ')}`);
    }
    
    // Validate date
    const dateObj = new Date(registration_date);
    if (isNaN(dateObj.getTime())) rowErrors.push('registration_date must be a valid date');
    
    if (rowErrors.length > 0) {
      errors.push({ row: rowNum, message: rowErrors.join('; ') });
    } else {
      valid.push({
        patient_id,
        full_name,
        age,
        gender: gender as Patient['gender'],
        blood_group,
        phone_number,
        email,
        emergency_contact,
        hospital_location,
        bmi,
        smoker_status: ['yes', 'true', '1'].includes(smoker_status),
        alcohol_use: ['yes', 'true', '1'].includes(alcohol_use),
        chronic_conditions,
        registration_date: dateObj.toISOString().split('T')[0],
        insurance_type,
      });
    }
  });
  
  return {
    valid,
    errors,
    summary: { total: rows.length, valid: valid.length, invalid: errors.length }
  };
}

// Visit CSV validation
const VISIT_REQUIRED_HEADERS = [
  'visit_id', 'patient_id', 'doctor_id', 'visit_date', 'severity_score',
  'visit_type', 'length_of_stay', 'lab_result_glucose', 'lab_result_bp',
  'previous_visit_gap_days', 'readmitted_within_30_days', 'visit_cost'
];

export function parseVisitCSV(
  csvText: string,
  existingVisitIds: string[],
  existingPatientIds: string[],
  existingDoctorIds: string[]
): CSVParseResult<Visit> {
  const { headers, rows } = parseCSV(csvText);
  const errors: { row: number; message: string }[] = [];
  const valid: Visit[] = [];
  
  const missingHeaders = VISIT_REQUIRED_HEADERS.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return {
      valid: [],
      errors: [{ row: 0, message: `Missing required columns: ${missingHeaders.join(', ')}` }],
      summary: { total: rows.length, valid: 0, invalid: rows.length }
    };
  }
  
  const headerIndex = VISIT_REQUIRED_HEADERS.reduce((acc, h) => {
    acc[h] = headers.indexOf(h);
    return acc;
  }, {} as Record<string, number>);
  
  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const rowErrors: string[] = [];
    
    const visit_id = row[headerIndex.visit_id]?.trim();
    const patient_id = row[headerIndex.patient_id]?.trim();
    const doctor_id = row[headerIndex.doctor_id]?.trim();
    const visit_date = row[headerIndex.visit_date]?.trim();
    const severity_score_str = row[headerIndex.severity_score]?.trim();
    const visit_type = row[headerIndex.visit_type]?.trim()?.toUpperCase();
    const length_of_stay_str = row[headerIndex.length_of_stay]?.trim();
    const lab_result_glucose_str = row[headerIndex.lab_result_glucose]?.trim();
    const lab_result_bp = row[headerIndex.lab_result_bp]?.trim();
    const previous_visit_gap_days_str = row[headerIndex.previous_visit_gap_days]?.trim();
    const readmitted_str = row[headerIndex.readmitted_within_30_days]?.trim()?.toLowerCase();
    const visit_cost_str = row[headerIndex.visit_cost]?.trim();
    
    // Validate visit_id
    if (!visit_id) rowErrors.push('visit_id is required');
    else if (existingVisitIds.includes(visit_id) || valid.some(v => v.visit_id === visit_id)) {
      rowErrors.push(`visit_id "${visit_id}" already exists`);
    }
    
    // Validate patient_id
    if (!existingPatientIds.includes(patient_id)) {
      rowErrors.push(`patient_id "${patient_id}" does not exist`);
    }
    
    // Validate doctor_id
    if (!existingDoctorIds.includes(doctor_id)) {
      rowErrors.push(`doctor_id "${doctor_id}" does not exist`);
    }
    
    // Validate date
    const dateObj = new Date(visit_date);
    if (isNaN(dateObj.getTime())) rowErrors.push('visit_date must be a valid date');
    
    // Validate severity_score (0-5 integer)
    const severity_score = parseInt(severity_score_str);
    if (isNaN(severity_score) || severity_score < 0 || severity_score > 5 || !Number.isInteger(severity_score)) {
      rowErrors.push('severity_score must be an integer between 0-5');
    }
    
    // Validate visit_type
    if (!['OP', 'IP'].includes(visit_type)) {
      rowErrors.push('visit_type must be OP or IP');
    }
    
    // Validate length_of_stay
    const length_of_stay = parseInt(length_of_stay_str);
    if (isNaN(length_of_stay) || length_of_stay < 0) {
      rowErrors.push('length_of_stay must be a non-negative integer');
    }
    if (visit_type === 'OP' && length_of_stay !== 0) {
      rowErrors.push('length_of_stay must be 0 for OP visits');
    }
    
    // Validate lab results
    const lab_result_glucose = parseFloat(lab_result_glucose_str);
    if (isNaN(lab_result_glucose)) rowErrors.push('lab_result_glucose must be a valid number');
    
    // Validate gap days
    const previous_visit_gap_days = parseInt(previous_visit_gap_days_str);
    if (isNaN(previous_visit_gap_days) || previous_visit_gap_days < 0) {
      rowErrors.push('previous_visit_gap_days must be a non-negative integer');
    }
    
    // Validate readmitted
    const readmitted_within_30_days = ['yes', 'true', '1'].includes(readmitted_str);
    if (visit_type === 'OP' && readmitted_within_30_days) {
      rowErrors.push('readmitted_within_30_days should be No for OP visits');
    }
    
    // Validate cost
    const visit_cost = parseFloat(visit_cost_str);
    if (isNaN(visit_cost) || visit_cost < 0) rowErrors.push('visit_cost must be a non-negative number');
    
    if (rowErrors.length > 0) {
      errors.push({ row: rowNum, message: rowErrors.join('; ') });
    } else {
      valid.push({
        visit_id,
        patient_id,
        doctor_id,
        visit_date: dateObj.toISOString().split('T')[0],
        severity_score,
        visit_type: visit_type as Visit['visit_type'],
        length_of_stay,
        lab_result_glucose,
        lab_result_bp,
        previous_visit_gap_days,
        readmitted_within_30_days,
        visit_cost,
      });
    }
  });
  
  return {
    valid,
    errors,
    summary: { total: rows.length, valid: valid.length, invalid: errors.length }
  };
}

// Prescription CSV validation
const PRESCRIPTION_REQUIRED_HEADERS = [
  'prescription_id', 'visit_id', 'patient_id', 'doctor_id', 'diagnosis_id',
  'diagnosis_description', 'drug_name', 'drug_category', 'dosage', 'quantity',
  'days_supply', 'prescribed_date', 'cost'
];

export function parsePrescriptionCSV(
  csvText: string,
  existingPrescriptionIds: string[],
  existingVisitIds: string[],
  doctorId: string,
  doctorVisitIds: string[]
): CSVParseResult<Prescription> {
  const { headers, rows } = parseCSV(csvText);
  const errors: { row: number; message: string }[] = [];
  const valid: Prescription[] = [];
  
  const missingHeaders = PRESCRIPTION_REQUIRED_HEADERS.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return {
      valid: [],
      errors: [{ row: 0, message: `Missing required columns: ${missingHeaders.join(', ')}` }],
      summary: { total: rows.length, valid: 0, invalid: rows.length }
    };
  }
  
  const headerIndex = PRESCRIPTION_REQUIRED_HEADERS.reduce((acc, h) => {
    acc[h] = headers.indexOf(h);
    return acc;
  }, {} as Record<string, number>);
  
  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const rowErrors: string[] = [];
    
    const prescription_id = row[headerIndex.prescription_id]?.trim();
    const visit_id = row[headerIndex.visit_id]?.trim();
    const patient_id = row[headerIndex.patient_id]?.trim();
    const doctor_id = row[headerIndex.doctor_id]?.trim();
    const diagnosis_id = row[headerIndex.diagnosis_id]?.trim();
    const diagnosis_description = row[headerIndex.diagnosis_description]?.trim();
    const drug_name = row[headerIndex.drug_name]?.trim();
    const drug_category = row[headerIndex.drug_category]?.trim();
    const dosage = row[headerIndex.dosage]?.trim();
    const quantity_str = row[headerIndex.quantity]?.trim();
    const days_supply_str = row[headerIndex.days_supply]?.trim();
    const prescribed_date = row[headerIndex.prescribed_date]?.trim();
    const cost_str = row[headerIndex.cost]?.trim();
    
    // Validate prescription_id
    if (!prescription_id) rowErrors.push('prescription_id is required');
    else if (existingPrescriptionIds.includes(prescription_id) || valid.some(p => p.prescription_id === prescription_id)) {
      rowErrors.push(`prescription_id "${prescription_id}" already exists`);
    }
    
    // Validate visit_id belongs to doctor
    if (!doctorVisitIds.includes(visit_id)) {
      rowErrors.push(`visit_id "${visit_id}" does not belong to this doctor or does not exist`);
    }
    
    // Validate doctor_id matches logged in doctor
    if (doctor_id !== doctorId) {
      rowErrors.push(`doctor_id must match logged-in doctor (${doctorId})`);
    }
    
    // Validate date
    const dateObj = new Date(prescribed_date);
    if (isNaN(dateObj.getTime())) rowErrors.push('prescribed_date must be a valid date');
    
    // Validate quantity
    const quantity = parseInt(quantity_str);
    if (isNaN(quantity) || quantity <= 0) rowErrors.push('quantity must be a positive integer');
    
    // Validate days_supply
    const days_supply = parseInt(days_supply_str);
    if (isNaN(days_supply) || days_supply <= 0) rowErrors.push('days_supply must be a positive integer');
    
    // Validate cost
    const cost = parseFloat(cost_str);
    if (isNaN(cost) || cost < 0) rowErrors.push('cost must be a non-negative number');
    
    if (rowErrors.length > 0) {
      errors.push({ row: rowNum, message: rowErrors.join('; ') });
    } else {
      valid.push({
        prescription_id,
        visit_id,
        patient_id,
        doctor_id,
        diagnosis_id,
        diagnosis_description,
        drug_name,
        drug_category,
        dosage,
        quantity,
        days_supply,
        prescribed_date: dateObj.toISOString().split('T')[0],
        cost,
      });
    }
  });
  
  return {
    valid,
    errors,
    summary: { total: rows.length, valid: valid.length, invalid: errors.length }
  };
}
