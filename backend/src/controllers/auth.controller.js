const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

const login = async (req, res, next) => {
  try {
    const { user_id, password, portal } = req.body;

    if (!user_id || !password || !portal) {
      return res.status(400).json({
        error: true,
        message: 'User ID, password, and portal are required',
        details: []
      });
    }

    // Find user by user_id
    const user = await Doctor.findOne({ user_id });

    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Invalid credentials',
        details: []
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: true,
        message: 'Invalid credentials',
        details: []
      });
    }

    // Enforce portal-role restrictions
    if (portal === 'admin' && user.role !== 'admin') {
      return res.status(403).json({
        error: true,
        message: 'Access denied. Admin credentials required for Admin portal.',
        details: []
      });
    }

    if (portal === 'doctor' && user.role !== 'doctor') {
      return res.status(403).json({
        error: true,
        message: 'Access denied. Doctor credentials required for Doctor portal.',
        details: []
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        user_id: user.user_id,
        role: user.role,
        doctor_id: user.doctor_id,
        doctor_name: user.doctor_name,
        doctor_speciality: user.doctor_speciality
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    res.json({
      error: false,
      message: 'Login successful',
      data: {
        token,
        user: {
          user_id: user.user_id,
          role: user.role,
          doctor_id: user.doctor_id,
          doctor_name: user.doctor_name,
          doctor_speciality: user.doctor_speciality
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const verifyToken = async (req, res) => {
  // If middleware passed, token is valid
  res.json({
    error: false,
    message: 'Token is valid',
    data: {
      user: req.user
    }
  });
};

module.exports = { login, verifyToken };
