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
  designation: {
    type: String,
    default: null
  },
  imageUrl: {
    type: String,
    default: null
  },
  // Notifications array
  notifications: [{
    type: { 
      type: String, 
      enum: [
        'report_submitted',
        'status_update',
        'assignment',
        'resolution',
        'resolution_pending',
        'resolution_approved',
        'resolution_rejected',
        'system'
      ], 
      default: 'system' 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    reportId: { type: String, default: null },
    trackingId: { type: String, default: null },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    photos: [{
      uri: { type: String },
      filename: { type: String, default: null },
      uploadedAt: { type: Date, default: Date.now }
    }],
    qualityCheck: {
      status: { type: String, enum: ['pass', 'fail', 'unknown'], default: 'unknown' },
      confidence: { type: Number, default: 0 },
      summary: { type: String, default: null },
      details: { type: mongoose.Schema.Types.Mixed, default: null },
      analyzedAt: { type: Date, default: null }
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null }
  }]
}, {
  timestamps: true
});

userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);


