const Patient = require('../models/Patient');
const { validationResult } = require('express-validator');
const { generatePatientId } = require('../utils/idGenerator');

const createPatient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: true,
        message: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    // Check for duplicate patient_id
    const existingPatient = await Patient.findOne({ patient_id: req.body.patient_id });
    if (existingPatient) {
      return res.status(400).json({
        error: true,
        message: 'Patient ID already exists',
        details: [`patient_id ${req.body.patient_id} is already in use`]
      });
    }

    const patient = new Patient(req.body);
    await patient.save();

    res.status(201).json({
      error: false,
      message: 'Patient created successfully',
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

const getAllPatients = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { full_name: { $regex: search, $options: 'i' } },
          { patient_id: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [patients, total] = await Promise.all([
      Patient.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Patient.countDocuments(query)
    ]);

    res.json({
      error: false,
      message: 'Patients retrieved successfully',
      data: {
        patients,
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

const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ patient_id: req.params.id });
    
    if (!patient) {
      return res.status(404).json({
        error: true,
        message: 'Patient not found',
        details: []
      });
    }

    res.json({
      error: false,
      message: 'Patient retrieved successfully',
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

const updatePatient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: true,
        message: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const patient = await Patient.findOneAndUpdate(
      { patient_id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        error: true,
        message: 'Patient not found',
        details: []
      });
    }

    res.json({
      error: false,
      message: 'Patient updated successfully',
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

const deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findOneAndDelete({ patient_id: req.params.id });

    if (!patient) {
      return res.status(404).json({
        error: true,
        message: 'Patient not found',
        details: []
      });
    }

    res.json({
      error: false,
      message: 'Patient deleted successfully',
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient
};
