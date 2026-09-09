const rateLimit = require('express-rate-limit');

// Stricter limiter for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: 'Too many AI requests. Please try again in a moment.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { aiLimiter };
