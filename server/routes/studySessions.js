const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSessions,
  startSession,
  endSession,
  deleteSession
} = require('../controllers/studySessionController');

router.use(protect);

router.route('/')
  .get(getSessions);

router.post('/start', startSession);
router.post('/:id/end', endSession);
router.delete('/:id', deleteSession);

module.exports = router;
