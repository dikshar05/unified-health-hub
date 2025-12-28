const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({
  doctor_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  doctor_name: {
    type: String,
    required: true,
    trim: true
  },
  user_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  doctor_speciality: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'doctor'],
    default: 'doctor'
  }
}, {
  timestamps: true
});

// Hash password before saving
doctorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
doctorSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Index for faster queries
doctorSchema.index({ user_id: 1 });
doctorSchema.index({ doctor_id: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
