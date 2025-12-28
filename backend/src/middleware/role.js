const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: true,
      message: 'Access denied. Admin privileges required.',
      details: []
    });
  }
  next();
};

const doctorOnly = (req, res, next) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({
      error: true,
      message: 'Access denied. Doctor privileges required.',
      details: []
    });
  }
  next();
};

const adminOrDoctor = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'doctor') {
    return res.status(403).json({
      error: true,
      message: 'Access denied. Authentication required.',
      details: []
    });
  }
  next();
};

module.exports = { adminOnly, doctorOnly, adminOrDoctor };
