const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },
    color: {
      type: String,
      default: '#6366f1'
    },
    icon: {
      type: String,
      default: 'book'
    },
    semester: {
      type: String,
      trim: true,
      default: ''
    },
    targetDate: {
      type: Date,
      default: null
    },
    archived: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtuals
subjectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'subject'
});

subjectSchema.virtual('notes', {
  ref: 'Note',
  localField: '_id',
  foreignField: 'subject'
});

module.exports = mongoose.model('Subject', subjectSchema);
