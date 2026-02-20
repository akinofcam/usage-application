import { app, BrowserWindow, ipcMain, globalShortcut, Menu, Tray, Notification } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AppTracker } from './tracker.js';
import { SecurityManager } from './security.js';
import { Settings } from './settings.js';
import { GoalsManager } from './goals.js';
import { FocusManager } from './focus.js';
import { IdleDetector } from './idle.js';
import { NotificationManager } from './notifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let appTracker;
let securityManager;
let settings;
let goalsManager;
let focusManager;
let idleDetector;
let notificationManager;
let tray;
const faceVerificationAttempts = new Map(); // Track failed attempts per path

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'ui.html'));
  
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Minimize to tray on close
  mainWindow.on('close', (event) => {
    if (app.quitting) {
      mainWindow = null;
    } else {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Setup system tray
  createTray();

  // Register keyboard shortcuts
  registerKeyboardShortcuts();
}

function createTray() {
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow.show() },
    { label: 'Focus Mode (10m)', click: () => mainWindow.webContents.send('tray:focus-10') },
    { label: 'Focus Mode (25m)', click: () => mainWindow.webContents.send('tray:focus-25') },
    { label: 'Focus Mode (60m)', click: () => mainWindow.webContents.send('tray:focus-60') },
    { type: 'separator' },
    { label: 'Pause Tracking', click: () => appTracker.stopTracking() },
    { label: 'Resume Tracking', click: () => appTracker.startTracking() },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.quitting = true; app.quit(); } },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

