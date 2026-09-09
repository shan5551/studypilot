const Notification = require('../models/Notification');
const Task = require('../models/Task');

// @desc    Get notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    // Generate deadline-related notifications on the fly (kept simple)
    await generateDeadlineNotifications(req.user._id);

    const unreadCount = notifications.filter((n) => !n.read).length;
    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    notification.read = true;
    await notification.save();
    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    await notification.deleteOne();
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

// Helper: generate deadline/overdue notifications (idempotent per task)
const generateDeadlineNotifications = async (userId) => {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await Task.find({
      user: userId,
      status: { $ne: 'completed' },
      dueDate: { $lte: tomorrow }
    }).select('title dueDate');

    for (const task of tasks) {
      const isOverdue = new Date(task.dueDate) < now;
      const type = isOverdue ? 'overdue' : 'deadline';
      const title = isOverdue ? 'Task overdue' : 'Deadline approaching';
      const message = isOverdue
        ? `"${task.title}" is overdue.`
        : `"${task.title}" is due ${new Date(task.dueDate).toLocaleDateString()}.`;

      const exists = await Notification.findOne({
        user: userId,
        relatedId: task._id,
        type,
        read: false
      });
      if (!exists) {
        await Notification.create({
          user: userId,
          type,
          title,
          message,
          relatedId: task._id
        });
      }
    }
  } catch (e) {
    // Non-fatal
  }
};

module.exports = { getNotifications, markRead, markAllRead, deleteNotification };
