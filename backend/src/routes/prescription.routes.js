const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { doctorOnly } = require('../middleware/role');
const prescriptionValidation = require('../validators/prescription.schema');
const {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription
} = require('../controllers/prescription.controller');

// All routes require authentication and doctor role
router.use(auth, doctorOnly);

// POST /api/prescriptions
router.post('/', prescriptionValidation.create, createPrescription);

// GET /api/prescriptions
router.get('/', getAllPrescriptions);

// GET /api/prescriptions/:id
router.get('/:id', prescriptionValidation.getById, getPrescriptionById);

// PUT /api/prescriptions/:id
router.put('/:id', prescriptionValidation.update, updatePrescription);

// DELETE /api/prescriptions/:id
router.delete('/:id', prescriptionValidation.getById, deletePrescription);

module.exports = router;
