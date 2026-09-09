// Centralized error handler
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Always log the real error so it's visible in server logs (Render, etc.),
  // even though the response body stays generic in production.
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (err.stack) console.error(err.stack);
  else console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = { statusCode: 400, message: 'Resource not found' };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = { statusCode: 400, message: `${field} already exists` };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = { statusCode: 400, message };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = { statusCode: 401, message: 'Invalid token' };
  }
  if (err.name === 'TokenExpiredError') {
    error = { statusCode: 401, message: 'Token expired' };
  }

  const statusCode = error.statusCode || err.statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Server error'
    : (error.message || 'Server error');

  res.status(statusCode).json({
    success: false,
    error: message
  });
};

module.exports = { errorHandler };
