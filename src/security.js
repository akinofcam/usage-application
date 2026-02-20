import sqlite3 from 'sqlite3';
import path from 'path';
import { app } from 'electron';
import crypto from 'crypto';
import fs from 'fs';
import { execSync } from 'child_process';
import { FaceLock } from './facelock.js';

// no __dirname needed here

export class SecurityManager {
  constructor() {
    this.db = null;
    this.dbPath = path.join(app.getPath('userData'), 'usage-security.db');
    this.faceLock = new FaceLock();
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
            CREATE TABLE IF NOT EXISTS protected_paths (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              file_path TEXT UNIQUE NOT NULL,
              protection_method TEXT NOT NULL,
              credential_hash TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) console.error('Error creating protected_paths table:', err);
            resolve();
          });
        });
      });
    });
  }

  hashCredential(credential) {
    return crypto.createHash('sha256').update(credential).digest('hex');
  }

  async isPathProtected(filePath) {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(false);
        return;
      }

      this.db.get(
        'SELECT id FROM protected_paths WHERE file_path = ?',
        [filePath],
        (err, row) => {
          if (err) {
            console.error('Error checking protection:', err);
            resolve(false);
            return;
          }

          resolve(!!row);
        }
      );
    });
  }

  async protectPath(filePath, method, credential) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      // Validate file/folder exists
      if (!fs.existsSync(filePath)) {
        reject(new Error('Path does not exist'));
        return;
      }

      const credentialHash = this.hashCredential(credential);

      this.db.run(
        `INSERT OR REPLACE INTO protected_paths 
         (file_path, protection_method, credential_hash, updated_at) 
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [filePath, method, credentialHash],
        (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Set folder permissions on macOS
          if (method === 'password') {
            this.setFolderPermission(filePath, true);
          }

          resolve({ success: true, message: `Path protected with ${method}` });
        }
      );
    });
  }

  async unprotectPath(filePath) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.run(
        'DELETE FROM protected_paths WHERE file_path = ?',
        [filePath],
        (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Restore folder permissions
          this.setFolderPermission(filePath, false);

          resolve({ success: true, message: 'Path protection removed' });
        }
      );
    });
  }

  async verifyAccess(filePath, method, credential) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.get(
        'SELECT protection_method, credential_hash FROM protected_paths WHERE file_path = ?',
        [filePath],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (!row) {
            resolve({ authorized: true, message: 'Path not protected' });
            return;
          }

          if (row.protection_method === 'password') {
            const credentialHash = this.hashCredential(credential);
            const authorized = credentialHash === row.credential_hash;
            
            resolve({
              authorized,
              message: authorized ? 'Access granted' : 'Incorrect password',
            });
          } else if (row.protection_method === 'facelock') {
            // Try biometric verification (Touch ID) via FaceLock wrapper.
            (async () => {
              if (this.faceLock.isAvailable()) {
                try {
                  const result = await this.faceLock.verify('Unlock protected path');
                  resolve({ authorized: !!result.authorized, message: result.message });
                } catch (err) {
                  resolve({ authorized: false, message: err?.message || 'Verification failed' });
                }
              } else {
                resolve({
                  authorized: false,
                  message: 'Biometric authentication not available on this system',
                  requiresFaceVerification: true,
                });
              }
            })();
            return;
          }
        }
      );
    });
  }

  setFolderPermission(folderPath, protect) {
    try {
      // macOS: Use chmod to restrict access
      if (protect) {
        // Remove read/write/execute for others
        execSync(`chmod 700 "${folderPath}"`);
      } else {
        // Restore normal permissions
        execSync(`chmod 755 "${folderPath}"`);
      }
    } catch (error) {
      console.error('Error setting folder permission:', error);
    }
  }
}
