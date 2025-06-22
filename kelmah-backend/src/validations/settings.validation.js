const Joi = require('joi');

exports.updateSettings = Joi.object({
  notifications: Joi.object({
    email: Joi.boolean(),
    realtime: Joi.boolean()
  }),
  theme: Joi.string().valid('light', 'dark'),
  locale: Joi.string()
}); 