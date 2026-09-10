const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
  googleAuth,
  googleCallback
} = require('../controllers/authController');
const { registerValidator, loginValidator, verifyEmailValidator, emailValidator, resetPasswordValidator } = require('../validators/authValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/verify-email', verifyEmailValidator, validate, verifyEmail);
router.post('/resend-verification', emailValidator, validate, resendVerification);
router.post('/forgot-password', emailValidator, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, resetPassword);
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.get('/me', protect, getMe);

module.exports = router;