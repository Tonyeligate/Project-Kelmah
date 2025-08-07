const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller");
// ✅ REMOVED: Authentication middleware is already applied in server.js
// const { authenticate } = require("../middlewares/auth.middleware");
// router.use(authenticate); // Authentication applied at server level

// Message routes
router.post("/", messageController.createMessage);
router.get(
  "/conversation/:conversationId",
  messageController.getConversationMessages,
);
router.delete("/:messageId", messageController.deleteMessage);
router.get("/unread/count", messageController.getUnreadCount);

module.exports = router;
