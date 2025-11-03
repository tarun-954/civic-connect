const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Report = require('../models/Report');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const NotificationService = require('../services/notificationService');
const mlService = require('../services/mlService');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/reports';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (increased from 5MB)
    files: 10 // Allow up to 10 files per request
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
    }
  }
});

// Validation middleware
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  try {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.auth = payload; // expects sub=email
    next();
  } catch (e) {
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
}

const validateReportSubmission = [
  body('reporter.name').notEmpty().withMessage('Reporter name is required'),
  body('reporter.email').isEmail().withMessage('Valid email is required'),
  body('reporter.phone').notEmpty().withMessage('Phone number is required'),
  body('reporter.userId').notEmpty().withMessage('User ID is required'),
  body('issue.category').notEmpty().withMessage('Issue category is required'),
  body('issue.subcategory').notEmpty().withMessage('Issue subcategory is required'),
  body('issue.description').notEmpty().withMessage('Issue description is required'),
  body('location.latitude').isNumeric().withMessage('Valid latitude is required'),
  body('location.longitude').isNumeric().withMessage('Valid longitude is required'),
];

// Submit a new report
router.post('/submit', validateReportSubmission, async (req, res) => {
  try {
    console.log('📝 Report submission request received');
    console.log('📝 Report data:', JSON.stringify(req.body, null, 2));
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️  MongoDB not connected, returning mock response');
      // Generate mock report ID
      const mockReportId = 'RPT-' + Math.random().toString(36).substr(2, 8).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
      
      return res.status(201).json({
        status: 'success',
        message: 'Report submitted successfully (MongoDB not connected - using mock data)',
        data: {
          reportId: mockReportId,
          status: 'submitted',
          submittedAt: new Date(),
          trackingCode: 'TRK-' + Math.random().toString(36).substr(2, 8).toUpperCase()
        }
      });
    }

    // Always generate on server and ignore any client-provided reportId
    if (req.body && typeof req.body === 'object') {
      delete req.body.reportId;
    }

    // Auto-assign department based on issue category
    const categoryToDepartment = {
      'Road': 'ROAD_DEPT',
      'Electricity': 'ELECTRICITY_DEPT', 
      'Sewage': 'SEWAGE_DEPT',
      'Cleanliness': 'CLEANLINESS_DEPT',
      'Dustbin Full': 'WASTE_MGMT',
      'Water': 'WATER_DEPT',
      'Streetlight': 'STREETLIGHT_DEPT'
    };

    const assignedDepartment = categoryToDepartment[req.body.issue?.category] || null;

    // Attempt to persist with a fresh, unique reportId; retry on rare duplicate collisions
    let savedReport = null;
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const reportId = Report.generateReportId();
    const reportData = {
        ...req.body,
        reportId,
        submittedAt: new Date(),
        updatedAt: new Date(),
        assignment: {
          ...req.body.assignment,
          department: assignedDepartment,
          assignedAt: assignedDepartment ? new Date() : null
        }
      };
      try {
        const report = new Report(reportData);
        savedReport = await report.save();
        break; // success
      } catch (err) {
        // Retry only for duplicate key on reportId
        if (err && err.code === 11000 && /reportId/.test(String(err.message))) {
          if (attempt === maxAttempts) {
            throw new Error('Could not allocate a unique report ID after multiple attempts');
          }
          continue; // try again with a new id
        }
        throw err; // propagate other errors
      }
    }

    // Send notifications
    try {
      await NotificationService.onReportSubmitted(savedReport);
      console.log('✅ Notifications sent successfully');
    } catch (notificationError) {
      console.error('⚠️ Failed to send notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    // Return success response
    res.status(201).json({
      status: 'success',
      message: 'Report submitted successfully',
      data: {
        reportId: savedReport.reportId,
        status: savedReport.status,
        submittedAt: savedReport.submittedAt,
        trackingCode: savedReport.trackingCode
      }
    });

  } catch (error) {
    console.error('Error submitting report:', error);
    
    // Handle duplicate report ID
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Report ID already exists, please try again'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to submit report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get my reports (by JWT email)
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const email = req.auth?.sub;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = { 'reporter.email': email };
    
    console.log('📊 Fetching reports for user:', email);
    
    const reports = await Report.find(filter)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');
    const total = await Report.countDocuments(filter);
    
    console.log('📊 Found reports:', reports.length);
    reports.forEach((report, index) => {
      console.log(`📊 Report ${index + 1}:`, {
        reportId: report.reportId,
        hasPhotos: !!report.issue?.photos,
        photoCount: report.issue?.photos?.length || 0,
        firstPhotoUri: report.issue?.photos?.[0]?.uri || 'No photos'
      });
    });
    
    res.status(200).json({ status: 'success', data: { reports, pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalReports: total } } });
  } catch (e) {
    console.error('❌ Error fetching reports:', e);
    res.status(500).json({ status: 'error', message: 'Failed to fetch reports' });
  }
});

