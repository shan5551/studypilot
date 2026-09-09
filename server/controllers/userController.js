const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile (name, email)
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = req.user;

    if (req.body.name) {
      user.name = req.body.name;
    }
    if (req.body.email) {
      const existing = await User.findOne({ email: req.body.email, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Email already in use' });
      }
      user.email = req.body.email;
    }

    await user.save();
    res.json({ success: true, user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

// @desc    Update settings
// @route   PUT /api/users/settings
// @access  Private
const updateSettings = async (req, res, next) => {
  try {
    const user = req.user;
    const { settings } = req.body;

    if (settings) {
      // Deep merge with defaults
      user.settings = {
        ...user.settings,
        ...settings,
        notifications: { ...user.settings.notifications, ...(settings.notifications || {}) },
        ai: { ...user.settings.ai, ...(settings.ai || {}) }
      };
    }
    if (req.body.pomodoro) {
      user.pomodoro = { ...user.pomodoro, ...req.body.pomodoro };
    }

    await user.save();
    res.json({ success: true, user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/users/password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Both passwords are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete account
// @route   DELETE /api/users/profile
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    const user = req.user;
    const { Task, Subject, Note, StudySession, Quiz, QuizAttempt, Conversation, Message, Notification } = require('../models');
    const mongoose = require('mongoose');

    const userId = user._id;
    await Promise.all([
      Task.deleteMany({ user: userId }),
      Subject.deleteMany({ user: userId }),
      Note.deleteMany({ user: userId }),
      StudySession.deleteMany({ user: userId }),
      Quiz.deleteMany({ user: userId }),
      QuizAttempt.deleteMany({ user: userId }),
      Notification.deleteMany({ user: userId })
    ]);

    const conversations = await Conversation.find({ user: userId }).select('_id');
    const conversationIds = conversations.map((c) => c._id);
    await Message.deleteMany({ conversation: { $in: conversationIds } });
    await Conversation.deleteMany({ user: userId });

    await user.deleteOne();

    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, updateSettings, changePassword, deleteAccount };
