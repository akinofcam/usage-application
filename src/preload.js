import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('usageAPI', {
  // Usage tracking APIs
  getUsageData: () => ipcRenderer.invoke('get-usage-data'),
  getAppDetails: (appName) => ipcRenderer.invoke('get-app-details', appName),
  getUsageByDate: (date) => ipcRenderer.invoke('get-usage-by-date', date),
  getWeekSummary: () => ipcRenderer.invoke('get-week-summary'),
  exportCSV: () => ipcRenderer.invoke('export-csv'),
  
  // Security APIs
  checkProtection: (filePath) => ipcRenderer.invoke('check-protection', filePath),
  verifyAccess: (filePath, method, credential) => ipcRenderer.invoke('verify-access', filePath, method, credential),
  verifyAccessWithRateLimit: (filePath, method, credential) => ipcRenderer.invoke('verify-access-with-ratelimit', filePath, method, credential),
  protectPath: (filePath, method, credential) => ipcRenderer.invoke('protect-path', filePath, method, credential),
  unprotectPath: (filePath) => ipcRenderer.invoke('unprotect-path', filePath),
  
  // Tracking control
  startTracking: () => ipcRenderer.invoke('start-tracking'),
  stopTracking: () => ipcRenderer.invoke('stop-tracking'),
  
  // Face enrollment and verification via camera
  enrollFace: (filePath, payload) => ipcRenderer.invoke('enroll-face', filePath, payload),
  getEnrolledFace: (filePath) => ipcRenderer.invoke('get-enrolled-face', filePath),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  resetSettings: () => ipcRenderer.invoke('reset-settings'),

  // Goals
  setGoal: (appName, limitMinutes, category) => ipcRenderer.invoke('set-goal', appName, limitMinutes, category),
  getGoal: (appName) => ipcRenderer.invoke('get-goal', appName),
  getAllGoals: () => ipcRenderer.invoke('get-all-goals'),
  deleteGoal: (appName) => ipcRenderer.invoke('delete-goal', appName),
  getGoalProgress: (appName, usageMs) => ipcRenderer.invoke('get-goal-progress', appName, usageMs),

  // Focus mode
  startFocusSession: (durationMinutes, blocklistApps) => ipcRenderer.invoke('start-focus-session', durationMinutes, blocklistApps),
  endFocusSession: () => ipcRenderer.invoke('end-focus-session'),
  abortFocusSession: () => ipcRenderer.invoke('abort-focus-session'),
  getFocusStatus: () => ipcRenderer.invoke('get-focus-status'),
  getFocusHistory: (days) => ipcRenderer.invoke('get-focus-history', days),
  isAppBlocked: (appName) => ipcRenderer.invoke('is-app-blocked', appName),

  // Idle detection
  getIdleStatus: () => ipcRenderer.invoke('get-idle-status'),
  resetIdleCounter: () => ipcRenderer.invoke('reset-idle-counter'),
  setIdleThreshold: (seconds) => ipcRenderer.invoke('set-idle-threshold', seconds),

  // Notifications
  sendNotification: (title, message, options) => ipcRenderer.invoke('send-notification', title, message, options),

  // Event listeners
  onFocusStatusUpdate: (callback) => ipcRenderer.on('focus-status-update', (event, status) => callback(status)),
  onIdleDetectorStart: (callback) => ipcRenderer.on('idle-detector:idle-start', callback),
  onIdleDetectorEnd: (callback) => ipcRenderer.on('idle-detector:idle-end', callback),
  onShortcutToggleFocus: (callback) => ipcRenderer.on('shortcut:toggle-focus', callback),
  onTrayFocus: (durationMinutes) => (callback) => ipcRenderer.on(`tray:focus-${durationMinutes}`, callback),
});

