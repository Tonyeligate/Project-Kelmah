const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationPreferenceSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false }
  },
  types: {
    message_received: { type: Boolean, default: true },
    payment_received: { type: Boolean, default: true },
    job_application: { type: Boolean, default: true },
    job_offer: { type: Boolean, default: true },
    contract_update: { type: Boolean, default: true },
    system_alert: { type: Boolean, default: true },
    review_received: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('NotificationPreference', NotificationPreferenceSchema);



