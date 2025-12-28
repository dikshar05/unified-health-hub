const { body, param, query } = require('express-validator');

const patientValidation = {
  create: [
    body('patient_id')
      .trim()
      .notEmpty().withMessage('Patient ID is required'),
    body('full_name')
      .trim()
      .notEmpty().withMessage('Full name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
    body('age')
      .isInt({ min: 0, max: 150 }).withMessage('Age must be between 0 and 150'),
    body('gender')
      .isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
    body('blood_group')
      .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
    body('phone_number')
      .trim()
      .notEmpty().withMessage('Phone number is required'),
    body('email')
      .trim()
      .isEmail().withMessage('Valid email is required'),
    body('emergency_contact')
      .trim()
      .notEmpty().withMessage('Emergency contact is required'),
    body('hospital_location')
      .trim()
      .notEmpty().withMessage('Hospital location is required'),
    body('bmi')
      .isFloat({ min: 0 }).withMessage('BMI must be a positive number'),
    body('smoker_status')
      .isBoolean().withMessage('Smoker status must be true or false'),
    body('alcohol_use')
      .isBoolean().withMessage('Alcohol use must be true or false'),
    body('chronic_conditions')
      .isArray().withMessage('Chronic conditions must be an array'),
    body('registration_date')
      .isISO8601().withMessage('Valid registration date is required'),
    body('insurance_type')
      .trim()
      .notEmpty().withMessage('Insurance type is required')
  ],
  update: [
    param('id')
      .trim()
      .notEmpty().withMessage('Patient ID is required'),
    body('full_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
    body('age')
      .optional()
      .isInt({ min: 0, max: 150 }).withMessage('Age must be between 0 and 150'),
    body('gender')
      .optional()
      .isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
    body('blood_group')
      .optional()
      .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
    body('bmi')
      .optional()
      .isFloat({ min: 0 }).withMessage('BMI must be a positive number'),
    body('smoker_status')
      .optional()
      .isBoolean().withMessage('Smoker status must be true or false'),
    body('alcohol_use')
      .optional()
      .isBoolean().withMessage('Alcohol use must be true or false')
  ],
  getById: [
    param('id')
      .trim()
      .notEmpty().withMessage('Patient ID is required')
  ]
};

module.exports = patientValidation;
