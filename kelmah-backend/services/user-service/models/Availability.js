const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DaySlotSchema = new Schema({
  dayOfWeek: { type: Number, min: 0, max: 6, required: true },
  slots: [
    {
      start: { type: String, required: true }, // '09:00'
      end: { type: String, required: true },   // '17:00'
    },
  ],
});

const HolidaySchema = new Schema({
  date: { type: Date, required: true },
  reason: { type: String },
});

const AvailabilitySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timezone: { type: String, default: 'Africa/Accra' },
    isAvailable: { type: Boolean, default: true },
    pausedUntil: { type: Date },
    daySlots: [DaySlotSchema],
    holidays: [HolidaySchema],
    notes: { type: String },
    dailyHours: { type: Number, min: 0, max: 24, default: 8 },
    weeklyHoursCap: { type: Number, min: 0, max: 168 },
  },
  { timestamps: true, collection: 'availabilities' }
);

AvailabilitySchema.index({ user: 1 }, { unique: true });

// Use mongoose.connection.model() to ensure model uses the active connection
module.exports = mongoose.connection.models.Availability || mongoose.connection.model('Availability', AvailabilitySchema);


