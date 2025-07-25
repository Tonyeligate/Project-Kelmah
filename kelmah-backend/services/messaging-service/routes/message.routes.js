const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller");
const { authenticate } = require("../middleware/auth");

// Apply authentication middleware to all routes
router.use(authenticate);

// Message routes
router.post("/", messageController.createMessage);
router.get(
  "/conversation/:conversationId",
  messageController.getConversationMessages,
);
router.delete("/:messageId", messageController.deleteMessage);
router.get("/unread/count", messageController.getUnreadCount);

module.exports = router;
