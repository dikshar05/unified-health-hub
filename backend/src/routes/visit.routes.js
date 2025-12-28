const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { adminOrDoctor, adminOnly } = require('../middleware/role');
const visitValidation = require('../validators/visit.schema');
const {
  createVisit,
  getAllVisits,
  getVisitById,
  updateVisit,
  deleteVisit,
  getPatientSeverityTrend
} = require('../controllers/visit.controller');

// All routes require authentication
router.use(auth);

// POST /api/visits (Admin only)
router.post('/', adminOnly, visitValidation.create, createVisit);

// GET /api/visits (Admin sees all, Doctor sees own)
router.get('/', adminOrDoctor, getAllVisits);

// GET /api/visits/severity-trend/:patientId
router.get('/severity-trend/:patientId', adminOrDoctor, getPatientSeverityTrend);

// GET /api/visits/:id
router.get('/:id', adminOrDoctor, visitValidation.getById, getVisitById);

// PUT /api/visits/:id (Admin only)
router.put('/:id', adminOnly, visitValidation.update, updateVisit);

// DELETE /api/visits/:id (Admin only)
router.delete('/:id', adminOnly, visitValidation.getById, deleteVisit);

module.exports = router;
