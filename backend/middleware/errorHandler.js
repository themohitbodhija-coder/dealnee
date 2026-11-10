const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'MulterError') {
    return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      message: err.code === 'LIMIT_FILE_SIZE' ? 'Image exceeds the 5MB limit' : 'Invalid image upload',
    });
  }

  // Mongoose duplicate key error
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid resource identifier or field value' });
  }
  if (err.code === 11000) {
    return res.status(400).json({
      message: `Duplicate field value: ${Object.keys(err.keyPattern)[0]}`,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
