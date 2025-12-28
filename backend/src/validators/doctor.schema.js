const { body, param } = require('express-validator');

const doctorValidation = {
  create: [
    body('doctor_id')
      .trim()
      .notEmpty().withMessage('Doctor ID is required'),
    body('doctor_name')
      .trim()
      .notEmpty().withMessage('Doctor name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Doctor name must be 2-100 characters'),
    body('user_id')
      .trim()
      .notEmpty().withMessage('User ID is required')
      .isLength({ min: 3, max: 50 }).withMessage('User ID must be 3-50 characters'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('doctor_speciality')
      .trim()
      .notEmpty().withMessage('Doctor speciality is required'),
    body('role')
      .optional()
      .isIn(['admin', 'doctor']).withMessage('Role must be admin or doctor')
  ],
  update: [
    param('id')
      .trim()
      .notEmpty().withMessage('Doctor ID is required'),
    body('doctor_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Doctor name must be 2-100 characters'),
    body('doctor_speciality')
      .optional()
      .trim()
      .notEmpty().withMessage('Doctor speciality cannot be empty'),
    body('password')
      .optional()
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  getById: [
    param('id')
      .trim()
      .notEmpty().withMessage('Doctor ID is required')
  ]
};

module.exports = doctorValidation;
