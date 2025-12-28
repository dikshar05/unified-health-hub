const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  visit_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
  visit_date: {
    type: Date,
    required: true
  },
  severity_score: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Severity score must be an integer between 0 and 5'
    }
  },
  visit_type: {
    type: String,
    required: true,
    enum: ['OP', 'IP']
  },
  length_of_stay: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value) {
        if (this.visit_type === 'OP') return value === 0;
        if (this.visit_type === 'IP') return value >= 1;
        return true;
      },
      message: 'OP visits must have length_of_stay = 0, IP visits must have length_of_stay >= 1'
    }
  },
  lab_result_glucose: {
    type: Number,
    required: true
  },
  lab_result_bp: {
    type: String,
    required: true,
    trim: true
  },
  previous_visit_gap_days: {
    type: Number,
    required: true,
    min: 0
  },
  readmitted_within_30_days: {
    type: Boolean,
    required: true
  },
  visit_cost: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for faster queries
visitSchema.index({ patient_id: 1 });
visitSchema.index({ doctor_id: 1 });
visitSchema.index({ visit_date: -1 });

module.exports = mongoose.model('Visit', visitSchema);
