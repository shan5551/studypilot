const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'short-answer'],
      required: true
    },
    question: { type: String, required: true },
    options: [String],
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: '' },
    topic: { type: String, default: '' }
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    source: {
      type: {
        type: String,
        enum: ['note', 'subject'],
        required: true
      },
      noteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note',
        default: null
      },
      subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        default: null
      }
    },
    questions: [questionSchema],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    questionType: {
      type: String,
      enum: ['mixed', 'multiple-choice', 'true-false', 'short-answer'],
      default: 'mixed'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Quiz', quizSchema);
