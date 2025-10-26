const express = require('express');
const jwt = require('jsonwebtoken');
const NotificationService = require('../services/notificationService');
const User = require('../models/User');
const Department = require('../models/Department');

const router = express.Router();

// Auth middleware
function requireAuth(req, res, next) {
  try {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.auth = payload;
    next();
  } catch (e) {
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
}

// Get user notifications
router.get('/user', requireAuth, async (req, res) => {
  try {
    const userEmail = req.auth.sub;
    const notifications = await NotificationService.getUserNotifications(userEmail);
    
    res.status(200).json({
      status: 'success',
      data: { notifications }
    });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notifications'
    });
  }
});

// Get department notifications
router.get('/department/:departmentCode', requireAuth, async (req, res) => {
  try {
    const { departmentCode } = req.params;
    const notifications = await NotificationService.getDepartmentNotifications(departmentCode);
    
    res.status(200).json({
      status: 'success',
      data: { notifications }
    });
  } catch (error) {
    console.error('Error fetching department notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notifications'
    });
  }
});

// Mark user notification as read
router.patch('/user/:notificationId/read', requireAuth, async (req, res) => {
  try {
    const userEmail = req.auth.sub;
    const { notificationId } = req.params;
    
    const success = await NotificationService.markAsRead(userEmail, notificationId);
    
    if (success) {
      res.status(200).json({
        status: 'success',
        message: 'Notification marked as read'
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification as read'
    });
  }
});

// Mark department notification as read
router.patch('/department/:departmentCode/:notificationId/read', requireAuth, async (req, res) => {
  try {
    const { departmentCode, notificationId } = req.params;
    
    const success = await NotificationService.markDepartmentNotificationAsRead(departmentCode, notificationId);
    
    if (success) {
      res.status(200).json({
        status: 'success',
        message: 'Notification marked as read'
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }
  } catch (error) {
    console.error('Error marking department notification as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification as read'
    });
  }
});

// Get unread notification count for user
router.get('/user/unread-count', requireAuth, async (req, res) => {
  try {
    const userEmail = req.auth.sub;
    const notifications = await NotificationService.getUserNotifications(userEmail);
    const unreadCount = notifications.filter(n => !n.read).length;
    
    res.status(200).json({
      status: 'success',
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch unread count'
    });
  }
});

// Get unread notification count for department
router.get('/department/:departmentCode/unread-count', requireAuth, async (req, res) => {
  try {
    const { departmentCode } = req.params;
    const notifications = await NotificationService.getDepartmentNotifications(departmentCode);
    const unreadCount = notifications.filter(n => !n.read).length;
    
    res.status(200).json({
      status: 'success',
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Error fetching department unread count:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch unread count'
    });
  }
});

module.exports = router;
