const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { dashboard, analytics } = require('../controllers/analyticsController');

router.use(protect);

router.get('/dashboard', dashboard);
router.get('/', analytics);

module.exports = router;
