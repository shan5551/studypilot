const QuizAttempt = require('../models/QuizAttempt');

// @desc    Get all quiz attempts
// @route   GET /api/quiz-attempts
// @access  Private
const getAttempts = async (req, res, next) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user._id })
      .populate('quiz', 'title difficulty')
      .populate('subject', 'name color')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 100);

    res.json({ success: true, attempts });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a quiz attempt
// @route   POST /api/quiz-attempts
// @access  Private
const submitAttempt = async (req, res, next) => {
  try {
    const { quizId, answers, questions } = req.body;

    // If full question data is provided (generated quiz not yet saved),
    // we compute results from it directly.
    if (questions && Array.isArray(questions)) {
      let score = 0;
      const graded = questions.map((q, i) => {
        const userAnswer = answers && answers[i] !== undefined ? answers[i] : '';
        const correct = normalize(userAnswer) === normalize(q.correctAnswer);
        if (correct) score++;
        return { questionId: q._id || String(i), userAnswer, correct };
      });

      const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
      const weakTopics = collectWeakTopics(questions, graded);

      const attempt = await QuizAttempt.create({
        user: req.user._id,
        quiz: quizId || null,
        subject: req.body.subject || null,
        score,
        total: questions.length,
        percentage,
        answers: graded,
        weakTopics
      });

      return res.status(201).json({ success: true, attempt });
    }

    // Otherwise fetch the quiz from DB
    const Quiz = require('../models/Quiz');
    const quiz = await Quiz.findOne({ _id: quizId, user: req.user._id });
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    let score = 0;
    const graded = quiz.questions.map((q, i) => {
      const userAnswer = answers && answers[i] !== undefined ? answers[i] : '';
      const correct = normalize(userAnswer) === normalize(q.correctAnswer);
      if (correct) score++;
      return { questionId: q._id || String(i), userAnswer, correct };
    });

    const percentage = quiz.questions.length > 0 ? Math.round((score / quiz.questions.length) * 100) : 0;
    const weakTopics = collectWeakTopics(quiz.questions, graded);

    const attempt = await QuizAttempt.create({
      user: req.user._id,
      quiz: quiz._id,
      subject: quiz.source?.subjectId || null,
      score,
      total: quiz.questions.length,
      percentage,
      answers: graded,
      weakTopics
    });

    res.status(201).json({ success: true, attempt });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an attempt
// @route   DELETE /api/quiz-attempts/:id
// @access  Private
const deleteAttempt = async (req, res, next) => {
  try {
    const attempt = await QuizAttempt.findOne({ _id: req.params.id, user: req.user._id });
    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Attempt not found' });
    }
    await attempt.deleteOne();
    res.json({ success: true, message: 'Attempt deleted' });
  } catch (error) {
    next(error);
  }
};

const normalize = (str) => String(str || '').trim().toLowerCase();

const collectWeakTopics = (questions, graded) => {
  const weak = new Set();
  questions.forEach((q, i) => {
    if (!graded[i].correct && q.topic) {
      weak.add(q.topic);
    }
  });
  return [...weak];
};

module.exports = { getAttempts, submitAttempt, deleteAttempt };
