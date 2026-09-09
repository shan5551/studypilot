const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Private
const getQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ user: req.user._id })
      .populate('source.noteId', 'title')
      .populate('source.subjectId', 'name color')
      .sort({ createdAt: -1 });

    res.json({ success: true, quizzes });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Private
const getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id });
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }
    res.json({ success: true, quiz });
  } catch (error) {
    next(error);
  }
};

// @desc    Create quiz (from AI-generated content)
// @route   POST /api/quizzes
// @access  Private
const createQuiz = async (req, res, next) => {
  try {
    const { title, source, questions, difficulty, questionType } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: 'Quiz must contain questions' });
    }

    // Validate each question
    for (const q of questions) {
      if (!q.question || !q.correctAnswer) {
        return res.status(400).json({ success: false, error: 'Invalid question format' });
      }
    }

    const quiz = await Quiz.create({
      user: req.user._id,
      title,
      source,
      questions,
      difficulty: difficulty || 'medium',
      questionType: questionType || 'mixed'
    });

    res.status(201).json({ success: true, quiz });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private
const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id });
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }
    await QuizAttempt.deleteMany({ quiz: quiz._id });
    await quiz.deleteOne();
    res.json({ success: true, message: 'Quiz deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getQuizzes, getQuiz, createQuiz, deleteQuiz };
