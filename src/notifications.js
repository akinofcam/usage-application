import { Notification } from 'electron';

/**
 * Manages native system notifications for goal alerts, focus sessions, etc.
 */
export class NotificationManager {
  constructor() {
    this.notifications = [];
  }

  /**
   * Send a goal warning notification
   */
  sendGoalWarning(appName, percentage, limitMinutes) {
    const title = `⚠️ ${appName} Time Limit`;
    const message = `${Math.floor(percentage)}% of daily limit used (${limitMinutes} min)`;
    this.send(title, message);
  }

  /**
   * Send a goal exceeded notification
   */
  sendGoalExceeded(appName, usedMinutes, limitMinutes) {
    const title = `🚫 ${appName} Limit Exceeded`;
    const message = `You've exceeded the ${limitMinutes}min limit by ${usedMinutes - limitMinutes}min`;
    this.send(title, message, { urgency: 'critical' });
  }

  /**
   * Send focus mode started notification
   */
  sendFocusStarted(durationMinutes, appCount) {
    const title = '🎯 Focus Mode Activated';
    const message = `${durationMinutes}m focus session • ${appCount} app${appCount > 1 ? 's' : ''} blocked`;
    this.send(title, message);
  }

  /**
   * Send focus mode expiring soon notification
   */
  sendFocusExpiringSoon(minutesRemaining) {
    const title = '⏰ Focus Session Expiring Soon';
    const message = `${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''} remaining`;
    this.send(title, message);
  }

  /**
   * Send focus mode ended notification
   */
  sendFocusEnded(focusedApp, sessionMinutes) {
    const title = '✅ Focus Session Complete';
    const message = `Great work! ${sessionMinutes}min focused session finished`;
    this.send(title, message);
  }

  /**
   * Send app blocked notification
   */
  sendAppBlocked(appName) {
    const title = '🚫 App Blocked';
    const message = `${appName} is blocked during focus mode`;
    this.send(title, message);
  }

  /**
   * Send idle detection notification
   */
  sendIdleStart() {
    const title = '😴 Idle Detected';
    const message = 'Tracking paused due to inactivity';
    this.send(title, message);
  }

  /**
   * Send resumed notification
   */
  sendIdleEnd() {
    const title = '👁️ Activity Detected';
    const message = 'Tracking resumed';
    this.send(title, message);
  }

  /**
   * Generic notification send
   */
  send(title, message, options = {}) {
    try {
      const notification = new Notification({
        title,
        body: message,
        icon: undefined,
        silent: options.silent || false,
        urgency: options.urgency || 'normal',
        ...options,
      });

      notification.show();
      this.notifications.push(notification);

      // Clean up old notifications
      if (this.notifications.length > 20) {
        this.notifications = this.notifications.slice(-20);
      }

      return notification;
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  }

  /**
   * Close all notifications
   */
  closeAll() {
    for (const notif of this.notifications) {
      try {
        notif.close();
      } catch (e) {
        // Already closed
      }
    }
    this.notifications = [];
  }
}
