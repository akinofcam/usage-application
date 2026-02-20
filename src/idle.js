import { globalShortcut, ipcMain } from 'electron';

/**
 * Detects system idle time and auto-pauses tracking.
 * Uses lastKeyboardInput and lastMouseInput to determine idle status.
 */
export class IdleDetector {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.idleThresholdMs = 5 * 60 * 1000; // 5 minutes
    this.isIdle = false;
    this.pausedByIdle = false;
    this.lastActivityTime = Date.now();
  }

  /**
   * Start monitoring for user activity
   */
  startMonitoring() {
    // Listen for user activity events from main window
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.on('before-input-event', (event, input) => {
        this.lastActivityTime = Date.now();
        if (this.isIdle) {
          this.isIdle = false;
          if (this.pausedByIdle) {
            this.pausedByIdle = false;
            this.mainWindow.webContents.send('idle-detector:activity-resumed');
          }
        }
      });
    }

    // Check idle status every 10 seconds
    this.idleCheckInterval = setInterval(() => {
      this.checkIdleStatus();
    }, 10000);
  }

  /**
   * Check if system is idle
   */
  checkIdleStatus() {
    const inactiveMs = Date.now() - this.lastActivityTime;
    const wasIdle = this.isIdle;

    if (inactiveMs > this.idleThresholdMs) {
      this.isIdle = true;
      if (!wasIdle && this.mainWindow) {
        this.pausedByIdle = true;
        this.mainWindow.webContents.send('idle-detector:idle-start');
      }
    } else {
      this.isIdle = false;
      if (wasIdle && this.pausedByIdle && this.mainWindow) {
        this.pausedByIdle = false;
        this.mainWindow.webContents.send('idle-detector:idle-end');
      }
    }
  }

  /**
   * Get current idle status
   */
  getIdleStatus() {
    const inactiveMs = Date.now() - this.lastActivityTime;
    return {
      isIdle: this.isIdle,
      inactiveSeconds: Math.floor(inactiveMs / 1000),
      thresholdSeconds: Math.floor(this.idleThresholdMs / 1000),
      pausedByIdle: this.pausedByIdle,
    };
  }

  /**
   * Set idle threshold (in seconds)
   */
  setIdleThreshold(seconds) {
    this.idleThresholdMs = Math.max(30, seconds) * 1000; // Min 30 seconds
  }

  /**
   * Reset idle counter (used when user manually interacts)
   */
  resetIdleCounter() {
    this.lastActivityTime = Date.now();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }
  }
}
