const Visit = require('../models/Visit');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { validationResult } = require('express-validator');

const createVisit = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: true,
        message: 'Validation failed',
        details: errors.array().map(e => e.msg)
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

    // Verify doctor exists
    const doctor = await Doctor.findOne({ doctor_id: req.body.doctor_id });
    if (!doctor) {
      return res.status(400).json({
        error: true,
        message: 'Doctor not found',
        details: [`doctor_id ${req.body.doctor_id} does not exist`]
      });
    }

    // Check for duplicate visit_id
    const existingVisit = await Visit.findOne({ visit_id: req.body.visit_id });
    if (existingVisit) {
      return res.status(400).json({
        error: true,
        message: 'Visit ID already exists',
        details: [`visit_id ${req.body.visit_id} is already in use`]
      });
    }

    const visit = new Visit(req.body);
    await visit.save();

    res.status(201).json({
      error: false,
      message: 'Visit created successfully',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

const getAllVisits = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const user = req.user;
    
    let query = {};

    // If doctor, only show their visits
    if (user.role === 'doctor') {
      query.doctor_id = user.doctor_id;
    }

    if (search) {
      query.$or = [
        { visit_id: { $regex: search, $options: 'i' } },
        { patient_id: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [visits, total] = await Promise.all([
      Visit.find(query)
        .sort({ visit_date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Visit.countDocuments(query)
    ]);

    // Enrich with patient and doctor names
    const patientIds = [...new Set(visits.map(v => v.patient_id))];
    const doctorIds = [...new Set(visits.map(v => v.doctor_id))];

    const [patients, doctors] = await Promise.all([
      Patient.find({ patient_id: { $in: patientIds } }).select('patient_id full_name'),
      Doctor.find({ doctor_id: { $in: doctorIds } }).select('doctor_id doctor_name doctor_speciality')
    ]);

    const patientMap = Object.fromEntries(patients.map(p => [p.patient_id, p]));
    const doctorMap = Object.fromEntries(doctors.map(d => [d.doctor_id, d]));

    const enrichedVisits = visits.map(visit => ({
      ...visit.toObject(),
      patient_name: patientMap[visit.patient_id]?.full_name || 'Unknown',
      doctor_name: doctorMap[visit.doctor_id]?.doctor_name || 'Unknown',
      doctor_speciality: doctorMap[visit.doctor_id]?.doctor_speciality || 'Unknown'
    }));

    res.json({
      error: false,
      message: 'Visits retrieved successfully',
      data: {
        visits: enrichedVisits,
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

const getVisitById = async (req, res, next) => {
  try {
    const user = req.user;
    let query = { visit_id: req.params.id };

    // If doctor, ensure they can only access their visits
    if (user.role === 'doctor') {
      query.doctor_id = user.doctor_id;
    }

    const visit = await Visit.findOne(query);
    
    if (!visit) {
      return res.status(404).json({
        error: true,
        message: 'Visit not found',
        details: []
      });
    }

    res.json({
      error: false,
      message: 'Visit retrieved successfully',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

const updateVisit = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: true,
        message: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const visit = await Visit.findOneAndUpdate(
      { visit_id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!visit) {
      return res.status(404).json({
        error: true,
        message: 'Visit not found',
        details: []
      });
    }

    res.json({
      error: false,
      message: 'Visit updated successfully',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

const deleteVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findOneAndDelete({ visit_id: req.params.id });

    if (!visit) {
      return res.status(404).json({
        error: true,
        message: 'Visit not found',
        details: []
      });
    }

    res.json({
      error: false,
      message: 'Visit deleted successfully',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

// Get severity trend for a patient
const getPatientSeverityTrend = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const user = req.user;

    let query = { patient_id: patientId };
    
    // If doctor, only show their visits for the patient
    if (user.role === 'doctor') {
      query.doctor_id = user.doctor_id;
    }

    const visits = await Visit.find(query)
      .sort({ visit_date: 1 })
      .select('visit_id visit_date severity_score');

    const trend = visits.map((visit, index) => {
      let status = 'no_change';
      if (index > 0) {
        const prevScore = visits[index - 1].severity_score;
        if (visit.severity_score > prevScore) status = 'increased';
        else if (visit.severity_score < prevScore) status = 'improved';
      }
      return {
        ...visit.toObject(),
        trend_status: status
      };
    });

    res.json({
      error: false,
      message: 'Severity trend retrieved successfully',
      data: trend
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVisit,
  getAllVisits,
  getVisitById,
  updateVisit,
  deleteVisit,
  getPatientSeverityTrend
};
