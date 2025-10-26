const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    index: true
  },
  phone: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  department: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['citizen', 'supervisor', 'worker'],
    default: 'citizen'
  },
  // Notifications array
  notifications: [{
    type: { 
      type: String, 
      enum: ['report_submitted', 'status_update', 'assignment', 'resolution', 'system'], 
      default: 'system' 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    reportId: { type: String, default: null },
    trackingId: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
  }]
}, {
  timestamps: true
});

userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);


