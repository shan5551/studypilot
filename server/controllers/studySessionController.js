const StudySession = require('../models/StudySession');

// @desc    Get study sessions
// @route   GET /api/study-sessions
// @access  Private
const getSessions = async (req, res, next) => {
  try {
    const { limit = 100 } = req.query;
    const sessions = await StudySession.find({ user: req.user._id })
      .populate('subject', 'name color')
      .populate('task', 'title')
      .sort({ startedAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
};

// @desc    Start a session (or return active)
// @route   POST /api/study-sessions/start
// @access  Private
const startSession = async (req, res, next) => {
  try {
    // Close any existing active session
    await StudySession.updateMany(
      { user: req.user._id, endedAt: null, completed: false },
      {
        endedAt: new Date(),
        completed: true,
        $inc: { durationMinutes: 0 }
      }
    );

    const session = await StudySession.create({
      user: req.user._id,
      subject: req.body.subject || null,
      task: req.body.task || null,
      startedAt: new Date(),
      mode: req.body.mode || 'manual'
    });

    res.status(201).json({ success: true, session });
  } catch (error) {
    next(error);
  }
};

// @desc    End a session
// @route   POST /api/study-sessions/:id/end
// @access  Private
const endSession = async (req, res, next) => {
  try {
    const session = await StudySession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (session.endedAt) {
      return res.json({ success: true, session });
    }

    session.endedAt = new Date();
    session.durationMinutes = Math.max(
      0,
      Math.round((session.endedAt - session.startedAt) / 60000 * 10) / 10
    );
    session.completed = true;
    await session.save();

    res.json({ success: true, session });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a session
// @route   DELETE /api/study-sessions/:id
// @access  Private
const deleteSession = async (req, res, next) => {
  try {
    const session = await StudySession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    await session.deleteOne();
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSessions, startSession, endSession, deleteSession };
