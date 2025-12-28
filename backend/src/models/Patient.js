const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patient_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 0,
    max: 150
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  blood_group: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  phone_number: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  emergency_contact: {
    type: String,
    required: true,
    trim: true
  },
  hospital_location: {
    type: String,
    required: true,
    trim: true
  },
  bmi: {
    type: Number,
    required: true,
    min: 0
  },
  smoker_status: {
    type: Boolean,
    required: true
  },
  alcohol_use: {
    type: Boolean,
    required: true
  },
  chronic_conditions: {
    type: [String],
    default: []
  },
  registration_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  insurance_type: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
patientSchema.index({ full_name: 'text' });
patientSchema.index({ patient_id: 1 });

module.exports = mongoose.model('Patient', patientSchema);
