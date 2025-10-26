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

class NativeNotificationService {
  private static instance: NativeNotificationService;
  private notificationListener: Notifications.EventSubscription | null = null;
  private responseListener: Notifications.EventSubscription | null = null;

  private constructor() {}

  static getInstance(): NativeNotificationService {
    if (!NativeNotificationService.instance) {
      NativeNotificationService.instance = new NativeNotificationService();
    }
    return NativeNotificationService.instance;
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
      if (Platform.OS !== 'web') {
        const token = await Notifications.getExpoPushTokenAsync();
        console.log('Notification token:', token.data);
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule a local notification for a new report
   */
  async showNewReportNotification(data: {
    title: string;
    body: string;
    reportId?: string;
    reportData?: any;
  }) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: {
            reportId: data.reportId,
            reportData: data.reportData,
            type: 'new_report',
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
   * Schedule a notification for department when a new report is added
   */
  async notifyDepartmentOfNewReport(reportData: {
    title: string;
    description: string;
    category: string;
    department: string;
    trackingId: string;
    reportId: string;
  }) {
    try {
      const title = `New Report: ${reportData.category}`;
      const body = `Report #${reportData.trackingId}\n${reportData.description}`;

      await this.showNewReportNotification({
        title,
        body,
        reportId: reportData.reportId,
        reportData,
      });

      console.log('Department notified of new report:', reportData.trackingId);
    } catch (error) {
      console.error('Error notifying department:', error);
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
  setupListeners(onNotificationReceived?: (data: any) => void) {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification.request.content.data);
        }
      }
    );

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
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
}

export default NativeNotificationService.getInstance();
