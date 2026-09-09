const Task = require('../models/Task');
const Subject = require('../models/Subject');
const Note = require('../models/Note');
const StudySession = require('../models/StudySession');
const QuizAttempt = require('../models/QuizAttempt');
const { startOfDay, startOfWeek, startOfMonth } = require('../services/statsService');

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
const dashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const [tasks, subjects, notes, sessions, attempts] = await Promise.all([
      Task.find({ user: userId }),
      Subject.find({ user: userId, archived: false }),
      Note.find({ user: userId }).sort({ updatedAt: -1 }).limit(5).select('title updatedAt subject favorite'),
      StudySession.find({ user: userId }),
      QuizAttempt.find({ user: userId })
    ]);

    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const pendingTasks = tasks.filter((t) => t.status !== 'completed').length;

    // Study hours: today, week, month, all-time
    const studyMinutes = (start) => sessions
      .filter((s) => s.startedAt >= start)
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    const todayMinutes = studyMinutes(startOfDay(now));
    const weekMinutes = studyMinutes(startOfWeek(now));
    const monthMinutes = studyMinutes(startOfMonth(now));
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    // Quiz stats
    const quizAvg = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
      : 0;

    // Streak calculation
    const { currentStreak, longestStreak } = calculateStreak(sessions, tasks);

    // Weekly study hours (last 7 days) for chart
    const weeklyStudyHours = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const minutes = sessions
        .filter((s) => s.startedAt >= dayStart && s.startedAt < dayEnd)
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      weeklyStudyHours.push({
        day: day.toLocaleDateString('en-US', { weekday: 'short' }),
        hours: Math.round(minutes / 6) / 10
      });
    }

    // Today's focus (top priority pending tasks)
    const todayFocus = tasks
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority))
      .slice(0, 5)
      .map((t) => ({ ...t.toObject(), subjectName: subjectName(subjects, t.subject) }));

    // Upcoming deadlines
    const upcomingDeadlines = tasks
      .filter((t) => t.status !== 'completed' && t.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5)
      .map((t) => ({ ...t.toObject(), subjectName: subjectName(subjects, t.subject) }));

    // Task completion for chart
    const taskCompletion = {
      completed: completedTasks,
      pending: pendingTasks
    };

    res.json({
      success: true,
      stats: {
        completedTasks,
        pendingTasks,
        totalTasks: tasks.length,
        subjectsCount: subjects.length,
        notesCount: notes.length,
        todayMinutes,
        weekMinutes,
        monthMinutes,
        totalMinutes,
        studyHours: Math.round((totalMinutes / 60) * 10) / 10,
        quizAvg,
        quizAttempts: attempts.length,
        currentStreak,
        longestStreak
      },
      weeklyStudyHours,
      taskCompletion,
      todayFocus,
      upcomingDeadlines,
      recentNotes: notes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get full analytics
// @route   GET /api/analytics
// @access  Private
const analytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const [tasks, subjects, sessions, attempts] = await Promise.all([
      Task.find({ user: userId }),
      Subject.find({ user: userId, archived: false }),
      StudySession.find({ user: userId }),
      QuizAttempt.find({ user: userId }).populate('subject', 'name')
    ]);

    // ---- Study time ----
    const studyMinutes = (start) => sessions
      .filter((s) => s.startedAt >= start)
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    const todayMinutes = studyMinutes(startOfDay(now));
    const weekMinutes = studyMinutes(startOfWeek(now));
    const monthMinutes = studyMinutes(startOfMonth(now));
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    // Daily study hours for the last 30 days
    const dailyStudy = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const minutes = sessions
        .filter((s) => s.startedAt >= dayStart && s.startedAt < dayEnd)
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      dailyStudy.push({
        date: day.toISOString().slice(0, 10),
        minutes: Math.round(minutes)
      });
    }

    // Weekly study hours (last 8 weeks)
    const weeklyStudy = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(startOfWeek(now));
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      const minutes = sessions
        .filter((s) => s.startedAt >= weekStart && s.startedAt < weekEnd)
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      weeklyStudy.push({
        week: weekStart.toISOString().slice(0, 10),
        hours: Math.round(minutes / 6) / 10
      });
    }

    // ---- Task performance ----
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending = tasks.filter((t) => t.status !== 'completed').length;
    const overdue = tasks.filter(
      (t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now
    ).length;

    // Tasks by priority
    const byPriority = ['urgent', 'high', 'medium', 'low'].map((p) => ({
      priority: p,
      count: tasks.filter((t) => t.priority === p).length
    }));

    // ---- Quiz performance ----
    const quizAvg = attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
      : 0;

    // Per-subject quiz scores
    const subjectScores = {};
    attempts.forEach((a) => {
      const key = a.subject ? String(a.subject._id) : 'general';
      if (!subjectScores[key]) subjectScores[key] = { name: a.subject?.name || 'General', scores: [] };
      subjectScores[key].scores.push(a.percentage);
    });

    let bestSubject = null;
    let weakestSubject = null;
    Object.values(subjectScores).forEach((s) => {
      const avg = Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length);
      if (!bestSubject || avg > bestSubject.avg) bestSubject = { name: s.name, avg };
      if (!weakestSubject || avg < weakestSubject.avg) weakestSubject = { name: s.name, avg };
    });

    // Quiz performance over last attempts
    const quizTrend = attempts
      .slice()
      .reverse()
      .map((a) => ({ label: a.createdAt.toISOString().slice(0, 10), score: a.percentage }));

    // ---- Subject progress ----
    const subjectProgress = await Promise.all(
      subjects.map(async (s) => {
        const sTasks = tasks.filter((t) => String(t.subject) === String(s._id));
        const sSessions = sessions.filter((ss) => ss.subject && String(ss.subject) === String(s._id));
        const completedCount = sTasks.filter((t) => t.status === 'completed').length;
        const progress = sTasks.length > 0 ? Math.round((completedCount / sTasks.length) * 100) : 0;
        return {
          name: s.name,
          color: s.color,
          tasks: sTasks.length,
          completed: completedCount,
          progress,
          studyMinutes: Math.round(sSessions.reduce((sum, ss) => sum + (ss.durationMinutes || 0), 0))
        };
      })
    );

    // Streaks
    const { currentStreak, longestStreak } = calculateStreak(sessions, tasks);

    // Activity heatmap data (last 16 weeks)
    const activity = buildActivityHeatmap(sessions);

    res.json({
      success: true,
      analytics: {
        studyTime: { todayMinutes, weekMinutes, monthMinutes, totalMinutes, dailyStudy, weeklyStudy },
        tasks: { completed, pending, overdue, total: tasks.length, byPriority },
        quiz: { avgScore: quizAvg, attempts: attempts.length, bestSubject, weakestSubject, trend: quizTrend },
        subjects: subjectProgress,
        streaks: { currentStreak, longestStreak },
        activity
      }
    });
  } catch (error) {
    next(error);
  }
};

