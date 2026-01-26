// Browser Notification Service
import type { Medication, Reminder } from '../types';

export interface NotificationOptions {
  medicationName: string;
  time: string;
  reminderId: string;
  medicationId: string;
}

class NotificationService {
  private permissionGranted: boolean = false;

  // Request notification permission from the user
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      return this.permissionGranted;
    }

    return false;
  }

  // Check if notifications are supported and permitted
  isPermissionGranted(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  // Show a notification
  async showNotification(options: NotificationOptions): Promise<Notification | null> {
    if (!this.isPermissionGranted()) {
      console.warn('Notification permission not granted');
      return null;
    }

    const notification = new Notification('💊 Medication Reminder', {
      body: `Time to take your ${options.medicationName} at ${options.time}`,
      icon: '/pill-icon.png', // Optional: Add an icon to your public folder
      badge: '/pill-badge.png', // Optional: Badge icon
      tag: options.reminderId, // Prevents duplicate notifications
      requireInteraction: true, // Keeps notification visible until user interacts
      // vibrate: [200, 100, 200], // Vibration pattern - not in standard NotificationOptions
      data: {
        reminderId: options.reminderId,
        medicationId: options.medicationId,
        medicationName: options.medicationName,
      },
    });

    // Handle notification click
    notification.onclick = () => {
      window.focus(); // Bring the app to focus
      notification.close();

      // Dispatch custom event for the app to handle
      window.dispatchEvent(
        new CustomEvent('notification-clicked', {
          detail: {
            reminderId: options.reminderId,
            medicationId: options.medicationId,
            medicationName: options.medicationName,
          },
        })
      );
    };

    return notification;
  }

  // Schedule a notification check
  scheduleReminderCheck(
    reminder: Reminder,
    medication: Medication,
    callback: () => void
  ): ReturnType<typeof setInterval> {
    // Check every minute if the reminder time has passed
    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];

      // Check if current time matches reminder time and day
      if (
        reminder.time === currentTime &&
        reminder.days.includes(currentDay as any)
      ) {
        this.showNotification({
          medicationName: medication.name,
          time: reminder.time,
          reminderId: reminder.id,
          medicationId: medication.id,
        });
        callback();
      }
    }, 60000); // Check every minute

    return checkInterval;
  }

  // Clear a scheduled reminder
  clearReminderCheck(intervalId: ReturnType<typeof setInterval>): void {
    clearInterval(intervalId);
  }

  // Test notification (for debugging)
  async testNotification(): Promise<void> {
    if (await this.requestPermission()) {
      this.showNotification({
        medicationName: 'Test Medication',
        time: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        reminderId: 'test-reminder',
        medicationId: 'test-medication',
      });
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

export default notificationService;
