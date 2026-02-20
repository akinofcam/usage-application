import { execSync } from 'child_process';
import sqlite3 from 'sqlite3';
import path from 'path';
// no fileURLToPath needed in tracker
import { app } from 'electron';
import fs from 'fs';

// __filename/__dirname not needed in tracker

export class AppTracker {
  constructor() {
    this.db = null;
    this.isTracking = false;
    this.currentApp = null;
    this.trackingInterval = null;
    this.dbPath = path.join(app.getPath('userData'), 'usage-tracker.db');
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.db.serialize(() => {
          this.db.run(`
            CREATE TABLE IF NOT EXISTS app_usage (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              app_name TEXT NOT NULL,
              start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
              end_time DATETIME,
              duration INTEGER DEFAULT 0,
              date DATE DEFAULT CURRENT_DATE
            )
          `, (err) => {
            if (err) console.error('Error creating table:', err);
          });

          this.db.run(`
            CREATE TABLE IF NOT EXISTS app_switches (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              from_app TEXT NOT NULL,
              to_app TEXT NOT NULL,
              switch_time DATETIME DEFAULT CURRENT_TIMESTAMP,
              date DATE DEFAULT CURRENT_DATE
            )
          `, (err) => {
            if (err) console.error('Error creating switches table:', err);
            resolve();
          });
        });
      });
    });
  }

  startTracking() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.currentApp = this.getActiveApp();
    
    // Track app changes every 500ms
    this.trackingInterval = setInterval(() => {
      const activeApp = this.getActiveApp();
      
      if (activeApp !== this.currentApp) {
        // App switched
        this.recordAppSwitch(this.currentApp, activeApp);
        this.currentApp = activeApp;
      }
    }, 500);
  }

  stopTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    this.isTracking = false;
  }

  getActiveApp() {
    try {
      // macOS: Get the active application
      const command = 'osascript -e \'tell application "System Events" to name of (processes where frontmost is true)\'';
      const result = execSync(command, { encoding: 'utf-8' }).trim();
      return result || 'Unknown';
    } catch (error) {
      console.error('Error getting active app:', error);
      return 'Unknown';
    }
  }

  recordAppSwitch(fromApp, toApp) {
    if (!this.db) return;

    this.db.run(
      'INSERT INTO app_switches (from_app, to_app, date) VALUES (?, ?, DATE(\'now\'))',
      [fromApp, toApp],
      (err) => {
        if (err) console.error('Error recording switch:', err);
      }
    );

    // Update duration for the previous app
    this.db.run(
      `UPDATE app_usage 
       SET end_time = CURRENT_TIMESTAMP, 
           duration = CAST((julianday(CURRENT_TIMESTAMP) - julianday(start_time)) * 86400000 AS INTEGER)
       WHERE app_name = ? AND end_time IS NULL AND date = DATE('now')
       LIMIT 1`,
      [fromApp]
    );

    // Start tracking new app
    this.db.run(
      'INSERT INTO app_usage (app_name, start_time, date) VALUES (?, CURRENT_TIMESTAMP, DATE(\'now\'))',
      [toApp],
      (err) => {
        if (err) console.error('Error inserting app usage:', err);
      }
    );
  }

  getTodayUsage() {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve({ apps: [], totalTime: 0, switches: 0 });
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      // Get app usage
      this.db.all(
        `SELECT app_name, SUM(duration) as total_duration, COUNT(*) as sessions
         FROM app_usage 
         WHERE date = ?
         GROUP BY app_name
         ORDER BY total_duration DESC`,
        [today],
        (err, rows) => {
          if (err) {
            console.error('Error fetching usage data:', err);
            resolve({ apps: [], totalTime: 0, switches: 0 });
            return;
          }

          const apps = (rows || []).map(row => ({
            name: row.app_name,
            duration: row.total_duration || 0,
            sessions: row.sessions,
          }));

          const totalTime = apps.reduce((sum, app) => sum + app.duration, 0);

          // Get switch count
          this.db.get(
            'SELECT COUNT(*) as count FROM app_switches WHERE date = ?',
            [today],
            (err, row) => {
              if (err) {
                resolve({ apps, totalTime, switches: 0 });
                return;
              }

              resolve({
                apps,
                totalTime,
                switches: row?.count || 0,
              });
            }
          );
        }
      );
    });
  }

  getAppDetails(appName) {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      this.db.get(
        `SELECT 
          app_name,
          COUNT(*) as sessions,
          SUM(duration) as total_duration,
          MIN(start_time) as first_used,
          MAX(end_time) as last_used
         FROM app_usage 
         WHERE app_name = ? AND date = ?
         GROUP BY app_name`,
        [appName, today],
        (err, row) => {
          if (err) {
            console.error('Error fetching app details:', err);
            resolve(null);
            return;
          }

          resolve(row || null);
        }
      );
    });
  }

  async exportTodayCSV() {
    if (!this.db) return { success: false, message: 'DB not initialized' };
    const today = new Date().toISOString().split('T')[0];

    const rows = await new Promise((resolve) => {
      this.db.all(
        `SELECT app_name, SUM(duration) as total_duration, COUNT(*) as sessions
         FROM app_usage WHERE date = ? GROUP BY app_name ORDER BY total_duration DESC`,
        [today],
        (err, rows) => {
          if (err) {
            resolve([]);
            return;
          }
          resolve(rows || []);
        }
      );
    });

    const lines = ['app_name,total_duration_ms,sessions'];
    for (const r of rows) {
      lines.push(`${r.app_name},${r.total_duration || 0},${r.sessions}`);
    }

    const csv = lines.join('\n');
    const outPath = path.join(app.getPath('userData'), `usage-${today}.csv`);
    await fs.promises.writeFile(outPath, csv, 'utf-8');
    return { success: true, path: outPath };
  }

  /**
   * Get usage statistics for a specific date.
   */
  async getUsageByDate(date) {
    return new Promise((resolve) => {
      this.db.all(
        `SELECT app_name, SUM(duration) as total_duration, COUNT(*) as sessions,
                MIN(start_time) as first_use, MAX(end_time) as last_use
         FROM app_usage WHERE date = ? GROUP BY app_name ORDER BY total_duration DESC`,
        [date],
        (err, rows) => {
          if (err) {
            console.error('Error getting usage by date:', err);
            resolve([]);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  }

  /**
   * Get summary statistics for the past 7 days.
   */
  async getWeekSummary() {
    return new Promise((resolve) => {
      this.db.all(
        `SELECT 
           date, 
           app_name, 
           SUM(duration) as total_duration,
           COUNT(*) as sessions
         FROM app_usage 
         WHERE date >= DATE('now', '-7 days')
         GROUP BY date, app_name
         ORDER BY date DESC, total_duration DESC`,
        [],
        (err, rows) => {
          if (err) {
            console.error('Error getting week summary:', err);
            resolve([]);
          } else {
            // Group by date
            const byDate = {};
            for (const row of rows || []) {
              if (!byDate[row.date]) byDate[row.date] = [];
              byDate[row.date].push(row);
            }
            resolve(byDate);
          }
        }
      );
    });
  }
}
