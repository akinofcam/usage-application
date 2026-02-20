// Lightweight FaceLock/biometric wrapper.
// Attempts to use macOS native biometric authentication (Touch ID) via optional module.
// Falls back to a stub (not authorized) when running on non-macOS or when module is unavailable.

export class FaceLock {
  constructor() {
    this.backend = null;
    this.available = false;

    try {
      // optional runtime require; package is listed as optionalDependencies
      // This module provides a simple `authenticate(prompt)` promise-based API on macOS
      // See: https://github.com/theryaz/mac-biometric-authenticate
      // If not present or not supported (non-mac), this will throw.
      // Keep calls guarded so the app can run on Linux/Windows during development.
      // eslint-disable-next-line global-require
      const macAuth = require('mac-biometric-authenticate');
      this.backend = macAuth;
      this.available = true;
    } catch (err) {
      this.backend = null;
      this.available = false;
    }
  }

  isAvailable() {
    return this.available;
  }

  async verify(prompt = 'Verify to unlock') {
    if (!this.available) {
      return { authorized: false, message: 'Biometric module not available' };
    }

    try {
      // macAuth.authenticate returns a promise that resolves on success
      await this.backend.authenticate(prompt);
      return { authorized: true, message: 'Biometric verification successful' };
    } catch (err) {
      return { authorized: false, message: err?.message || 'Biometric verification failed' };
    }
  }
}

export default FaceLock;
