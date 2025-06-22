const Notification = require('../models/Notification');

function setupSocket(io) {
  io.on('connection', (socket) => {
    // Join a room specific to this user's notifications
    socket.on('joinNotifications', (userId) => {
      socket.join(`notifications_${userId}`);
    });
  });

  return {
    sendNotification: async (userId, { type, content, link }) => {
      // Create notification in database
      const notification = await Notification.create({ user: userId, type, content, link });
      // Emit the notification to the user's room
      io.to(`notifications_${userId}`).emit('notification', notification);
      return notification;
    }
  };
}

module.exports = { setupSocket }; 