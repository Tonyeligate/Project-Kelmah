const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

/**
 * Setup messaging WebSocket handlers
 * @param {import('socket.io').Server} io
 */
function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('Client connected to messaging socket:', socket.id);

    // Join a conversation room
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId.toString());
    });

    // Handle incoming messages
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

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log('Client disconnected from messaging socket:', socket.id, reason);
    });
  });
}

module.exports = { setupSocket }; 