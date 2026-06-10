const Joi = require("joi");

// Message validation schema
const messageSchema = Joi.object({
  sender: Joi.string().optional(),
  // recipient is required ONLY when conversationId is not provided
  recipient: Joi.string().when('conversationId', {
    is: Joi.string().min(1).exist(),
    then: Joi.string().optional(),
    otherwise: Joi.string().required(),
  }),
  conversationId: Joi.string().optional(),
  content: Joi.string().allow('').max(5000).when('attachments', {
    is: Joi.array().min(1),
    then: Joi.optional(),
    otherwise: Joi.string().trim().min(1).required(),
  }),
  messageType: Joi.string()
    .valid("text", "image", "file", "system", "mixed")
    .default("text"),
  attachments: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      fileUrl: Joi.string().required(),
      fileType: Joi.string().required(),
      fileSize: Joi.number(),
      uploadDate: Joi.date(),
      publicId: Joi.string().allow(null, ''),
      resourceType: Joi.string().allow(null, ''),
      thumbnailUrl: Joi.string().allow(null, ''),
      width: Joi.number().allow(null),
      height: Joi.number().allow(null),
      duration: Joi.number().allow(null),
      format: Joi.string().allow(null, ''),
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
