const axios = require('axios');

// Sends in-app notification via messaging-service gateway endpoint
exports.notifyUser = async (userId, payload = {}) => {
  try {
    const url = process.env.MESSAGING_SERVICE_URL || 'http://localhost:3003';
    await axios.post(`${url}/api/socket/send-to-user`, {
      userId,
      event: 'notification',
      data: payload,
    }, {
      headers: { Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN || 'service'}` }
    });
  } catch (e) {
    console.error('Payment notifier error:', e.message);
  }
};

exports.notifyPaymentEvent = async (userId, type, title, body, data = {}) => {
  return exports.notifyUser(userId, {
    id: `${type}_${Date.now()}`,
    type,
    title,
    body,
    data,
    timestamp: new Date().toISOString(),
    read: false,
  });
};




