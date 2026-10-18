const Notification = require('../../shared/models/Notification');
const Issue = require('../../shared/models/Issue');
const User = require('../../shared/models/User');
const { sendPushNotification } = require('../../shared/services/notify');

const createNotification = async (recipientId, data) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: data.sender,
      issue: data.issue,
      type: data.type,
      message: data.message,
    });

    const user = await User.findById(recipientId);
    if (user && user.pushToken) {
      await sendPushNotification(user.pushToken, {
        title: data.title || 'Civics Report Update',
        body: data.message,
        data: {
          issueId: data.issue?.toString(),
          type: data.type,
        },
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    // Silently fail notification creation
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const { unread } = req.query;
    const filter = { recipient: req.user.id };
    if (unread === 'true') {
      filter.read = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('sender', 'name')
        .populate('issue', '_id trackingId category status')
        .sort({ createdAt: -1 })
        .limit(50),
      Notification.countDocuments({ recipient: req.user.id, read: false })
    ]);

    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ notification });
  } catch (err) {
    next(err);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};