// Like a report
router.post('/:reportId/like', requireAuth, async (req, res) => {
  try {
    const email = req.auth?.sub;
    const { reportId } = req.params;
    const report = await Report.findOne({ reportId });
    if (!report) return res.status(404).json({ status: 'error', message: 'Report not found' });
    report.dislikes = (report.dislikes || []).filter(e => e !== email);
    if (!report.likes?.includes(email)) report.likes = [...(report.likes || []), email];
    await report.save();
    res.status(200).json({ status: 'success', data: { likes: report.likes.length, dislikes: report.dislikes.length } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: 'Failed to like report' });
  }
});

// Dislike a report
router.post('/:reportId/dislike', requireAuth, async (req, res) => {
  try {
    const email = req.auth?.sub;
    const { reportId } = req.params;
    const report = await Report.findOne({ reportId });
    if (!report) return res.status(404).json({ status: 'error', message: 'Report not found' });
    report.likes = (report.likes || []).filter(e => e !== email);
    if (!report.dislikes?.includes(email)) report.dislikes = [...(report.dislikes || []), email];
    await report.save();
    res.status(200).json({ status: 'success', data: { likes: report.likes.length, dislikes: report.dislikes.length } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: 'Failed to dislike report' });
  }
});

// Add comment
router.post('/:reportId/comments', requireAuth, async (req, res) => {
  try {
    const email = req.auth?.sub;
    const { reportId } = req.params;
    const { text, byName } = req.body || {};
    if (!text) return res.status(400).json({ status: 'error', message: 'Comment text required' });
    const report = await Report.findOne({ reportId });
    if (!report) return res.status(404).json({ status: 'error', message: 'Report not found' });
    report.comments = report.comments || [];
    report.comments.push({ byEmail: email, byName: byName || email.split('@')[0], text });
    await report.save();
    res.status(201).json({ status: 'success', data: { comments: report.comments } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: 'Failed to add comment' });
  }
});

// Get all reports
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get reports with pagination
    const reports = await Report.find(filter)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Get total count
    const total = await Report.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        reports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalReports: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reports',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get all reports (for nearby filtering)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const reports = await Report.find({})
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Report.countDocuments({});

    res.status(200).json({
      status: 'success',
      data: {
        reports,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalReports: total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reports',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Debug endpoint to check database connection and report count
router.get('/debug/count', async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const sampleReports = await Report.find().select('reportId trackingCode status').limit(5);
    
    res.status(200).json({
      status: 'success',
      data: {
        totalReports,
        sampleReports,
        message: `Database connected. Found ${totalReports} reports.`
      }
    });
  } catch (error) {
    console.error('Error checking database:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get report by tracking code (must come before /:reportId route)
router.get('/tracking/:trackingCode', async (req, res) => {
  try {
    const { trackingCode } = req.params;
    console.log('Searching for report with tracking code:', trackingCode);

    const report = await Report.findOne({ trackingCode }).select('-__v');
    console.log('Found report:', report ? 'Yes' : 'No');

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found with this tracking code'
      });
    }

    res.status(200).json({
      status: 'success',
      data: report
    });

  } catch (error) {
    console.error('Error fetching report by tracking code:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get report by ID
router.get('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    console.log('Searching for report with ID:', reportId);

    const report = await Report.findOne({ reportId }).select('-__v');
    console.log('Found report:', report ? 'Yes' : 'No');

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: report
    });

  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update report status
router.patch('/:reportId/status', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'Status is required'
      });
    }

    const validStatuses = ['draft', 'submitted', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status value'
      });
    }

    const updateData = { status, updatedAt: new Date() };
    
    // Add note if provided
    if (notes) {
      updateData.$push = {
        notes: {
          note: notes,
          addedBy: 'system',
          addedAt: new Date()
        }
      };
    }

    const report = await Report.findOneAndUpdate(
      { reportId },
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Report status updated successfully',
      data: { report }
    });

  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update report status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get reports by location (for map view)
