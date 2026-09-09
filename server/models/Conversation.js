const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'New conversation'
    },
    context: {
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
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Conversation', conversationSchema);
