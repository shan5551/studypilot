const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  updateSettings,
  changePassword,
  deleteAccount
} = require('../controllers/userController');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.delete('/profile', deleteAccount);
router.put('/settings', updateSettings);
router.put('/password', changePassword);

module.exports = router;
