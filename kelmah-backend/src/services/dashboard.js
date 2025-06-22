const Notification = require('../models/Notification'); // for notifications summary if needed

function setupSocket(io) {
  io.on('connection', (socket) => {
    // Join a dashboard-specific room for this user
    socket.on('join:dashboard', (userId) => {
      socket.join(`dashboard_${userId}`);
    });
  });

  return {
    emitUpdate: (userId, data) => {
      io.to(`dashboard_${userId}`).emit('dashboard:update', data);
    },
    emitNewJob: (data) => {
      io.emit('dashboard:new-job', data);
    },
    emitStatusChange: (data) => {
      io.emit('dashboard:status-change', data);
    }
  };
}

module.exports = { setupSocket }; 