import sqlite3 from 'sqlite3';
import path from 'path';
import { app } from 'electron';

/**
 * Manages daily app usage goals and limits.
 * Stores goal configs and tracks progress against them.
 */
export class GoalsManager {
  constructor() {
    this.db = null;
    this.dbPath = path.join(app.getPath('userData'), 'usage-goals.db');
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
            CREATE TABLE IF NOT EXISTS goals (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              app_name TEXT UNIQUE NOT NULL,
              limit_minutes INTEGER DEFAULT 60,
              category TEXT DEFAULT 'other',
              warning_threshold_percent INTEGER DEFAULT 80,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) console.error('Error creating goals table:', err);
            else resolve();
          });
        });
      });
    });
  }

  /**
   * Set a daily time limit goal for an app
   */
  async setGoal(appName, limitMinutes, category = 'other') {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO goals (app_name, limit_minutes, category, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [appName, limitMinutes, category],
        (err) => {
          if (err) reject(err);
          else resolve({ success: true, appName, limitMinutes });
        }
      );
    });
  }

  /**
   * Get goal for specific app
   */
  async getGoal(appName) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM goals WHERE app_name = ?',
        [appName],
        (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        }
      );
    });
  }

  /**
   * Get all goals
   */
  async getAllGoals() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM goals ORDER BY category, app_name',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  /**
   * Delete a goal
   */
  async deleteGoal(appName) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM goals WHERE app_name = ?',
        [appName],
        (err) => {
          if (err) reject(err);
          else resolve({ success: true });
        }
      );
    });
  }

  /**
   * Get progress against goal (percentage of limit used today)
   */
  async getGoalProgress(appName, todayUsageMs) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT limit_minutes, warning_threshold_percent FROM goals WHERE app_name = ?',
        [appName],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            resolve(null); // No goal set
          } else {
            const limitMs = row.limit_minutes * 60 * 1000;
            const percentage = (todayUsageMs / limitMs) * 100;
            const exceeded = percentage > 100;
            const warned = percentage >= row.warning_threshold_percent;
            resolve({
              appName,
              limitMinutes: row.limit_minutes,
              usedMs: todayUsageMs,
              usedMinutes: Math.floor(todayUsageMs / 60000),
              percentage: Math.min(percentage, 100),
              exceeded,
              warned,
              warningThreshold: row.warning_threshold_percent,
            });
          }
        }
      );
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