function registerKeyboardShortcuts() {
  // Ctrl+Alt+F: Toggle focus mode
  globalShortcut.register('Control+Alt+F', () => {
    if (mainWindow) {
      mainWindow.webContents.send('shortcut:toggle-focus');
    }
  });

  // Ctrl+Alt+P: Pause/resume tracking
  globalShortcut.register('Control+Alt+P', () => {
    if (appTracker.isTracking) {
      appTracker.stopTracking();
      notificationManager.send('Tracking Paused', 'App usage tracking is paused');
    } else {
      appTracker.startTracking();
      notificationManager.send('Tracking Resumed', 'App usage tracking is resumed');
    }
  });

  // Ctrl+Alt+T: Show app window
  globalShortcut.register('Control+Alt+T', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.on('ready', async () => {
  appTracker = new AppTracker();
  securityManager = new SecurityManager();
  settings = new Settings();
  goalsManager = new GoalsManager();
  focusManager = new FocusManager();
  notificationManager = new NotificationManager();
  
  try {
    await appTracker.initialize();
    await securityManager.initialize();
    await settings.initialize();
    await goalsManager.initialize();
    await focusManager.initialize();
    appTracker.startTracking();
  } catch (error) {
    console.error('Error initializing app:', error);
  }
  
  createWindow();
  
  // Initialize idle detector after window is created
  idleDetector = new IdleDetector(mainWindow);
  idleDetector.startMonitoring();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers for usage tracking
ipcMain.handle('get-usage-data', async () => {
  return await appTracker.getTodayUsage();
});

ipcMain.handle('get-app-details', async (event, appName) => {
  return await appTracker.getAppDetails(appName);
});

ipcMain.handle('export-csv', async () => {
  try {
    const res = await appTracker.exportTodayCSV();
    return res;
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handlers for security
ipcMain.handle('check-protection', async (event, filePath) => {
  return await securityManager.isPathProtected(filePath);
});

ipcMain.handle('verify-access', async (event, filePath, method, credential) => {
  return await securityManager.verifyAccess(filePath, method, credential);
});

ipcMain.handle('protect-path', async (event, filePath, method, credential) => {
  return await securityManager.protectPath(filePath, method, credential);
});

ipcMain.handle('unprotect-path', async (event, filePath) => {
  return await securityManager.unprotectPath(filePath);
});

// Listen for usage updates from tracker
ipcMain.handle('start-tracking', async () => {
  appTracker.startTracking();
});

ipcMain.handle('stop-tracking', async () => {
  appTracker.stopTracking();
});

// Face enroll/verify storage (simple image-based enrollment)
ipcMain.handle('enroll-face', async (event, filePath, imageBase64) => {
  try {
    const userData = app.getPath('userData');
    const dir = path.join(userData, 'facelock');
    await fs.promises.mkdir(dir, { recursive: true });

    // Use a safe filename derived from the protected path
    const safeName = Buffer.from(filePath).toString('hex');
    // Accept either an image data URL string or an object { embedding: [...]}.
    if (typeof imageBase64 === 'string') {
      const outPath = path.join(dir, `${safeName}.txt`);
      await fs.promises.writeFile(outPath, imageBase64, 'utf-8');
      return { success: true, path: outPath };
    }

    if (imageBase64 && typeof imageBase64 === 'object' && imageBase64.embedding) {
      const outPath = path.join(dir, `${safeName}.json`);
      await fs.promises.writeFile(outPath, JSON.stringify({ embedding: imageBase64.embedding }), 'utf-8');
      return { success: true, path: outPath };
    }

    return { success: false, error: 'Invalid enrollment payload' };
  } catch (err) {
    console.error('Error enrolling face:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-enrolled-face', async (event, filePath) => {
  try {
    const userData = app.getPath('userData');
    const dir = path.join(userData, 'facelock');
    const safeName = Buffer.from(filePath).toString('hex');
    const jsonPath = path.join(dir, `${safeName}.json`);
    const imgPath = path.join(dir, `${safeName}.txt`);
    const jsonExists = await fs.promises.stat(jsonPath).then(() => true).catch(() => false);
    if (jsonExists) {
      const data = await fs.promises.readFile(jsonPath, 'utf-8');
      return JSON.parse(data);
    }
    const imgExists = await fs.promises.stat(imgPath).then(() => true).catch(() => false);
    if (imgExists) {
      const data = await fs.promises.readFile(imgPath, 'utf-8');
      return { image: data };
    }
    return null;
  } catch (err) {
    console.error('Error reading enrolled face:', err);
    return null;
  }
});

// Settings handlers
ipcMain.handle('get-settings', async () => {
  try {
    return await settings.getAll();
  } catch (err) {
    console.error('Error getting settings:', err);
    return { error: err.message };
  }
});

ipcMain.handle('set-setting', async (event, key, value) => {
  try {
    await settings.set(key, value);
    return { success: true };
  } catch (err) {
    console.error('Error setting:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('reset-settings', async () => {
  try {
    await settings.resetAll();
    return await settings.getAll();
  } catch (err) {
    console.error('Error resetting settings:', err);
    return { error: err.message };
  }
});

// Per-day statistics
ipcMain.handle('get-usage-by-date', async (event, date) => {
  try {
    return await appTracker.getUsageByDate(date);
  } catch (err) {
    console.error('Error getting usage by date:', err);
    return { error: err.message };
  }
});

ipcMain.handle('get-week-summary', async () => {
  try {
    return await appTracker.getWeekSummary();
  } catch (err) {
    console.error('Error getting week summary:', err);
    return { error: err.message };
  }
});

// Rate-limited face verification
ipcMain.handle('verify-access-with-ratelimit', async (event, filePath, method, credential) => {
  try {
    const maxAttempts = await settings.get('faceVerificationAttempts');
    const lockDuration = await settings.get('faceVerificationLockDuration');
    
    const key = filePath;
    const now = Date.now();
    let attempt = faceVerificationAttempts.get(key) || { count: 0, lastAttempt: 0, lockedUntil: 0 };

    // Check if locked
    if (attempt.lockedUntil > now) {
      const waitSeconds = Math.ceil((attempt.lockedUntil - now) / 1000);
      return { success: false, error: `Too many failed attempts. Try again in ${waitSeconds}s` };
    }

    // Reset if lock expired
    if (attempt.lockedUntil <= now) {
      attempt = { count: 0, lastAttempt: 0, lockedUntil: 0 };
    }

    // Perform verification
    const result = await securityManager.verifyAccess(filePath, method, credential);

    if (result && result.success) {
      // Clear attempts on success
      faceVerificationAttempts.delete(key);
      return result;
    }

    // Increment failed attempts
    attempt.count += 1;
    attempt.lastAttempt = now;

    if (attempt.count >= maxAttempts) {
      attempt.lockedUntil = now + lockDuration * 1000;
      faceVerificationAttempts.set(key, attempt);
      return { success: false, error: `Too many failed attempts. Locked for ${lockDuration}s` };
    }

    faceVerificationAttempts.set(key, attempt);
    return { success: false, error: `Verification failed. Attempts: ${attempt.count}/${maxAttempts}` };
  } catch (err) {
    console.error('Error during rate-limited verification:', err);
    return { success: false, error: err.message };
  }
});

// Goals handlers
ipcMain.handle('set-goal', async (event, appName, limitMinutes, category) => {
  try {
    return await goalsManager.setGoal(appName, limitMinutes, category);
  } catch (err) {
    console.error('Error setting goal:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-goal', async (event, appName) => {
  try {
    return await goalsManager.getGoal(appName);
  } catch (err) {
    console.error('Error getting goal:', err);
    return null;
  }
});

ipcMain.handle('get-all-goals', async () => {
  try {
    return await goalsManager.getAllGoals();
  } catch (err) {
    console.error('Error getting goals:', err);
    return [];
  }
});

ipcMain.handle('delete-goal', async (event, appName) => {
  try {
    return await goalsManager.deleteGoal(appName);
  } catch (err) {
    console.error('Error deleting goal:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-goal-progress', async (event, appName, usageMs) => {
  try {
    return await goalsManager.getGoalProgress(appName, usageMs);
  } catch (err) {
    console.error('Error getting goal progress:', err);
    return null;
  }
});

// Focus mode handlers
ipcMain.handle('start-focus-session', async (event, durationMinutes, blocklistApps) => {
  try {
    const result = await focusManager.startFocusSession(durationMinutes, blocklistApps);
    notificationManager.sendFocusStarted(durationMinutes, blocklistApps ? blocklistApps.length : 0);
    return result;
  } catch (err) {
    console.error('Error starting focus session:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('end-focus-session', async () => {
  try {
    const result = await focusManager.endFocusSession();
    notificationManager.sendFocusEnded('Focus', 0);
    return result;
  } catch (err) {
    console.error('Error ending focus session:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('abort-focus-session', async () => {
  try {
    return await focusManager.abortFocusSession();
  } catch (err) {
    console.error('Error aborting focus session:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-focus-status', () => {
  const status = focusManager.getActiveFocusSession();
  return status || { isActive: false };
});

ipcMain.handle('get-focus-history', async (event, days) => {
  try {
    return await focusManager.getFocusHistory(days);
  } catch (err) {
    console.error('Error getting focus history:', err);
    return [];
  }
});

// Check if app is blocked in focus mode
ipcMain.handle('is-app-blocked', (event, appName) => {
  return focusManager.isAppBlocked(appName);
});

// Idle detection handlers
ipcMain.handle('get-idle-status', () => {
  return idleDetector.getIdleStatus();
});

ipcMain.handle('reset-idle-counter', () => {
  idleDetector.resetIdleCounter();
  return { success: true };
});

ipcMain.handle('set-idle-threshold', (event, seconds) => {
  idleDetector.setIdleThreshold(seconds);
  return { success: true };
});

// Send notifications to renderer
ipcMain.handle('send-notification', (event, title, message, options) => {
  notificationManager.send(title, message, options);
  return { success: true };
});

// Monitor focus expiry and send warnings
if (!global.focusMonitorInterval) {
  global.focusMonitorInterval = setInterval(() => {
    const focusStatus = focusManager.getActiveFocusSession();
    if (focusStatus && !focusStatus.isExpired) {
      if (focusStatus.remainingMinutes <= 5 && focusStatus.remainingMinutes > 0) {
        notificationManager.sendFocusExpiringSoon(focusStatus.remainingMinutes);
      }
      // Broadcast status to UI
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('focus-status-update', focusStatus);
      }
    }
  }, 60000); // Check every minute
}
