const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header (Bearer scheme)
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided. Authorization denied.' });
    }

    // Verify access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please refresh your token.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

const adminMiddleware = (req, res, next) => {
  // Allow 'admin' or 'subadmin' if they have 'manage_admin' permission
  if (req.user.role === 'admin') return next();

  if (req.user.role === 'subadmin' && req.user.permissions?.includes('manage_admin')) {
    return next();
  }

  return res.status(403).json({ message: 'Access denied. Admin only.' });
};

// Middleware to require a specific permission
const requirePermission = (permission) => (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (req.user.permissions && req.user.permissions.includes(permission)) return next();
  return res.status(403).json({ message: 'Access denied. Missing permission: ' + permission });
};

module.exports = { authMiddleware, adminMiddleware, requirePermission };

