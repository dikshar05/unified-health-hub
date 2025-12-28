const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'Access denied. No token provided.',
        details: []
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: true,
          message: 'Token has expired. Please login again.',
          details: []
        });
      }
      return res.status(401).json({
        error: true,
        message: 'Invalid token.',
        details: []
      });
    }
  } catch (error) {
    res.status(500).json({
      error: true,
      message: 'Authentication error.',
      details: [error.message]
    });
  }
};

module.exports = auth;
