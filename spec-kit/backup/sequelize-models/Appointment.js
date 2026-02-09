const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Appointment Model
 * Stores scheduled appointments between worker and hirer
 */
const AppointmentSchema = new Schema({
  worker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  jobTitle: { type: String, required: true },
  hirer: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['confirmed', 'pending', 'completed'], default: 'pending' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Appointment', AppointmentSchema); 