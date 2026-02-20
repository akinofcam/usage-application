import sqlite3 from 'sqlite3';
import path from 'path';
import { app } from 'electron';

/**
 * Manages Focus Mode: blocks distracting apps for set duration.
 * Tracks active focus sessions and blocked apps list.
 */
export class FocusManager {
  constructor() {
    this.db = null;
    this.dbPath = path.join(app.getPath('userData'), 'usage-focus.db');
    this.activeFocusSession = null;
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
            CREATE TABLE IF NOT EXISTS focus_sessions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
              end_time DATETIME,
              duration_minutes INTEGER,
              aborted BOOLEAN DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) console.error('Error creating focus_sessions table:', err);
          });

          this.db.run(`
            CREATE TABLE IF NOT EXISTS focus_blocklist (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              app_name TEXT UNIQUE NOT NULL,
              reason TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) console.error('Error creating focus_blocklist table:', err);
            else resolve();
          });
        });
      });
    });
  }

  /**
   * Start a focus session (blocks specified apps for duration)
   */
  async startFocusSession(durationMinutes, blocklistApps = []) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO focus_sessions (duration_minutes) VALUES (?)`,
        [durationMinutes],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          const sessionId = this.lastID;
          
          // Add apps to blocklist
          if (blocklistApps && blocklistApps.length > 0) {
            const stmt = this.db.prepare(
              'INSERT OR IGNORE INTO focus_blocklist (app_name) VALUES (?)'
            );
            for (const app of blocklistApps) {
              stmt.run([app]);
            }
            stmt.finalize();
          }

          this.activeFocusSession = {
            id: sessionId,
            startTime: Date.now(),
            durationMinutes,
            blocklistApps,
          };
          resolve({ success: true, sessionId, durationMinutes });
        }
      );
    });
  }

  /**
   * End the current focus session
   */
  async endFocusSession() {
    if (!this.activeFocusSession) {
      return { success: false, error: 'No active focus session' };
    }

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE focus_sessions SET end_time = CURRENT_TIMESTAMP, aborted = 0 WHERE id = ?`,
        [this.activeFocusSession.id],
        (err) => {
          if (err) {
            reject(err);
          } else {
            this.activeFocusSession = null;
            resolve({ success: true });
          }
        }
      );
    });
  }

  /**
   * Abort focus session early
   */
  async abortFocusSession() {
    if (!this.activeFocusSession) {
      return { success: false, error: 'No active focus session' };
    }

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE focus_sessions SET end_time = CURRENT_TIMESTAMP, aborted = 1 WHERE id = ?`,
        [this.activeFocusSession.id],
        (err) => {
          if (err) {
            reject(err);
          } else {
            this.activeFocusSession = null;
            // Clear blocklist
            this.db.run('DELETE FROM focus_blocklist', (err) => {
              if (err) console.error('Error clearing blocklist:', err);
              resolve({ success: true });
            });
          }
        }
      );
    });
  }

  /**
   * Get current active focus session status
   */
  getActiveFocusSession() {
    if (!this.activeFocusSession) return null;
    
    const elapsed = Date.now() - this.activeFocusSession.startTime;
    const elapsedMinutes = Math.floor(elapsed / 60000);
    const remaining = Math.max(0, this.activeFocusSession.durationMinutes - elapsedMinutes);
    const isExpired = remaining === 0;

    return {
      ...this.activeFocusSession,
      elapsedMinutes,
      remainingMinutes: remaining,
      isExpired,
      percentComplete: (elapsedMinutes / this.activeFocusSession.durationMinutes) * 100,
    };
  }

  /**
   * Check if an app is blocked in focus mode
   */
  isAppBlocked(appName) {
    const focus = this.getActiveFocusSession();
    if (!focus) return false;
    if (focus.isExpired) {
      this.activeFocusSession = null;
      return false;
    }
    return focus.blocklistApps.includes(appName);
  }

  /**
   * Get focus session history
   */
  async getFocusHistory(days = 7) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM focus_sessions 
         WHERE created_at >= DATE('now', ?)
         ORDER BY start_time DESC`,
        [`-${days} days`],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
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
