const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { adminOnly, doctorOnly } = require('../middleware/role');
const {
  uploadPatients,
  uploadVisits,
  uploadPrescriptions
} = require('../controllers/upload.controller');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// POST /api/upload/patients (Admin only)
router.post('/patients', auth, adminOnly, upload.single('file'), uploadPatients);

// POST /api/upload/visits (Admin only)
router.post('/visits', auth, adminOnly, upload.single('file'), uploadVisits);

// POST /api/upload/prescriptions (Doctor only)
router.post('/prescriptions', auth, doctorOnly, upload.single('file'), uploadPrescriptions);

module.exports = router;
