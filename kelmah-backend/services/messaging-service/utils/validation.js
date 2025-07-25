const Joi = require("joi");

// Message validation schema
const messageSchema = Joi.object({
  sender: Joi.string().required(),
  recipient: Joi.string().required(),
  content: Joi.string().required().min(1).max(5000),
  messageType: Joi.string()
    .valid("text", "image", "file", "system")
    .default("text"),
  attachments: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      fileUrl: Joi.string().required(),
      fileType: Joi.string().required(),
      fileSize: Joi.number(),
      uploadDate: Joi.date(),
    }),
  ),
  relatedJob: Joi.string(),
  relatedContract: Joi.string(),
});

// Conversation validation schema
const conversationSchema = Joi.object({
  participants: Joi.array().items(Joi.string()).min(2).required(),
  relatedJob: Joi.string(),
  relatedContract: Joi.string(),
  metadata: Joi.object({
    title: Joi.string(),
    description: Joi.string(),
    tags: Joi.array().items(Joi.string()),
  }),
});

// Notification validation schema
const notificationSchema = Joi.object({
  recipient: Joi.string().required(),
  type: Joi.string()
    .valid(
      "job_application",
      "job_offer",
      "contract_update",
      "payment_received",
      "message_received",
      "system_alert",
      "profile_update",
      "review_received",
    )
    .required(),
  title: Joi.string().required(),
  content: Joi.string().required(),
  priority: Joi.string().valid("low", "medium", "high").default("medium"),
  actionUrl: Joi.string(),
  relatedEntity: Joi.object({
    type: Joi.string().valid("job", "contract", "message", "user", "payment"),
    id: Joi.string(),
  }),
  metadata: Joi.object({
    icon: Joi.string(),
    color: Joi.string(),
    category: Joi.string(),
  }),
});

// Validation functions
exports.validateMessage = (data) => {
  return messageSchema.validate(data);
};

exports.validateConversation = (data) => {
  return conversationSchema.validate(data);
};

exports.validateNotification = (data) => {
  return notificationSchema.validate(data);
};