// ---- Helpers ----
const priorityWeight = (p) => ({ urgent: 4, high: 3, medium: 2, low: 1 }[p] || 0);

const subjectName = (subjects, id) => {
  const s = subjects.find((x) => String(x._id) === String(id));
  return s ? s.name : 'General';
};

const calculateStreak = (sessions, tasks) => {
  // Collect all active dates from study sessions and task completions
  const activeDates = new Set();

  sessions.forEach((s) => {
    if (s.durationMinutes && s.durationMinutes > 0) {
      activeDates.add(startOfDay(s.startedAt).toDateString());
    }
  });
  tasks.forEach((t) => {
    if (t.completedAt) {
      activeDates.add(startOfDay(t.completedAt).toDateString());
    }
  });

  const today = startOfDay(new Date()).toDateString();
  const isActiveToday = activeDates.has(today);

  // Current streak: count back from today (or yesterday if inactive today)
  let currentStreak = 0;
  let cursor = new Date();
  if (!isActiveToday) cursor.setDate(cursor.getDate() - 1);

  while (activeDates.has(startOfDay(cursor).toDateString())) {
    currentStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Longest streak
  let longestStreak = 0;
  let running = 0;
  const sortedDates = [...activeDates].map((d) => new Date(d)).sort((a, b) => a - b);
  let prev = null;
  sortedDates.forEach((d) => {
    if (prev && (d - prev) === 24 * 60 * 60 * 1000) {
      running++;
    } else {
      running = 1;
    }
    if (running > longestStreak) longestStreak = running;
    prev = d;
  });

  return { currentStreak, longestStreak };
};

const buildActivityHeatmap = (sessions) => {
  const now = new Date();
  const weeks = 16;
  const cells = [];
  const counts = {};

  sessions.forEach((s) => {
    if (s.durationMinutes && s.durationMinutes > 0) {
      const key = startOfDay(s.startedAt).toDateString();
      counts[key] = (counts[key] || 0) + (s.durationMinutes / 60);
    }
  });

  const endWeekStart = startOfWeek(now);
  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = new Date(endWeekStart);
    weekStart.setDate(weekStart.getDate() - w * 7);
    const weekCells = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + d);
      if (day > now) break;
      const hours = counts[startOfDay(day).toDateString()] || 0;
      weekCells.push({ date: day.toISOString().slice(0, 10), hours: Math.round(hours * 10) / 10 });
    }
    cells.push(weekCells);
  }
  return cells;
};

module.exports = { dashboard, analytics };
