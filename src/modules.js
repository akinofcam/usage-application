/**
 * Usage Modules - Core manager exports
 * 
 * This module exports all Usage app managers and utilities
 * for use in Electron main process, CLI, or external tooling.
 */

export { AppTracker } from './tracker.js';
export { SecurityManager } from './security.js';
export { Settings } from './settings.js';
export { GoalsManager } from './goals.js';
export { FocusManager } from './focus.js';
export { IdleDetector } from './idle.js';
export { NotificationManager } from './notifications.js';

export const UsageModules = {
  AppTracker: () => import('./tracker.js').then(m => m.AppTracker),
  SecurityManager: () => import('./security.js').then(m => m.SecurityManager),
  Settings: () => import('./settings.js').then(m => m.Settings),
  GoalsManager: () => import('./goals.js').then(m => m.GoalsManager),
  FocusManager: () => import('./focus.js').then(m => m.FocusManager),
  IdleDetector: () => import('./idle.js').then(m => m.IdleDetector),
  NotificationManager: () => import('./notifications.js').then(m => m.NotificationManager),
};

export default UsageModules;
