const axios = require('axios');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendPushNotification(pushToken, notification) {
  if (!pushToken) {
    return; // No token, silently skip
  }

  try {
    await axios.post(EXPO_PUSH_URL, {
      to: pushToken,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    });
  } catch (error) {
    // Silently ignore push failures
    console.log('Push notification failed (ignored):', error.message);
  }
}

module.exports = { sendPushNotification };