const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      // Optional — Google (OAuth) accounts have no password.
      minlength: [8, 'Password must be at least 8 characters'],
      select: false
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    settings: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'light'
      },
      notifications: {
        deadlineReminders: { type: Boolean, default: true },
        overdueAlerts: { type: Boolean, default: true },
        quizCompleted: { type: Boolean, default: true },
        streakMilestones: { type: Boolean, default: true }
      },
      ai: {
        defaultContext: { type: String, default: '' },
        summaryLength: {
          type: String,
          enum: ['short', 'medium', 'detailed'],
          default: 'medium'
        }
      }
    },
    pomodoro: {
      studyMinutes: { type: Number, default: 25 },
      breakMinutes: { type: Number, default: 5 },
      longBreakMinutes: { type: Number, default: 15 },
      sessionsPerLongBreak: { type: Number, default: 4 }
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Return safe user object (no password)
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
