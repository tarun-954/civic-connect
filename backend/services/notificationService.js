const Department = require('../models/Department');
const Report = require('../models/Report');
const User = require('../models/User');

class NotificationService {
  // Send notification to a specific department
  static async sendToDepartment(departmentCode, notification) {
    try {
      const department = await Department.findOne({ code: departmentCode });
      if (!department) {
        console.error(`Department with code ${departmentCode} not found`);
        return false;
      }

      department.notifications.push({
        ...notification,
        createdAt: new Date(),
        read: false
      });

      await department.save();
      console.log(`Notification sent to department ${departmentCode}: ${notification.title}`);
      return true;
    } catch (error) {
      console.error('Error sending notification to department:', error);
      return false;
    }
  }

  // Send notification to user
  static async sendToUser(userEmail, notification) {
    try {
      const user = await User.findOne({ email: userEmail });
      if (!user) {
        console.error(`User with email ${userEmail} not found`);
        return false;
      }

      // Add notification to user's notifications array
      if (!user.notifications) {
        user.notifications = [];
      }

      user.notifications.push({
        ...notification,
        createdAt: new Date(),
        read: false
      });

      await user.save();
      console.log(`Notification sent to user ${userEmail}: ${notification.title}`);
      return true;
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return false;
    }
  }

  // Send notification when report is submitted
  static async onReportSubmitted(report) {
    try {
      const trackingId = report.trackingCode || report.reportId;
      
      // Notification to user
      const userNotification = {
        type: 'report_submitted',
        title: 'Report Submitted Successfully',
        message: `Your report has been submitted with tracking ID: ${trackingId}. You can track its progress using this ID.`,
        reportId: report.reportId,
        trackingId: trackingId
      };

      await this.sendToUser(report.reporter.email, userNotification);

      // Determine which department to notify based on category
      const departmentCode = this.getDepartmentByCategory(report.issue.category);
      
      if (departmentCode) {
        const departmentNotification = {
          type: 'new_report',
          title: 'New Report Received',
          message: `New ${report.issue.category} report submitted by ${report.reporter.name}. Tracking ID: ${trackingId}`,
          reportId: report.reportId,
          trackingId: trackingId,
          priority: report.priority,
          category: report.issue.category
        };

        await this.sendToDepartment(departmentCode, departmentNotification);
      }

      return true;
    } catch (error) {
      console.error('Error sending report submission notifications:', error);
      return false;
    }
  }

  // Send notification when report status is updated
  static async onReportStatusUpdate(report, oldStatus, newStatus) {
    try {
      const trackingId = report.trackingCode || report.reportId;
      
      // Notification to user
      const userNotification = {
        type: 'status_update',
        title: 'Report Status Updated',
        message: `Your report (${trackingId}) status has been updated from ${oldStatus} to ${newStatus}.`,
        reportId: report.reportId,
        trackingId: trackingId
      };

      await this.sendToUser(report.reporter.email, userNotification);

      // If assigned to department, notify them too
      if (report.assignment && report.assignment.department) {
        const departmentNotification = {
          type: 'status_update',
          title: 'Report Status Updated',
          message: `Report ${trackingId} status updated to ${newStatus}.`,
          reportId: report.reportId,
          trackingId: trackingId
        };

        await this.sendToDepartment(report.assignment.department, departmentNotification);
      }

      return true;
    } catch (error) {
      console.error('Error sending status update notifications:', error);
      return false;
    }
  }

  // Get department code based on report category
  static getDepartmentByCategory(category) {
    const categoryMapping = {
      'Road': 'ROAD_DEPT',
      'Electricity': 'ELECTRICITY_DEPT', 
      'Sewage': 'SEWAGE_DEPT',
      'Cleanliness': 'CLEANLINESS_DEPT',
      'Dustbin Full': 'WASTE_MGMT',
      'Water': 'WATER_DEPT',
      'Streetlight': 'STREETLIGHT_DEPT'
    };

    return categoryMapping[category] || null;
  }

  // Get all notifications for a user
  static async getUserNotifications(userEmail) {
    try {
      const user = await User.findOne({ email: userEmail });
      if (!user) return [];

      return user.notifications || [];
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  }

  // Get all notifications for a department
  static async getDepartmentNotifications(departmentCode) {
    try {
      const department = await Department.findOne({ code: departmentCode });
      if (!department) return [];

      return department.notifications || [];
    } catch (error) {
      console.error('Error fetching department notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  static async markAsRead(userEmail, notificationId) {
    try {
      const user = await User.findOne({ email: userEmail });
      if (!user || !user.notifications) return false;

      const notification = user.notifications.id(notificationId);
      if (notification) {
        notification.read = true;
        await user.save();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark department notification as read
  static async markDepartmentNotificationAsRead(departmentCode, notificationId) {
    try {
      const department = await Department.findOne({ code: departmentCode });
      if (!department || !department.notifications) return false;

      const notification = department.notifications.id(notificationId);
      if (notification) {
        notification.read = true;
        await department.save();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking department notification as read:', error);
      return false;
    }
  }
}

module.exports = NotificationService;
