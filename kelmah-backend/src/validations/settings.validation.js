const Joi = require('joi');

exports.updateSettings = Joi.object({
  notifications: Joi.object({
    email: Joi.boolean(),
    realtime: Joi.boolean()
  }),
  theme: Joi.string().valid('light', 'dark'),
  locale: Joi.string(),
  privacy: Joi.object({
    profileVisibility: Joi.string().valid('public', 'private', 'connections'),
    searchVisibility: Joi.boolean(),
    dataSharing: Joi.boolean()
  })
});

exports.updatePrivacy = Joi.object({
  profileVisibility: Joi.string().valid('public', 'private', 'connections'),
  searchVisibility: Joi.boolean(),
  dataSharing: Joi.boolean()
}); 