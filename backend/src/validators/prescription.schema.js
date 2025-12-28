const { body, param } = require('express-validator');

const prescriptionValidation = {
  create: [
    body('prescription_id')
      .trim()
      .notEmpty().withMessage('Prescription ID is required'),
    body('visit_id')
      .trim()
      .notEmpty().withMessage('Visit ID is required'),
    body('patient_id')
      .trim()
      .notEmpty().withMessage('Patient ID is required'),
    body('doctor_id')
      .trim()
      .notEmpty().withMessage('Doctor ID is required'),
    body('diagnosis_id')
      .trim()
      .notEmpty().withMessage('Diagnosis ID is required'),
    body('diagnosis_description')
      .trim()
      .notEmpty().withMessage('Diagnosis description is required')
      .isLength({ max: 500 }).withMessage('Diagnosis description must be under 500 characters'),
    body('drug_name')
      .trim()
      .notEmpty().withMessage('Drug name is required'),
    body('drug_category')
      .trim()
      .notEmpty().withMessage('Drug category is required'),
    body('dosage')
      .trim()
      .notEmpty().withMessage('Dosage is required'),
    body('quantity')
      .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('days_supply')
      .isInt({ min: 1 }).withMessage('Days supply must be at least 1'),
    body('prescribed_date')
      .isISO8601().withMessage('Valid prescribed date is required'),
    body('cost')
      .isFloat({ min: 0 }).withMessage('Cost must be a positive number')
  ],
  update: [
    param('id')
      .trim()
      .notEmpty().withMessage('Prescription ID is required'),
    body('dosage')
      .optional()
      .trim()
      .notEmpty().withMessage('Dosage cannot be empty'),
    body('quantity')
      .optional()
      .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('days_supply')
      .optional()
      .isInt({ min: 1 }).withMessage('Days supply must be at least 1'),
    body('cost')
      .optional()
      .isFloat({ min: 0 }).withMessage('Cost must be a positive number')
  ],
  getById: [
    param('id')
      .trim()
      .notEmpty().withMessage('Prescription ID is required')
  ]
};

module.exports = prescriptionValidation;
