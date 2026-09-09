const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getQuizzes, getQuiz, createQuiz, deleteQuiz } = require('../controllers/quizController');

router.use(protect);

router.route('/')
  .get(getQuizzes)
  .post(createQuiz);

router.route('/:id')
  .get(getQuiz)
  .delete(deleteQuiz);

module.exports = router;
