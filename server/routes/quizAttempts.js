const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getAttempts, submitAttempt, deleteAttempt } = require('../controllers/quizAttemptController');

router.use(protect);

router.route('/')
  .get(getAttempts)
  .post(submitAttempt);

router.delete('/:id', deleteAttempt);

module.exports = router;
