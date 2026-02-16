const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller");
// ✅ TEMPORARILY DISABLED: Rate limiter middleware has missing config dependencies
// const { createLimiter } = require('../../../shared/middlewares/rateLimiter');
// ✅ REMOVED: Authentication middleware is already applied in server.js
// const { authenticate } = require("../middlewares/auth.middleware");
// router.use(authenticate); // Authentication applied at server level

// Message routes — literal routes BEFORE parameterized routes
router.post(
  "/",
  /* createLimiter('messaging'), */ messageController.createMessage,
);
router.get("/unread/count", messageController.getUnreadCount);
router.get("/search", messageController.searchMessages);
router.get(
  "/conversation/:conversationId",
  messageController.getConversationMessages,
);
// Mark a single message as read (canonical: /api/messages/:messageId/read)
router.post("/:messageId/read", async (req, res) => {
  try {
    const Message = require("../models/Message");
    const m = await Message.findById(req.params.messageId);
    if (!m)
      return res.status(404).json({ success: false, message: "Not found" });
    if (String(m.recipient) !== String(req.user?.id || req.user?._id))
      return res.status(403).json({ success: false, message: "Forbidden" });
    await m.markAsRead();
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});
router.delete("/:messageId", messageController.deleteMessage);
// Message editing and reactions
router.put(
  "/:messageId",
  /* createLimiter('messaging'), */ messageController.editMessage,
);
router.post(
  "/:messageId/reactions",
  /* createLimiter('messaging'), */ messageController.addReaction,
);
router.delete("/:messageId/reactions/:emoji", messageController.removeReaction);

module.exports = router;
