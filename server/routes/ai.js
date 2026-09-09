const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');
const {
  chat,
  summarize,
  generateQuiz,
  explain,
  recommend,
  getConversations,
  getConversation,
  deleteConversation
} = require('../controllers/aiController');

router.use(protect);

// Apply rate limiting to AI generation endpoints
router.post('/chat', aiLimiter, chat);
router.post('/summarize', aiLimiter, summarize);
router.post('/generate-quiz', aiLimiter, generateQuiz);
router.post('/explain', aiLimiter, explain);
router.post('/recommend', aiLimiter, recommend);

router.route('/conversations')
  .get(getConversations);
router.route('/conversations/:id')
  .get(getConversation)
  .delete(deleteConversation);

module.exports = router;
