// Configuration for Usage App
export const config = {
  app: {
    name: 'Usage',
    version: '1.0.0',
    author: 'Your Name',
    description: 'macOS App Usage Tracker with Protection',
  },

  ui: {
    refreshInterval: 5000, // milliseconds
    countdownDuration: 3, // seconds
  },

  tracking: {
    appCheckInterval: 500, // milliseconds
    dbRefreshInterval: 1000, // milliseconds
  },

  security: {
    hashAlgorithm: 'sha256',
    dbEncryption: false, // TODO: Add encryption
  },

  paths: {
    db: {
      usage: 'usage-tracker.db',
      security: 'usage-security.db',
    },
  },

  permissions: {
    protected: '700', // rwx------
    normal: '755', // rwxr-xr-x
  },
};

export default config;
