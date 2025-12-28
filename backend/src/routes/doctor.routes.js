const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');
const doctorValidation = require('../validators/doctor.schema');
const {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
} = require('../controllers/doctor.controller');

// All routes require authentication and admin role
router.use(auth, adminOnly);

// POST /api/doctors
router.post('/', doctorValidation.create, createDoctor);

// GET /api/doctors
router.get('/', getAllDoctors);

// GET /api/doctors/:id
router.get('/:id', doctorValidation.getById, getDoctorById);

// PUT /api/doctors/:id
router.put('/:id', doctorValidation.update, updateDoctor);

// DELETE /api/doctors/:id
router.delete('/:id', doctorValidation.getById, deleteDoctor);

module.exports = router;
