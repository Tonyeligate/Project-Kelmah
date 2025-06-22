const Joi = require('joi');

exports.updateProfile = Joi.object({
  firstName: Joi.string().trim().min(1),
  lastName: Joi.string().trim().min(1),
  phone: Joi.string().pattern(/^([+]?\d{1,3}[- ]?)?\d{10}$/),
  bio: Joi.string().allow(''),
  profilePicture: Joi.string().uri(),
  dateOfBirth: Joi.date().iso(),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say'),
  address: Joi.string().allow(''),
  city: Joi.string().allow(''),
  state: Joi.string().allow(''),
  country: Joi.string().allow(''),
  postalCode: Joi.string().allow(''),
  skills: Joi.array().items(Joi.string())
}); 