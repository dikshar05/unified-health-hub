const Prescription = require('../models/Prescription');
const Visit = require('../models/Visit');
const Patient = require('../models/Patient');
const { validationResult } = require('express-validator');

const createPrescription = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: true,
        message: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const user = req.user;

    // Verify visit exists
    const visit = await Visit.findOne({ visit_id: req.body.visit_id });
    if (!visit) {
      return res.status(400).json({
        error: true,
        message: 'Visit not found',
        details: [`visit_id ${req.body.visit_id} does not exist`]
      });
    }

    // Ensure doctor can only prescribe for their own visits
    if (user.role === 'doctor' && visit.doctor_id !== user.doctor_id) {
      return res.status(403).json({
        error: true,
        message: 'Access denied. You can only add prescriptions for your own visits.',
        details: []
      });
    }

    // Verify patient exists
    const patient = await Patient.findOne({ patient_id: req.body.patient_id });
    if (!patient) {
      return res.status(400).json({
        error: true,
        message: 'Patient not found',
        details: [`patient_id ${req.body.patient_id} does not exist`]
      });
    }

    // Ensure patient_id matches the visit's patient
    if (visit.patient_id !== req.body.patient_id) {
      return res.status(400).json({
        error: true,
        message: 'Patient ID mismatch',
        details: ['The patient_id does not match the visit patient']
      });
    }

    // Check for duplicate prescription_id
    const existingPrescription = await Prescription.findOne({ prescription_id: req.body.prescription_id });
    if (existingPrescription) {
      return res.status(400).json({
        error: true,
        message: 'Prescription ID already exists',
        details: [`prescription_id ${req.body.prescription_id} is already in use`]
      });
    }

    // Auto-fill doctor_id from the visit
    req.body.doctor_id = visit.doctor_id;

    const prescription = new Prescription(req.body);
    await prescription.save();

    res.status(201).json({
      error: false,
      message: 'Prescription created successfully',
      data: prescription
    });
  } catch (error) {
    next(error);
  }
};

const getAllPrescriptions = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const user = req.user;
    
    // Doctors can only see their own prescriptions
    let query = {};
    if (user.role === 'doctor') {
      query.doctor_id = user.doctor_id;
    }

    if (search) {
      query.$or = [
        { prescription_id: { $regex: search, $options: 'i' } },
        { drug_name: { $regex: search, $options: 'i' } },
        { patient_id: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [prescriptions, total] = await Promise.all([
      Prescription.find(query)
        .sort({ prescribed_date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Prescription.countDocuments(query)
    ]);

    // Enrich with patient names
    const patientIds = [...new Set(prescriptions.map(p => p.patient_id))];
    const patients = await Patient.find({ patient_id: { $in: patientIds } }).select('patient_id full_name');
    const patientMap = Object.fromEntries(patients.map(p => [p.patient_id, p.full_name]));

    const enrichedPrescriptions = prescriptions.map(prescription => ({
      ...prescription.toObject(),
      patient_name: patientMap[prescription.patient_id] || 'Unknown'
    }));

    res.json({
      error: false,
      message: 'Prescriptions retrieved successfully',
      data: {
        prescriptions: enrichedPrescriptions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getPrescriptionById = async (req, res, next) => {
  try {
    const user = req.user;
    let query = { prescription_id: req.params.id };

    // If doctor, ensure they can only access their prescriptions
    if (user.role === 'doctor') {
      query.doctor_id = user.doctor_id;
    }

    const prescription = await Prescription.findOne(query);
    
    if (!prescription) {
      return res.status(404).json({
        error: true,
        message: 'Prescription not found',
        details: []
      });
    }

    res.json({
      error: false,
      message: 'Prescription retrieved successfully',
      data: prescription
    });
  } catch (error) {
    next(error);
  }
};

const updatePrescription = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: true,
        message: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const user = req.user;
    let query = { prescription_id: req.params.id };

    // If doctor, ensure they can only update their prescriptions
    if (user.role === 'doctor') {
      query.doctor_id = user.doctor_id;
    }

    const prescription = await Prescription.findOneAndUpdate(
      query,
      req.body,
      { new: true, runValidators: true }
    );

    if (!prescription) {
      return res.status(404).json({
        error: true,
        message: 'Prescription not found',
        details: []
      });
    }

    res.json({
      error: false,
      message: 'Prescription updated successfully',
      data: prescription
    });
  } catch (error) {
    next(error);
  }
};

const deletePrescription = async (req, res, next) => {
  try {
    const user = req.user;
    let query = { prescription_id: req.params.id };

    // If doctor, ensure they can only delete their prescriptions
    if (user.role === 'doctor') {
      query.doctor_id = user.doctor_id;
    }

    const prescription = await Prescription.findOneAndDelete(query);

    if (!prescription) {
      return res.status(404).json({
        error: true,
        message: 'Prescription not found',
        details: []
      });
    }

    res.json({
      error: false,
      message: 'Prescription deleted successfully',
      data: prescription
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription
};
