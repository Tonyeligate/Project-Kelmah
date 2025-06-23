const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

/**
 * Setup messaging WebSocket handlers
 * @param {import('socket.io').Server} io
 */
function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('Client connected to messaging socket:', socket.id);
    // Broadcast user online status
    const userId = socket.handshake.query.userId || (socket.handshake.auth && socket.handshake.auth.userId);
    if (userId) {
      socket.broadcast.emit('user_status', { userId, status: 'online' });
    }

    // Join a conversation room (underscore naming to match frontend)
    socket.on('join_conversation', ({ conversationId }) => {
      socket.join(conversationId.toString());
    });
    // Leave a conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(conversationId.toString());
    });

    // Handle incoming messages (if using socket emit) - optional push; typically HTTP endpoint also sends
    socket.on('message', async ({ conversationId, content, attachments, senderId }) => {
      try {
        // Save message
        const message = await Message.create({
          conversation: conversationId,
          sender: senderId || socket.handshake.auth.userId,
          content,
          type: 'text',
          attachment: attachments || {}
        });
        // Update conversation metadata
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          $inc: { unreadCount: 1 }
        });
        // Broadcast to room
        io.to(conversationId.toString()).emit('message', message);
      } catch (err) {
        console.error('Messaging socket error:', err);
      }
    });

    // Typing indicator
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(conversationId.toString()).emit('typing', { conversationId, isTyping });
    });

    // Handle read receipts sent via socket (optional if not using HTTP)
    socket.on('read', ({ conversationId, userId: readerId }) => {
      // Broadcast read event to others
      socket.to(conversationId.toString()).emit('read', { conversationId, userId: readerId });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log('Client disconnected from messaging socket:', socket.id, reason);
      // Broadcast user offline status
      if (userId) {
        socket.broadcast.emit('user_status', { userId, status: 'offline' });
      }
    });
  });
}

module.exports = { setupSocket }; 