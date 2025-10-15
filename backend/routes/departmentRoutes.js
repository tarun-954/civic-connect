const express = require('express');
const jwt = require('jsonwebtoken');
const Department = require('../models/Department');
const Report = require('../models/Report');

const router = express.Router();

function signDeptToken(dept) {
  const payload = { sub: dept._id.toString(), deptCode: dept.code, scope: 'department' };
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

async function requireDepartment(req, res, next) {
  try {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    if (payload.scope !== 'department') return res.status(403).json({ status: 'error', message: 'Forbidden' });
    req.departmentAuth = payload;
    next();
  } catch (e) {
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
}

// Admin created credentials only; expose signup for seed or admin use via code
router.post('/signup', async (req, res) => {
  try {
    const { name, code, email, password } = req.body || {};
    if (!name || !code || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'Missing fields' });
    }
    const existing = await Department.findOne({ $or: [{ code }, { email }] });
    if (existing) return res.status(400).json({ status: 'error', message: 'Department already exists' });
    const passwordHash = await Department.hashPassword(password);
    const dept = await Department.create({ name, code, email, passwordHash });
    const token = signDeptToken(dept);
    res.status(201).json({ status: 'success', data: { token, department: { id: dept._id, name: dept.name, code: dept.code, email: dept.email } } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: 'Failed to create department' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { code, email, password } = req.body || {};
    if ((!code && !email) || !password) return res.status(400).json({ status: 'error', message: 'Missing fields' });
    const dept = await Department.findOne(code ? { code } : { email });
    if (!dept) return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    const ok = await dept.verifyPassword(password);
    if (!ok) return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    const token = signDeptToken(dept);
    res.status(200).json({ status: 'success', data: { token, department: { id: dept._id, name: dept.name, code: dept.code, email: dept.email } } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: 'Login failed' });
  }
});

// List issues assigned to department (by code)
router.get('/issues', requireDepartment, async (req, res) => {
  try {
    const deptCode = req.departmentAuth.deptCode;
    const reports = await Report.find({ 'assignment.department': deptCode }).sort({ submittedAt: -1 }).select('-__v');
    res.status(200).json({ status: 'success', data: { reports } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch issues' });
  }
});

// Get all reports (for testing - remove in production)
router.get('/all-reports', requireDepartment, async (req, res) => {
  try {
    const reports = await Report.find({}).sort({ submittedAt: -1 }).select('-__v');
    res.status(200).json({ status: 'success', data: { reports } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch reports' });
  }
});

// Update report status (department side)
router.patch('/issues/:reportId/status', requireDepartment, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, notes } = req.body || {};
    const report = await Report.findOne({ reportId });
    if (!report) return res.status(404).json({ status: 'error', message: 'Report not found' });
    report.status = status || report.status;
    if (notes) {
      report.notes = report.notes || [];
      report.notes.push({ note: notes, addedBy: 'department', addedAt: new Date() });
    }
    report.updatedAt = new Date();
    await report.save();
    res.status(200).json({ status: 'success', data: { report } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: 'Failed to update status' });
  }
});

// Simple analytics: counts by status over time (last 30 days)
router.get('/analytics/summary', requireDepartment, async (req, res) => {
  try {
    const deptCode = req.departmentAuth.deptCode;
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const reports = await Report.find({ 'assignment.department': deptCode, submittedAt: { $gte: since } }).select('status submittedAt');
    const byDay = {};
    for (const r of reports) {
      const day = new Date(r.submittedAt).toISOString().slice(0, 10);
      byDay[day] = byDay[day] || { submitted: 0, in_progress: 0, resolved: 0, closed: 0 };
      byDay[day][r.status] = (byDay[day][r.status] || 0) + 1;
    }
    res.status(200).json({ status: 'success', data: { byDay } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: 'Failed to load analytics' });
  }
});

// Notifications polling
router.get('/notifications', requireDepartment, async (req, res) => {
  try {
    const deptId = req.departmentAuth.sub;
    const dept = await Department.findById(deptId).select('notifications code');
    res.status(200).json({ status: 'success', data: { notifications: dept?.notifications || [] } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch notifications' });
  }
});

// ML stubs
router.post('/ml/analyze-pothole', requireDepartment, async (req, res) => {
  // Stubbed response; to be integrated with actual ML later
  const { imageUrl } = req.body || {};
  if (!imageUrl) return res.status(400).json({ status: 'error', message: 'imageUrl required' });
  return res.status(200).json({ status: 'success', data: { widthCm: 45, heightCm: 30, confidence: 0.82 } });
});

router.post('/ml/ocr-priority', requireDepartment, async (req, res) => {
  const { imageUrl } = req.body || {};
  if (!imageUrl) return res.status(400).json({ status: 'error', message: 'imageUrl required' });
  return res.status(200).json({ status: 'success', data: { text: 'DANGER HIGH VOLTAGE', priority: 'urgent', confidence: 0.9 } });
});

module.exports = router;


