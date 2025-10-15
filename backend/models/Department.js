const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  roles: { type: [String], default: ['department'] },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // Simple notification store; for production use a dedicated collection/queue
  notifications: [{
    type: { type: String, enum: ['issue_assigned', 'issue_updated', 'urgent_issue', 'system'], default: 'system' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    reportId: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
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


