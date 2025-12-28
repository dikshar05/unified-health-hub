const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Prescription = require('../models/Prescription');
const Doctor = require('../models/Doctor');
const { parseCSV, validatePatientRow, validateVisitRow, validatePrescriptionRow } = require('../utils/csvParser');

const uploadPatients = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'No file uploaded',
        details: []
      });
    }

    const expectedHeaders = [
      'patient_id', 'full_name', 'age', 'gender', 'blood_group',
      'phone_number', 'email', 'emergency_contact', 'hospital_location',
      'bmi', 'smoker_status', 'alcohol_use', 'chronic_conditions',
      'registration_date', 'insurance_type'
    ];

    const { results, errors: parseErrors } = await parseCSV(req.file.buffer, expectedHeaders);

    if (parseErrors.length > 0) {
      return res.status(400).json({
        error: true,
        message: 'CSV parsing errors',
        details: parseErrors.map(e => `Row ${e.row}: ${e.error}`)
      });
    }

    // Get existing patient IDs
    const existingPatients = await Patient.find().select('patient_id');
    const existingPatientIds = new Set(existingPatients.map(p => p.patient_id));

    const validRows = [];
    const invalidRows = [];
    const newPatientIds = new Set();

    for (const row of results) {
      const errors = validatePatientRow(row, existingPatientIds);
      
      // Check for duplicates within the CSV itself
      if (newPatientIds.has(row.data.patient_id)) {
        errors.push(`Duplicate patient_id ${row.data.patient_id} in CSV`);
      }

      if (errors.length > 0) {
        invalidRows.push({ row: row.row, errors });
      } else {
        // Transform data
        const patient = {
          ...row.data,
          smoker_status: row.data.smoker_status === 'Yes' || row.data.smoker_status === true,
          alcohol_use: row.data.alcohol_use === 'Yes' || row.data.alcohol_use === true,
          chronic_conditions: typeof row.data.chronic_conditions === 'string' 
            ? row.data.chronic_conditions.split(',').map(c => c.trim())
            : row.data.chronic_conditions || [],
          registration_date: new Date(row.data.registration_date)
        };
        validRows.push(patient);
        newPatientIds.add(row.data.patient_id);
      }
    }

    // Insert valid rows
    let insertedCount = 0;
    if (validRows.length > 0) {
      const inserted = await Patient.insertMany(validRows, { ordered: false });
      insertedCount = inserted.length;
    }

    res.json({
      error: false,
      message: 'CSV upload completed',
      data: {
        totalRows: results.length,
        successCount: insertedCount,
        failedCount: invalidRows.length,
        errors: invalidRows.map(r => ({
          row: r.row,
          errors: r.errors
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

const uploadVisits = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'No file uploaded',
        details: []
      });
    }

    const expectedHeaders = [
      'visit_id', 'patient_id', 'doctor_id', 'visit_date', 'severity_score',
      'visit_type', 'length_of_stay', 'lab_result_glucose', 'lab_result_bp',
      'previous_visit_gap_days', 'readmitted_within_30_days', 'visit_cost'
    ];

    const { results, errors: parseErrors } = await parseCSV(req.file.buffer, expectedHeaders);

    if (parseErrors.length > 0) {
      return res.status(400).json({
        error: true,
        message: 'CSV parsing errors',
        details: parseErrors.map(e => `Row ${e.row}: ${e.error}`)
      });
    }

    // Get existing IDs
    const [existingPatients, existingDoctors, existingVisits] = await Promise.all([
      Patient.find().select('patient_id'),
      Doctor.find().select('doctor_id'),
      Visit.find().select('visit_id')
    ]);

    const existingPatientIds = new Set(existingPatients.map(p => p.patient_id));
    const existingDoctorIds = new Set(existingDoctors.map(d => d.doctor_id));
    const existingVisitIds = new Set(existingVisits.map(v => v.visit_id));

    const validRows = [];
    const invalidRows = [];
    const newVisitIds = new Set();

    for (const row of results) {
      const errors = validateVisitRow(row, existingPatientIds, existingDoctorIds, existingVisitIds);
      
      if (newVisitIds.has(row.data.visit_id)) {
        errors.push(`Duplicate visit_id ${row.data.visit_id} in CSV`);
      }

      if (errors.length > 0) {
        invalidRows.push({ row: row.row, errors });
      } else {
        const visit = {
          ...row.data,
          severity_score: parseInt(row.data.severity_score),
          length_of_stay: parseInt(row.data.length_of_stay),
          lab_result_glucose: parseFloat(row.data.lab_result_glucose),
          previous_visit_gap_days: parseInt(row.data.previous_visit_gap_days),
          readmitted_within_30_days: row.data.readmitted_within_30_days === 'Yes' || row.data.readmitted_within_30_days === true,
          visit_cost: parseFloat(row.data.visit_cost),
          visit_date: new Date(row.data.visit_date)
        };
        validRows.push(visit);
        newVisitIds.add(row.data.visit_id);
      }
    }

    let insertedCount = 0;
    if (validRows.length > 0) {
      const inserted = await Visit.insertMany(validRows, { ordered: false });
      insertedCount = inserted.length;
    }

    res.json({
      error: false,
      message: 'CSV upload completed',
      data: {
        totalRows: results.length,
        successCount: insertedCount,
        failedCount: invalidRows.length,
        errors: invalidRows.map(r => ({
          row: r.row,
          errors: r.errors
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

const uploadPrescriptions = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'No file uploaded',
        details: []
      });
    }

    const user = req.user;

    const expectedHeaders = [
      'prescription_id', 'visit_id', 'patient_id', 'diagnosis_id',
      'diagnosis_description', 'drug_name', 'drug_category', 'dosage',
      'quantity', 'days_supply', 'prescribed_date', 'cost'
    ];

    const { results, errors: parseErrors } = await parseCSV(req.file.buffer, expectedHeaders);

    if (parseErrors.length > 0) {
      return res.status(400).json({
        error: true,
        message: 'CSV parsing errors',
        details: parseErrors.map(e => `Row ${e.row}: ${e.error}`)
      });
    }

    // Get existing IDs
    const [existingPatients, existingVisits, existingPrescriptions] = await Promise.all([
      Patient.find().select('patient_id'),
      Visit.find().select('visit_id doctor_id'),
      Prescription.find().select('prescription_id')
    ]);

    const existingPatientIds = new Set(existingPatients.map(p => p.patient_id));
    const existingVisitIds = new Map(existingVisits.map(v => [v.visit_id, v.doctor_id]));
    const existingPrescriptionIds = new Set(existingPrescriptions.map(p => p.prescription_id));

    const validRows = [];
    const invalidRows = [];
    const newPrescriptionIds = new Set();

    for (const row of results) {
      const errors = validatePrescriptionRow(row, existingVisitIds, existingPatientIds, user.doctor_id);
      
      if (newPrescriptionIds.has(row.data.prescription_id)) {
        errors.push(`Duplicate prescription_id ${row.data.prescription_id} in CSV`);
      }
      if (existingPrescriptionIds.has(row.data.prescription_id)) {
        errors.push(`prescription_id ${row.data.prescription_id} already exists`);
      }

      if (errors.length > 0) {
        invalidRows.push({ row: row.row, errors });
      } else {
        const prescription = {
          ...row.data,
          doctor_id: user.doctor_id,
          quantity: parseInt(row.data.quantity),
          days_supply: parseInt(row.data.days_supply),
          cost: parseFloat(row.data.cost),
          prescribed_date: new Date(row.data.prescribed_date)
        };
        validRows.push(prescription);
        newPrescriptionIds.add(row.data.prescription_id);
      }
    }

    let insertedCount = 0;
    if (validRows.length > 0) {
      const inserted = await Prescription.insertMany(validRows, { ordered: false });
      insertedCount = inserted.length;
    }

    res.json({
      error: false,
      message: 'CSV upload completed',
      data: {
        totalRows: results.length,
        successCount: insertedCount,
        failedCount: invalidRows.length,
        errors: invalidRows.map(r => ({
          row: r.row,
          errors: r.errors
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadPatients,
  uploadVisits,
  uploadPrescriptions
};
