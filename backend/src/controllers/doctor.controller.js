const Doctor = require('../models/Doctor');
const { validationResult } = require('express-validator');
const { generateDoctorId } = require('../utils/idGenerator');

const createDoctor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: true,
        message: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    // Check for duplicate user_id
    const existingDoctor = await Doctor.findOne({ user_id: req.body.user_id });
    if (existingDoctor) {
      return res.status(400).json({
        error: true,
        message: 'User ID already exists',
        details: [`user_id ${req.body.user_id} is already in use`]
      });
    }

    // Generate doctor_id if not provided
    if (!req.body.doctor_id) {
      req.body.doctor_id = generateDoctorId();
    }

    // Default role to 'doctor' if not specified
    if (!req.body.role) {
      req.body.role = 'doctor';
    }

    const doctor = new Doctor(req.body);
    await doctor.save();

    // Don't return password in response
    const doctorResponse = doctor.toObject();
    delete doctorResponse.password;

    res.status(201).json({
      error: false,
      message: 'Doctor created successfully',
      data: doctorResponse
    });
  } catch (error) {
    next(error);
  }
};

const getAllDoctors = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { doctor_name: { $regex: search, $options: 'i' } },
          { doctor_id: { $regex: search, $options: 'i' } },
          { doctor_speciality: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Doctor.countDocuments(query)
    ]);

    res.json({
      error: false,
      message: 'Doctors retrieved successfully',
      data: {
        doctors,
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

const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ doctor_id: req.params.id }).select('-password');
    
    if (!doctor) {
      return res.status(404).json({
        error: true,
        message: 'Doctor not found',
        details: []
      });
    }

    res.json({
      error: false,
      message: 'Doctor retrieved successfully',
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};

const updateDoctor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: true,
        message: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const doctor = await Doctor.findOne({ doctor_id: req.params.id });

    if (!doctor) {
      return res.status(404).json({
        error: true,
        message: 'Doctor not found',
        details: []
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'doctor_id' && key !== 'user_id') {
        doctor[key] = req.body[key];
      }
    });

    await doctor.save();

    const doctorResponse = doctor.toObject();
    delete doctorResponse.password;

    res.json({
      error: false,
      message: 'Doctor updated successfully',
      data: doctorResponse
    });
  } catch (error) {
    next(error);
  }
};

const deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOneAndDelete({ doctor_id: req.params.id });

    if (!doctor) {
      return res.status(404).json({
        error: true,
        message: 'Doctor not found',
        details: []
      });
    }

    const doctorResponse = doctor.toObject();
    delete doctorResponse.password;

    res.json({
      error: false,
      message: 'Doctor deleted successfully',
      data: doctorResponse
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
};
