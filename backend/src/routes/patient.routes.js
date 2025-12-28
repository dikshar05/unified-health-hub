const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');
const patientValidation = require('../validators/patient.schema');
const {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient
} = require('../controllers/patient.controller');

// All routes require authentication and admin role
router.use(auth, adminOnly);

// POST /api/patients
router.post('/', patientValidation.create, createPatient);

// GET /api/patients
router.get('/', getAllPatients);

// GET /api/patients/:id
router.get('/:id', patientValidation.getById, getPatientById);

// PUT /api/patients/:id
router.put('/:id', patientValidation.update, updatePatient);

// DELETE /api/patients/:id
router.delete('/:id', patientValidation.getById, deletePatient);

module.exports = router;
