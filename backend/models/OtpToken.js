const mongoose = require('mongoose');

const otpTokenSchema = new mongoose.Schema({
  channel: { type: String, enum: ['phone', 'email'], required: true },
  target: { type: String, required: true, index: true }, // phone number or email
  code: { type: String, required: true },
  purpose: { type: String, enum: ['login', 'signup'], required: true },
  expiresAt: { type: Date, required: true },
  consumedAt: { type: Date, default: null }
}, { timestamps: true });

otpTokenSchema.index({ target: 1, purpose: 1, expiresAt: 1 });

module.exports = mongoose.model('OtpToken', otpTokenSchema);