router.get('/location/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 1000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    // Convert radius from meters to degrees (approximate)
    const radiusInDegrees = radius / 111000; // 1 degree ≈ 111km

    const reports = await Report.find({
      'location.latitude': {
        $gte: parseFloat(latitude) - radiusInDegrees,
        $lte: parseFloat(latitude) + radiusInDegrees
      },
      'location.longitude': {
        $gte: parseFloat(longitude) - radiusInDegrees,
        $lte: parseFloat(longitude) + radiusInDegrees
      }
    }).select('reportId status priority issue.category location submittedAt').sort({ submittedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { reports }
    });

  } catch (error) {
    console.error('Error fetching nearby reports:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch nearby reports',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Upload image endpoint
router.post('/upload-image', requireAuth, upload.single('image'), async (req, res) => {
  try {
    console.log('📤 Image upload request received');
    console.log('📤 Request body:', req.body);
    console.log('📤 Request file:', req.file);
    
    if (!req.file) {
      console.log('❌ No file provided in request');
      return res.status(400).json({
        status: 'error',
        message: 'No image file provided'
      });
    }

    console.log('✅ File received:', req.file.filename);
    console.log('✅ File size:', req.file.size, 'bytes');
    console.log('✅ File type:', req.file.mimetype);
    
    // Create accessible URL for the uploaded image
    const imageUrl = `${req.protocol}://${req.get('host')}/api/reports/uploads/reports/${req.file.filename}`;
    
    console.log('✅ Image URL created:', imageUrl);
    
    res.status(200).json({
      status: 'success',
      message: 'Image uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: imageUrl
      }
    });
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    
    // Handle specific multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: 'Too many files. Maximum is 10 files per request.'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload image',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Serve uploaded images
router.get('/uploads/reports/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '..', 'uploads', 'reports', filename);
  
  console.log('🖼️ Image request:', filename);
  console.log('🖼️ File path:', filePath);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log('❌ Image not found:', filePath);
    return res.status(404).json({
      status: 'error',
      message: 'Image not found'
    });
  }
  
  console.log('✅ Image found, serving:', filename);
  
  // Set appropriate headers based on file extension
  const ext = path.extname(filename).toLowerCase();
  let contentType = 'image/jpeg'; // default
  
  if (ext === '.png') contentType = 'image/png';
  else if (ext === '.gif') contentType = 'image/gif';
  else if (ext === '.webp') contentType = 'image/webp';
  
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  
  // Send the file
  res.sendFile(filePath);
});

// ML Analysis endpoint for image detection (no auth required for report submission)
router.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    console.log('🤖 ML Analysis request received');
    
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No image file provided'
      });
    }

    const imagePath = req.file.path;
    const category = req.body.category || req.body.issueCategory || 'road'; // Get category from request
    console.log(`🤖 Analyzing image: ${req.file.filename} for category: ${category}`);

    // Analyze image using ML service with category
    const analysisResults = await mlService.analyzeImageForPotholes(imagePath, category);
    
    console.log('🤖 ML Analysis complete:', analysisResults);

    res.status(200).json({
      status: 'success',
      message: 'Image analyzed successfully',
      data: {
        analysis: analysisResults,
        filename: req.file.filename,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    console.error('❌ Error analyzing image:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to analyze image'
    });
  }
});

module.exports = router;
