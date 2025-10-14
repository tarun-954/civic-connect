const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OtpToken = require('../models/OtpToken');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
let sgMail = null;
try {
  if (process.env.SENDGRID_API_KEY) {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
} catch (e) {
  console.warn('SendGrid not configured:', e?.message || e);
}

// Nodemailer (e.g., Gmail SMTP) setup
let mailTransporter = null;
try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    const nodemailer = require('nodemailer');
    mailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 465,
      secure: (process.env.EMAIL_SECURE || 'true') === 'true', // true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
} catch (e) {
  console.warn('Nodemailer not configured:', e?.message || e);
}

// Simple JWT auth middleware
function requireAuth(req, res, next) {
  try {
    console.log('Auth middleware - Headers:', req.headers);
    const header = req.headers['authorization'] || '';
    console.log('Auth middleware - Authorization header:', header);
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    console.log('Auth middleware - Extracted token:', token ? token.substring(0, 20) + '...' : 'null');
    
    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({ status: 'error', message: 'No authorization token provided' });
    }
    
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    console.log('Auth middleware - Token verified, payload:', payload);
    req.auth = payload; // expects { sub: email, purpose }
    next();
  } catch (e) {
    console.log('Auth middleware - Token verification failed:', e.message);
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
}

const router = express.Router();

const validateSignup = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

router.post('/signup', validateSignup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, phone, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, phone, password: hashed });

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error during signup:', error);
    if (error.code === 11000) {
      return res.status(400).json({ status: 'error', message: 'Email already registered' });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to register user' });
  }
});

// Generate an OTP code (6 digits)
function generateOtp() {
  return ('' + Math.floor(100000 + Math.random() * 900000));
}

// Request OTP for login/signup (email-only)
router.post('/request-otp', [
  body('target').isEmail().withMessage('Valid email is required'),
  body('purpose').isIn(['login', 'signup']).withMessage('Purpose must be login or signup')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
  }
  const { target, purpose } = req.body;
  const ttlMinutes = 10;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  let code;
  // Enforce account existence rules
  const existingUser = await User.findOne({ email: target });
  if (purpose === 'login' && !existingUser) {
    return res.status(404).json({ status: 'error', message: 'No account found for this email. Please sign up first.' });
  }
  if (purpose === 'signup' && existingUser) {
    return res.status(400).json({ status: 'error', message: 'Email already registered. Please login instead.' });
  }
  // If a Python OTP service is configured, use it
  if (process.env.PYOTP_SERVICE_URL) {
    try {
      const fetch = require('node-fetch');
      const resp = await fetch(`${process.env.PYOTP_SERVICE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, purpose, ttl_seconds: ttlMinutes * 60 })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.detail || data?.message || 'OTP service error');
      }
      code = data.code;
    } catch (e) {
      console.error('OTP service failed, falling back to local code:', e?.message || e);
      code = generateOtp();
    }
  } else {
    code = generateOtp();
  }

  await OtpToken.create({ target, channel: 'email', code, purpose, expiresAt });

  // Send email via SendGrid if configured
  if (sgMail && process.env.SENDGRID_FROM_EMAIL) {
    try {
      await sgMail.send({
        to: target,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: 'Your Civic Connect verification code',
        text: `Your verification code is ${code}. It expires in ${ttlMinutes} minutes.`,
        html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in ${ttlMinutes} minutes.</p>`
      });
    } catch (e) {
      console.error('Failed to send email via SendGrid:', e?.message || e);
    }
  }

  // Send email via Nodemailer (Gmail SMTP) if configured and not sent above
  if (!sgMail && mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: target,
        subject: 'Your Civic Connect verification code',
        text: `Your verification code is ${code}. It expires in ${ttlMinutes} minutes.`,
        html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in ${ttlMinutes} minutes.</p>`
      });
    } catch (e) {
      console.error('Failed to send email via Nodemailer:', e?.message || e);
    }
  }

  // Return code only in non-production environments to aid testing
  const payload = { expiresAt };
  if ((process.env.NODE_ENV || 'development') !== 'production') {
    payload.code = code;
  }
  return res.status(200).json({ status: 'success', message: 'OTP sent to email', data: payload });
});

// Verify OTP
router.post('/verify-otp', [
  body('target').notEmpty().withMessage('Target is required'),
  body('purpose').isIn(['login', 'signup']).withMessage('Purpose must be login or signup'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
  }
  const { target, purpose, code } = req.body;

  // If Python OTP service configured, verify first
  if (process.env.PYOTP_SERVICE_URL) {
    try {
      const fetch = require('node-fetch');
      const resp = await fetch(`${process.env.PYOTP_SERVICE_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, purpose, code })
      });
      const data = await resp.json();
      if (!resp.ok || data?.status !== 'success') {
        return res.status(400).json({ status: 'error', message: data?.detail || 'Invalid or expired OTP' });
      }
    } catch (e) {
      return res.status(400).json({ status: 'error', message: 'OTP verification failed' });
    }
  }

  const otp = await OtpToken.findOne({ target, purpose, code, consumedAt: null, expiresAt: { $gt: new Date() } });
  if (!otp) {
    return res.status(400).json({ status: 'error', message: 'Invalid or expired OTP' });
  }
  otp.consumedAt = new Date();
  await otp.save();

  // Issue JWT token after successful verification
  const payload = { sub: target, purpose };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

  return res.status(200).json({ status: 'success', message: 'OTP verified', data: { token } });
});

// Get current user profile from DB using JWT
router.get('/me', requireAuth, async (req, res) => {
  try {
    const email = req.auth?.sub;
    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Invalid token payload' });
    }
    const user = await User.findOne({ email }).select('name email phone createdAt');
    if (!user) {
      return res.status(200).json({ status: 'success', data: { name: null, email, phone: null } });
    }
    return res.status(200).json({ status: 'success', data: { name: user.name, email: user.email, phone: user.phone, createdAt: user.createdAt } });
  } catch (e) {
    console.error('Error fetching profile:', e);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch profile' });
  }
});

// Test endpoint to verify route is working
router.get('/test', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'User routes are working',
    jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set'
  });
});

// Update user profile
router.put('/profile', requireAuth, [
  body('name').optional().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('phone').optional().isString().withMessage('Phone must be a string'),
  body('avatar').optional().isString().withMessage('Avatar must be a string')
], async (req, res) => {
  try {
    console.log('Profile update request received:', {
      body: req.body,
      auth: req.auth,
      headers: req.headers
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        status: 'error', 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const email = req.auth?.sub;
    const { name, phone, avatar } = req.body;
    
    console.log('Processing profile update for email:', email);

    // Find user by email
    console.log('Looking for user with email:', email);
    const user = await User.findOne({ email });
    console.log('Found user:', user ? 'Yes' : 'No');
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Update fields if provided
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Update user
    console.log('Updating user with data:', updateData);
    const updatedUser = await User.findOneAndUpdate(
      { email },
      updateData,
      { new: true, runValidators: true }
    );

    console.log('Updated user:', updatedUser);

    const responseData = {
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    };

    console.log('Sending response:', responseData);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error updating profile:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to update profile',
      error: error.message 
    });
  }
});

module.exports = router;


