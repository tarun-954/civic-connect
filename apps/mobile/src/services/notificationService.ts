import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: 'new_report' | 'report_update' | 'report_resolved' | 'general';
  reportId?: string;
  trackingId?: string;
  title: string;
  body: string;
  department?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
}

class NotificationService {
  private static instance: NotificationService;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Request notification permissions from the device
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      // Get the notification token for push notifications (optional)
      // Note: Push tokens require Firebase setup for Android
      // For now, we'll use local notifications only
      if (Platform.OS !== 'web') {
        try {
          // const token = await Notifications.getExpoPushTokenAsync({
          //   projectId: 'your-project-id', // This is required for Android
          // });
          // console.log('Notification token:', token.data);
          console.log('Push notifications disabled - using local notifications only');
        } catch (error) {
          console.log('Could not get push token:', error);
          // Continue without push token - local notifications will still work
        }
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Show a local notification
   */
  async showNotification(data: NotificationData): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: {
            type: data.type,
            reportId: data.reportId,
            trackingId: data.trackingId,
            department: data.department,
            category: data.category,
            priority: data.priority,
          },
          sound: true,
        },
        trigger: null, // Show immediately
      });

      console.log('Notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error showing notification:', error);
      throw error;
    }
  }

  /**
   * Notify citizen when their report status changes
   */
  async notifyCitizenOfReportUpdate(data: {
    reportId: string;
    trackingId: string;
    status: string;
    title: string;
    description: string;
    category: string;
  }) {
    try {
      const title = `Report Update: ${data.status}`;
      const body = `Your report #${data.trackingId} (${data.category}) has been updated to: ${data.status}`;

      await this.showNotification({
        type: 'report_update',
        reportId: data.reportId,
        trackingId: data.trackingId,
        title,
        body,
        category: data.category,
        priority: 'medium',
      });

      console.log('Citizen notified of report update:', data.trackingId);
    } catch (error) {
      console.error('Error notifying citizen:', error);
      throw error;
    }
  }

  /**
   * Notify department when a new report is submitted
   */
  async notifyDepartmentOfNewReport(data: {
    reportId: string;
    trackingId: string;
    title: string;
    description: string;
    category: string;
    department: string;
    priority?: 'low' | 'medium' | 'high';
  }) {
    try {
      const title = `New Report: ${data.category}`;
      const body = `Report #${data.trackingId}\n${data.description}`;

      await this.showNotification({
        type: 'new_report',
        reportId: data.reportId,
        trackingId: data.trackingId,
        title,
        body,
        department: data.department,
        category: data.category,
        priority: data.priority || 'medium',
      });

      console.log('Department notified of new report:', data.trackingId);
    } catch (error) {
      console.error('Error notifying department:', error);
      throw error;
    }
  }

  /**
   * Notify when a report is resolved
   */
  async notifyReportResolved(data: {
    reportId: string;
    trackingId: string;
    category: string;
    department: string;
  }) {
    try {
      const title = `Report Resolved: ${data.category}`;
      const body = `Report #${data.trackingId} has been resolved by ${data.department}`;

      await this.showNotification({
        type: 'report_resolved',
        reportId: data.reportId,
        trackingId: data.trackingId,
        title,
        body,
        department: data.department,
        category: data.category,
        priority: 'high',
      });

      console.log('Report resolved notification sent:', data.trackingId);
    } catch (error) {
      console.error('Error sending resolved notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a specific notification
   */
  async cancelNotification(notificationId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  setupListeners(onNotificationReceived?: (data: NotificationData) => void) {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification.request.content.data as NotificationData);
        }
      }
    );

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as NotificationData;
        console.log('Notification tapped:', data);
        if (onNotificationReceived) {
          onNotificationReceived(data);
        }
      }
    );
  }

  /**
   * Remove all listeners
   */
  removeListeners() {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }

  /**
   * Get all notifications (for notification screen)
   */
  async getAllNotifications(): Promise<Notifications.Notification[]> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Get notification count
   */
  async getNotificationCount(): Promise<number> {
    try {
      const notifications = await this.getAllNotifications();
      return notifications.length;
    } catch (error) {
      console.error('Error getting notification count:', error);
      return 0;
    }
  }
}

export default NotificationService.getInstance();
