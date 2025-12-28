const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  prescription_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  visit_id: {
    type: String,
    required: true,
    ref: 'Visit'
  },
  patient_id: {
    type: String,
    required: true,
    ref: 'Patient'
  },
  doctor_id: {
    type: String,
    required: true,
    ref: 'Doctor'
  },
  diagnosis_id: {
    type: String,
    required: true,
    trim: true
  },
  diagnosis_description: {
    type: String,
    required: true,
    trim: true
  },
  drug_name: {
    type: String,
    required: true,
    trim: true
  },
  drug_category: {
    type: String,
    required: true,
    trim: true
  },
  dosage: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  days_supply: {
    type: Number,
    required: true,
    min: 1
  },
  prescribed_date: {
    type: Date,
    required: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for faster queries
prescriptionSchema.index({ doctor_id: 1 });
prescriptionSchema.index({ patient_id: 1 });
prescriptionSchema.index({ visit_id: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
