const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: true,
      message: 'Validation failed',
      details
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      error: true,
      message: `Duplicate value for ${field}`,
      details: [`${field}: ${err.keyValue[field]} already exists`]
    });
  }

  // Mongoose CastError (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: true,
      message: 'Invalid data format',
      details: [`Invalid ${err.path}: ${err.value}`]
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: true,
      message: 'Invalid token',
      details: []
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal server error',
    details: []
  });
};

module.exports = errorHandler;
