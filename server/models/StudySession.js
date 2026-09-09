const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null
    },
    startedAt: {
      type: Date,
      required: true
    },
    endedAt: {
      type: Date,
      default: null
    },
    durationMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Duration cannot be negative']
    },
    mode: {
      type: String,
      enum: ['manual', 'pomodoro'],
      default: 'manual'
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

studySessionSchema.index({ user: 1, startedAt: -1 });

module.exports = mongoose.model('StudySession', studySessionSchema);
