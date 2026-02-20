const express = require('express');
const jwt = require('jsonwebtoken');
const Department = require('../models/Department');
const Report = require('../models/Report');
const NotificationService = require('../services/notificationService');
const mlService = require('../services/mlService');
const path = require('path');
const fs = require('fs');

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

function resolveLocalImagePath(imageUri) {
  if (!imageUri) return null;
  try {
    const parsed = new URL(imageUri);
    const filename = path.basename(parsed.pathname);
    if (!filename) return null;
    const diskPath = path.join(__dirname, '..', 'uploads', 'reports', filename);
    return fs.existsSync(diskPath) ? diskPath : null;
  } catch (error) {
    const filename = path.basename(imageUri);
    if (!filename) return null;
    const diskPath = path.join(__dirname, '..', 'uploads', 'reports', filename);
    return fs.existsSync(diskPath) ? diskPath : null;
  }
}

async function analyzeResolutionPhotos(report, photos) {
  const details = [];

  for (const photo of photos) {
    const localPath = resolveLocalImagePath(photo.uri || photo.url);
    if (!localPath) {
      details.push({
        uri: photo.uri || photo.url,
        detected: null,
        confidence: 0,
        summary: 'Image file not found on server'
      });
      continue;
    }

    try {
      const analysis = await mlService.analyzeImageForPotholes(
        localPath,
        report.issue?.category || 'general'
      );

      details.push({
        uri: photo.uri || photo.url,
        detected: !!analysis?.detected,
        confidence: analysis?.confidence ?? 0,
        severity: analysis?.severity || null,
        priority: analysis?.priority || null,
        recommendation: analysis?.recommendation || null
      });
    } catch (error) {
      console.error('Resolution proof analysis failed:', error);
      details.push({
        uri: photo.uri || photo.url,
        detected: null,
        confidence: 0,
        summary: 'Analysis failed',
        error: error?.message || 'Unknown error'
      });
    }
  }

  const validAnalyses = details.filter(d => typeof d.detected === 'boolean');
  const failCount = validAnalyses.filter(d => d.detected && (d.confidence ?? 0) >= 0.5).length;
  const status =
    validAnalyses.length === 0
      ? 'unknown'
      : failCount === 0
        ? 'pass'
        : 'fail';

  const averageConfidence =
    validAnalyses.length === 0
      ? 0
      : validAnalyses.reduce((sum, item) => sum + (item.confidence || 0), 0) /
        validAnalyses.length;

  const summary =
    status === 'pass'
      ? 'No significant remaining issues detected in proof images.'
      : status === 'fail'
        ? 'Potential issues still detected in proof images.'
        : 'Automated assessment unavailable for the provided images.';

  return {
    status,
    confidence: Number(averageConfidence.toFixed(2)),
    summary,
    details,
    analyzedAt: new Date()
  };
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

// Get all departments with details (public endpoint - must be before parameterized routes)
router.get('/list', async (req, res) => {
  try {
    const departments = await Department.find({ active: { $ne: false } })
      .select('name code location foundedDate leaderName leaderEmail leaderPhone')
      .sort({ name: 1 });
    
    res.status(200).json({
      status: 'success',
      data: { departments: departments || [] }
    });
  } catch (e) {
    console.error('Error fetching departments:', e);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch departments',
      data: { departments: [] }
    });
  }
});

// Get department officials (public endpoint - must be before parameterized routes)
router.get('/officials', async (req, res) => {
  try {
    const User = require('../models/User');
    const officials = await User.find({ 
      role: { $in: ['supervisor', 'worker'] },
      department: { $ne: null }
    })
    .select('name email phone department role designation imageUrl')
    .sort({ role: -1, name: 1 }) // supervisors first
    .limit(20); // limit to 20 officials
    
    console.log(`📊 Found ${officials.length} officials in database`);
    
    res.status(200).json({ 
      status: 'success', 
      data: { officials: officials || [] } 
    });
  } catch (e) {
    console.error('Error fetching officials:', e);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch officials',
      data: { officials: [] }
    });
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
    const oldStatus = report.status;

    if (status === 'resolved') {
      return res.status(400).json({
        status: 'error',
        message: 'Resolution proof required. Use the resolution submission endpoint.'
      });
    }

    report.status = status || report.status;
    if (notes) {
      report.notes = report.notes || [];
      report.notes.push({ note: notes, addedBy: 'department', addedAt: new Date() });
    }
    report.updatedAt = new Date();
    await report.save();

    try {
      await NotificationService.onReportStatusUpdate(report, oldStatus, report.status);
    } catch (notifyError) {
      console.error('Failed to send status update notification:', notifyError);
    }

    res.status(200).json({ status: 'success', data: { report } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: 'Failed to update status' });
  }
});

router.post('/issues/:reportId/resolution', requireDepartment, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { photos, description, notes } = req.body || {};

    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one proof photo is required to submit a resolution'
      });
    }

    const report = await Report.findOne({ reportId });
    if (!report) {
      return res.status(404).json({ status: 'error', message: 'Report not found' });
    }

    const deptCode = req.departmentAuth.deptCode;
    if (report.assignment?.department && report.assignment.department !== deptCode) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to resolve this report'
      });
    }

    const normalizedPhotos = photos.map((photo, index) => {
      const uri = photo?.uri || photo?.url;
      const filename =
        photo?.filename ||
        (uri ? path.basename(uri) : `resolution_${reportId}_${index + 1}.jpg`);
      return {
        uri,
        filename,
        uploadedAt: photo?.uploadedAt ? new Date(photo.uploadedAt) : new Date()
      };
    });

    const qualityCheck = await analyzeResolutionPhotos(report, normalizedPhotos);

    const oldStatus = report.status;
    report.status = 'resolved';
    report.resolution = {
      ...(report.resolution || {}),
      description:
        description ||
        report.resolution?.description ||
        'Resolution proof submitted by department',
      resolvedAt: new Date(),
      resolvedBy: deptCode,
      resolutionPhotos: normalizedPhotos,
      pendingApproval: true,
      approvalStatus: 'pending',
      rejectionReason: null,
      reviewedAt: null,
      reviewedBy: null,
      reviewedByRole: null,
      qualityCheck
    };

    report.resolution.approvalHistory = [
      ...(report.resolution?.approvalHistory || []),
      {
        status: 'pending',
        by: deptCode,
        role: 'department',
        notes: notes || null,
        at: new Date()
      }
    ];

    if (notes) {
      report.notes = report.notes || [];
      report.notes.push({
        note: notes,
        addedBy: 'department',
        addedAt: new Date()
      });
    }

    report.updatedAt = new Date();
    await report.save();

    try {
      await NotificationService.onReportStatusUpdate(report, oldStatus, report.status);
    } catch (notifyError) {
      console.error('Failed to notify status update for resolution:', notifyError);
    }

    try {
      await NotificationService.sendToUser(report.reporter.email, {
        type: 'resolution_pending',
        title: 'Work Completed - Awaiting Your Review',
        message: `The ${report.assignment?.department || 'assigned department'} uploaded proof of work for report ${report.trackingCode || report.reportId}. Please review and approve the resolution.`,
        reportId: report.reportId,
        trackingId: report.trackingCode,
        priority: report.priority || 'medium',
        photos: normalizedPhotos,
        qualityCheck
      });
    } catch (notifyUserError) {
      console.error('Failed to send resolution notification to user:', notifyUserError);
    }

    res.status(200).json({
      status: 'success',
      data: {
        resolution: report.resolution
      }
    });
  } catch (error) {
    console.error('Error submitting resolution proof:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit resolution proof'
    });
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


