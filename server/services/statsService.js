const Task = require('../models/Task');
const Subject = require('../models/Subject');
const Note = require('../models/Note');
const StudySession = require('../models/StudySession');
const QuizAttempt = require('../models/QuizAttempt');

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfWeek = (d) => {
  const day = startOfDay(d);
  const diff = (day.getDay() + 6) % 7; // Monday start
  day.setDate(day.getDate() - diff);
  return day;
};
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);

// Build aggregate stats for AI recommendations
const buildStatsForRecommendation = async (userId) => {
  const now = new Date();

  const [subjects, tasks, sessions, attempts, recentSessions] = await Promise.all([
    Subject.find({ user: userId, archived: false }).select('name color'),
    Task.find({ user: userId }).select('title subject priority status dueDate tags'),
    StudySession.find({ user: userId }).select('subject durationMinutes startedAt'),
    QuizAttempt.find({ user: userId }).select('subject percentage weakTopics createdAt'),
    StudySession.find({ user: userId }).select('startedAt durationMinutes').sort({ startedAt: -1 }).limit(30)
  ]);

  // Study time per subject
  const subjectStudy = {};
  sessions.forEach((s) => {
    const key = s.subject ? String(s.subject) : 'general';
    subjectStudy[key] = (subjectStudy[key] || 0) + (s.durationMinutes || 0);
  });

  const incompleteHighPriority = tasks.filter(
    (t) => t.status !== 'completed' && (t.priority === 'high' || t.priority === 'urgent')
  ).slice(0, 5);

  const overdue = tasks.filter(
    (t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now
  ).slice(0, 5);

  const upcoming = tasks.filter(
    (t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) >= now
  ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);

  // Weak topics
  const weakTopicCounts = {};
  attempts.forEach((a) => {
    (a.weakTopics || []).forEach((t) => {
      weakTopicCounts[t] = (weakTopicCounts[t] || 0) + 1;
    });
  });
  const weakTopics = Object.entries(weakTopicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);

  // Subject quiz performance
  const subjectScores = {};
  attempts.forEach((a) => {
    const key = a.subject ? String(a.subject) : 'general';
    if (!subjectScores[key]) subjectScores[key] = [];
    subjectScores[key].push(a.percentage);
  });

  // Subject names lookup
  const subjectNames = {};
  subjects.forEach((s) => { subjectNames[String(s._id)] = s.name; });

  // Lowest-studied subjects
  const lowestStudied = Object.entries(subjectStudy)
    .filter(([, mins]) => mins < 60)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([id, mins]) => ({ name: subjectNames[id] || 'Unnamed', minutes: Math.round(mins) }));

  // Last study activity
  const lastStudy = recentSessions.length > 0 ? recentSessions[0].startedAt : null;
  const daysSinceLastStudy = lastStudy
    ? Math.floor((now - new Date(lastStudy)) / (1000 * 60 * 60 * 24))
    : null;

  return {
    subjects: subjects.map((s) => ({
      name: s.name,
      studyMinutes: Math.round(subjectStudy[String(s._id)] || 0),
      avgQuizScore: subjectScores[String(s._id)]?.length
        ? Math.round(subjectScores[String(s._id)].reduce((a, b) => a + b, 0) / subjectScores[String(s._id)].length)
        : null
    })),
    lowestStudiedSubjects: lowestStudied,
    incompleteHighPriority: incompleteHighPriority.map((t) => ({
      title: t.title,
      subject: t.subject ? subjectNames[String(t.subject)] : 'General',
      priority: t.priority
    })),
    overdueTasks: overdue.map((t) => ({
      title: t.title,
      subject: t.subject ? subjectNames[String(t.subject)] : 'General'
    })),
    upcomingDeadlines: upcoming.map((t) => ({
      title: t.title,
      subject: t.subject ? subjectNames[String(t.subject)] : 'General',
      dueDate: t.dueDate
    })),
    weakTopics,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === 'completed').length,
    daysSinceLastStudy,
    totalQuizAttempts: attempts.length,
    overallAvgScore: attempts.length
      ? Math.round(attempts.reduce((a, b) => a + b.percentage, 0) / attempts.length)
      : null
  };
};

module.exports = {
  buildStatsForRecommendation,
  startOfDay,
  startOfWeek,
  startOfMonth
};
