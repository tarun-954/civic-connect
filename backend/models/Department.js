const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  roles: { type: [String], default: ['department'] },
  active: { type: Boolean, default: true },
  // Additional department info
  location: { type: String, default: null }, // Address/location of department office
  foundedDate: { type: Date, default: null }, // When the department was established
  leaderName: { type: String, default: null }, // Name of department head/leader
  leaderEmail: { type: String, default: null }, // Email of department leader
  leaderPhone: { type: String, default: null }, // Phone of department leader
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // Simple notification store; for production use a dedicated collection/queue
  notifications: [{
    type: { 
      type: String, 
      enum: [
        'issue_assigned',
        'issue_updated',
        'urgent_issue',
        'system',
        'new_report',
        'report_update',
        'report_resolved',
        'resolution_approved',
        'resolution_rejected'
      ], 
      default: 'system' 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    reportId: { type: String, default: null },
    trackingId: { type: String, default: null },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    category: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null }
  }]
});

departmentSchema.methods.verifyPassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

departmentSchema.statics.hashPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

departmentSchema.index({ code: 1 }, { unique: true });
departmentSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);


