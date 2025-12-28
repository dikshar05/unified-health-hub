const { body, param } = require('express-validator');

const visitValidation = {
  create: [
    body('visit_id')
      .trim()
      .notEmpty().withMessage('Visit ID is required'),
    body('patient_id')
      .trim()
      .notEmpty().withMessage('Patient ID is required'),
    body('doctor_id')
      .trim()
      .notEmpty().withMessage('Doctor ID is required'),
    body('visit_date')
      .isISO8601().withMessage('Valid visit date is required'),
    body('severity_score')
      .isInt({ min: 0, max: 5 }).withMessage('Severity score must be an integer between 0 and 5'),
    body('visit_type')
      .isIn(['OP', 'IP']).withMessage('Visit type must be OP or IP'),
    body('length_of_stay')
      .isInt({ min: 0 }).withMessage('Length of stay must be a non-negative integer')
      .custom((value, { req }) => {
        if (req.body.visit_type === 'OP' && value !== 0) {
          throw new Error('OP visits must have length_of_stay = 0');
        }
        if (req.body.visit_type === 'IP' && value < 1) {
          throw new Error('IP visits must have length_of_stay >= 1');
        }
        return true;
      }),
    body('lab_result_glucose')
      .isFloat({ min: 0 }).withMessage('Lab result glucose must be a positive number'),
    body('lab_result_bp')
      .trim()
      .notEmpty().withMessage('Lab result BP is required'),
    body('previous_visit_gap_days')
      .isInt({ min: 0 }).withMessage('Previous visit gap days must be a non-negative integer'),
    body('readmitted_within_30_days')
      .isBoolean().withMessage('Readmitted within 30 days must be true or false'),
    body('visit_cost')
      .isFloat({ min: 0 }).withMessage('Visit cost must be a positive number')
  ],
  update: [
    param('id')
      .trim()
      .notEmpty().withMessage('Visit ID is required'),
    body('severity_score')
      .optional()
      .isInt({ min: 0, max: 5 }).withMessage('Severity score must be an integer between 0 and 5'),
    body('visit_type')
      .optional()
      .isIn(['OP', 'IP']).withMessage('Visit type must be OP or IP'),
    body('length_of_stay')
      .optional()
      .isInt({ min: 0 }).withMessage('Length of stay must be a non-negative integer'),
    body('visit_cost')
      .optional()
      .isFloat({ min: 0 }).withMessage('Visit cost must be a positive number')
  ],
  getById: [
    param('id')
      .trim()
      .notEmpty().withMessage('Visit ID is required')
  ]
};

module.exports = visitValidation;
