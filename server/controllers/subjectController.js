const Subject = require('../models/Subject');
const Task = require('../models/Task');
const Note = require('../models/Note');
const StudySession = require('../models/StudySession');
const QuizAttempt = require('../models/QuizAttempt');

// @desc    Get all subjects with computed stats
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find({ user: req.user._id, archived: false }).sort({ createdAt: -1 });

    const subjectsWithStats = await Promise.all(
      subjects.map((s) => computeSubjectStats(s, req.user._id))
    );

    res.json({ success: true, subjects: subjectsWithStats });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single subject with full detail
// @route   GET /api/subjects/:id
// @access  Private
const getSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }

    const [stats, tasks, notes] = await Promise.all([
      computeSubjectStats(subject, req.user._id),
      Task.find({ user: req.user._id, subject: subject._id }).sort({ createdAt: -1 }),
      Note.find({ user: req.user._id, subject: subject._id }).sort({ updatedAt: -1 }).select('title content updatedAt tags favorite')
    ]);

    res.json({ success: true, subject: { ...subject.toObject(), ...stats }, tasks, notes });
  } catch (error) {
    next(error);
  }
};

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private
const createSubject = async (req, res, next) => {
  try {
    const subject = await Subject.create({
      user: req.user._id,
      name: req.body.name,
      description: req.body.description || '',
      color: req.body.color || '#6366f1',
      icon: req.body.icon || 'book',
      semester: req.body.semester || '',
      targetDate: req.body.targetDate || null
    });

    res.status(201).json({ success: true, subject: subject.toObject() });
  } catch (error) {
    next(error);
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private
const updateSubject = async (req, res, next) => {
  try {
    let subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }

    const allowed = ['name', 'description', 'color', 'icon', 'semester', 'targetDate', 'archived'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        subject[field] = req.body[field];
      }
    });

    await subject.save();
    res.json({ success: true, subject: subject.toObject() });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private
const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }

    // Delete associated data
    await Task.deleteMany({ subject: subject._id });
    await Note.deleteMany({ subject: subject._id });
    await subject.deleteOne();

    res.json({ success: true, message: 'Subject deleted' });
  } catch (error) {
    next(error);
  }
};

// Helper: compute stats for a subject
const computeSubjectStats = async (subject, userId) => {
  const [tasks, notes, sessions, attempts] = await Promise.all([
    Task.find({ user: userId, subject: subject._id }),
    Note.countDocuments({ user: userId, subject: subject._id }),
    StudySession.find({ user: userId, subject: subject._id }),
    QuizAttempt.find({ user: userId, subject: subject._id })
  ]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const studyMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const avgQuizScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
    : 0;

  return {
    ...subject.toObject(),
    totalTasks,
    completedTasks,
    pendingTasks: totalTasks - completedTasks,
    notesCount: notes,
    studyMinutes,
    studyHours: Math.round((studyMinutes / 60) * 10) / 10,
    avgQuizScore,
    attemptsCount: attempts.length,
    progress
  };
};

module.exports = { getSubjects, getSubject, createSubject, updateSubject, deleteSubject };
