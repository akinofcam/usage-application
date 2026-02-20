import sqlite3 from 'sqlite3';
import path from 'path';
import { app } from 'electron';

/**
 * Manages application settings with SQLite persistence.
 * Provides get/set/reset functionality for user preferences.
 */
export class Settings {
  constructor() {
    this.db = null;
    this.dbPath = path.join(app.getPath('userData'), 'usage-settings.db');
    this.defaults = {
      darkMode: false,
      autoLockTimeout: 300, // seconds
      enableNotifications: true,
      faceVerificationThreshold: 0.55,
      faceVerificationAttempts: 3,
      faceVerificationLockDuration: 60, // seconds
      trackingInterval: 1000, // ms
      enableAnalytics: true,
    };
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
            CREATE TABLE IF NOT EXISTS settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL,
              type TEXT DEFAULT 'string',
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              reject(err);
            } else {
              // Ensure defaults exist
              this._ensureDefaults().then(resolve).catch(reject);
            }
          });
        });
      });
    });
  }

  async _ensureDefaults() {
    for (const [key, value] of Object.entries(this.defaults)) {
      const existing = await this.get(key);
      if (existing === undefined) {
        await this.set(key, value);
      }
    }
  }

  async get(key) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT value, type FROM settings WHERE key = ?',
        [key],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            resolve(this.defaults[key]);
          } else {
            let parsed = row.value;
            if (row.type === 'number') {
              parsed = parseFloat(row.value);
            } else if (row.type === 'boolean') {
              parsed = row.value === 'true';
            }
            resolve(parsed);
          }
        }
      );
    });
  }

  async set(key, value) {
    const type = typeof value;
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO settings (key, value, type) VALUES (?, ?, ?)',
        [key, String(value), type],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async getAll() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT key, value, type FROM settings', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const result = {};
          for (const row of rows || []) {
            let parsed = row.value;
            if (row.type === 'number') {
              parsed = parseFloat(row.value);
            } else if (row.type === 'boolean') {
              parsed = row.value === 'true';
            }
            result[row.key] = parsed;
          }
          // Merge with defaults to ensure all keys are present
          resolve({ ...this.defaults, ...result });
        }
      });
    });
  }

  async reset(key) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM settings WHERE key = ?',
        [key],
        (err) => {
          if (err) reject(err);
          else resolve(this.defaults[key]);
        }
      );
    });
  }

  async resetAll() {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM settings', (err) => {
        if (err) reject(err);
        else {
          this._ensureDefaults().then(() => resolve()).catch(reject);
        }
      });
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
