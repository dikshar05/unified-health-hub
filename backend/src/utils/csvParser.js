const { parse } = require('csv-parse');

const parseCSV = (buffer, expectedHeaders) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let rowNumber = 0;

    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: true
    });

    parser.on('readable', function() {
      let record;
      while ((record = parser.read()) !== null) {
        rowNumber++;
        
        // Validate headers on first row
        if (rowNumber === 1 && expectedHeaders) {
          const recordHeaders = Object.keys(record);
          const missingHeaders = expectedHeaders.filter(h => !recordHeaders.includes(h));
          if (missingHeaders.length > 0) {
            errors.push({
              row: 0,
              error: `Missing required columns: ${missingHeaders.join(', ')}`
            });
          }
        }
        
        results.push({ row: rowNumber, data: record });
      }
    });

    parser.on('error', function(err) {
      reject(err);
    });

    parser.on('end', function() {
      resolve({ results, errors });
    });

    parser.write(buffer);
    parser.end();
  });
};

const validatePatientRow = (row, existingPatientIds) => {
  const errors = [];
  const { data } = row;

  if (!data.patient_id) errors.push('patient_id is required');
  if (existingPatientIds.has(data.patient_id)) errors.push(`patient_id ${data.patient_id} already exists`);
  if (!data.full_name) errors.push('full_name is required');
  if (!data.age || isNaN(data.age) || data.age < 0 || data.age > 150) errors.push('age must be between 0 and 150');
  if (!['Male', 'Female', 'Other'].includes(data.gender)) errors.push('gender must be Male, Female, or Other');
  if (!['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(data.blood_group)) errors.push('Invalid blood_group');
  if (!data.email || !data.email.includes('@')) errors.push('Valid email is required');
  
  return errors;
};

const validateVisitRow = (row, existingPatientIds, existingDoctorIds, existingVisitIds) => {
  const errors = [];
  const { data } = row;

  if (!data.visit_id) errors.push('visit_id is required');
  if (existingVisitIds.has(data.visit_id)) errors.push(`visit_id ${data.visit_id} already exists`);
  if (!data.patient_id || !existingPatientIds.has(data.patient_id)) errors.push(`patient_id ${data.patient_id} does not exist`);
  if (!data.doctor_id || !existingDoctorIds.has(data.doctor_id)) errors.push(`doctor_id ${data.doctor_id} does not exist`);
  
  const severity = parseInt(data.severity_score);
  if (isNaN(severity) || severity < 0 || severity > 5 || !Number.isInteger(severity)) {
    errors.push('severity_score must be an integer between 0 and 5');
  }
  
  if (!['OP', 'IP'].includes(data.visit_type)) errors.push('visit_type must be OP or IP');
  
  const los = parseInt(data.length_of_stay);
  if (data.visit_type === 'OP' && los !== 0) errors.push('OP visits must have length_of_stay = 0');
  if (data.visit_type === 'IP' && los < 1) errors.push('IP visits must have length_of_stay >= 1');
  
  return errors;
};

const validatePrescriptionRow = (row, existingVisitIds, existingPatientIds, doctorId) => {
  const errors = [];
  const { data } = row;

  if (!data.prescription_id) errors.push('prescription_id is required');
  if (!data.visit_id || !existingVisitIds.has(data.visit_id)) errors.push(`visit_id ${data.visit_id} does not exist`);
  if (!data.patient_id || !existingPatientIds.has(data.patient_id)) errors.push(`patient_id ${data.patient_id} does not exist`);
  
  // Verify visit belongs to the uploading doctor
  const visitDoctorId = existingVisitIds.get(data.visit_id);
  if (visitDoctorId && visitDoctorId !== doctorId) {
    errors.push(`visit_id ${data.visit_id} does not belong to this doctor`);
  }
  
  if (!data.drug_name) errors.push('drug_name is required');
  if (!data.quantity || isNaN(data.quantity) || data.quantity < 1) errors.push('quantity must be at least 1');
  if (!data.days_supply || isNaN(data.days_supply) || data.days_supply < 1) errors.push('days_supply must be at least 1');
  
  return errors;
};

module.exports = {
  parseCSV,
  validatePatientRow,
  validateVisitRow,
  validatePrescriptionRow
};
