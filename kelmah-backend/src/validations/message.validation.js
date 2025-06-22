const Joi = require('joi');

/**
 * Validation schema for creating a new conversation
 */
const createConversation = Joi.object({
  participantId: Joi.string().required().messages({ 'any.required': 'Participant ID is required' })
});

/**
 * Validation schema for sending a message
 */
const sendMessage = Joi.object({
  content: Joi.string().trim().required().messages({ 'string.empty': 'Message content is required' }),
  type: Joi.string().valid('text', 'image', 'attachment', 'system').optional(),
  attachment: Joi.object({
    url: Joi.string().uri().required(),
    filename: Joi.string().required(),
    contentType: Joi.string().required(),
    size: Joi.number().required()
  }).optional()
});

module.exports = {
  createConversation,
  sendMessage
}; 