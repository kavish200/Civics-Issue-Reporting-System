const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, getNotifications);
router.patch('/:id/read', verifyToken, markNotificationRead);
router.patch('/read-all', verifyToken, markAllNotificationsRead);

module.exports = router;