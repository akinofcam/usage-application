# Usage App - Complete Developer Guide

Welcome to the Usage App project! This guide will help you understand, develop, and deploy the application.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Installation](#installation)
- [Development](#development)
- [Building & Deployment](#building--deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Project Overview

**Usage** is a macOS application that:

1. **Tracks app usage** in real-time with a beautiful UI
2. **Protects sensitive folders** with password or face recognition
3. **Provides CLI access** for quick launches and management
4. **Stores all data locally** for maximum privacy

### Key Stats

- **Platform**: macOS 10.13+
- **Stack**: Electron + Node.js + SQLite3
- **Language**: JavaScript (ES6 modules)
- **Package Size**: ~150MB (after bundling)
- **Development Time**: Estimated 4-6 weeks for full production release

## Architecture

### Project Structure

```
src/
├── main.js        # Electron main process (app lifecycle)
├── preload.js     # Secure context bridge for IPC
├── ui.html        # Renderer UI (modern CSS + vanilla JS)
├── cli.js         # Command-line interface
├── tracker.js     # App usage monitoring
├── security.js    # Folder protection & authentication
├── config.js      # Global configuration
└── utils.js       # Utility functions

Root/
├── package.json   # Dependencies & build config
├── README.md      # Full documentation
├── QUICKSTART.md  # Quick start guide
└── FACELOCK_GUIDE.md  # Face recognition setup
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      USAGE APP                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CLI (user types 'usage')                                   │
│    ↓                                                        │
│  countdown animation (3...2...1...)                         │
│    ↓                                                        │
│  Electron app launches                                      │
│    ↓                                                        │
│  ┌─────────────────────────────────────────────┐           │
│  │ Main Process (main.js)                      │           │
│  │ ├─ AppTracker (monitors active app)        │           │
│  │ ├─ SecurityManager (handles protection)    │           │
│  │ └─ IPC handlers (communicates with UI)     │           │
│  └─────────────────────────────────────────────┘           │
│    ↓                                          ↓            │
│   SQLite DB               UI Window (ui.html)             │
│   - usage-tracker.db      - Modern UI with charts         │
│   - usage-security.db     - Real-time updates (5s)        │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites

- macOS 10.13+
- Node.js 14+ (npm included)
- Git

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/usage-application.git
cd usage-application
```

2. **Verify setup**
```bash
chmod +x verify.sh
./verify.sh
```

3. **Install dependencies**
```bash
npm install
```

4. **Install globally (optional)**
```bash
npm link
```

## Development

### Running in Development Mode

```bash
npm run dev
```

This runs the app with:
- DevTools automatically opened
- Hot reload enabled
- Debug logging active

### Project Scripts

```json
{
  "start": "electron .",              // Run Electron app
  "dev": "electron . --development",  // Dev mode with tools
  "build": "electron-builder",        // Build for distribution
  "package": "electron-builder --mac" // Create DMG
}
```

### Debugging

#### Using DevTools
- Press `Cmd + Option + I` in dev mode to open DevTools
- Use console for debugging
- Check the Application tab for storage/databases

#### Using VS Code
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Electron",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/electron",
      "args": ["."],
      "runtimeExecutable": "/path/to/electron"
    }
  ]
}
```

### Code Style

The project follows these standards:
- **Prettier** for formatting
- **ESLint** for linting
- **ES6 modules** for imports
- **Async/await** for asynchronous code

```bash
# Format code
npx prettier --write src/

# Lint code
npx eslint src/

# Run both
npm run lint-fix
```

### Making Changes

1. **Create a feature branch**
```bash
git checkout -b feature/new-feature
```

2. **Make changes** (following code style)
3. **Test thoroughly**
4. **Commit with meaningful messages**
```bash
git commit -m "feat: add feature description"
```

5. **Push and create PR**

## Building & Deployment

### Development Build

```bash
npm run build
```

Outputs to: `dist/`

### Production Build (DMG for distribution)

```bash
npm run package
```

Creates:
- `dist/Usage-1.0.0.dmg` - Installer
- `dist/Usage-1.0.0-mac.zip` - Direct installation

### Code Signing (Required for distribution)

```bash
export CSC_LINK="/path/to/developer-certificate.p12"
export CSC_KEY_PASSWORD="your-certificate-password"
npm run package
```

### Notarization (For App Store / Wider Distribution)

```bash
npm run notarize
```

Requires Apple Developer account.

### Publishing

```bash
npm run publish
```

Updates published to:
- GitHub Releases
- App Store (if configured)

## Testing

### Unit Testing (Not yet implemented)

```bash
npm test
```

### Manual Testing Checklist

- [ ] App launches correctly with `usage` command
- [ ] Usage tracking starts automatically
- [ ] UI displays current stats
- [ ] UI updates every 5 seconds
- [ ] Folder protection works with password
- [ ] Can unprotect folders
- [ ] Database files created correctly
- [ ] App persists data across restarts

### Performance Testing

Check performance in DevTools:
- Open DevTools
- Go to Performance tab
- Record app startup and interaction sequences
- Look for jank or excessive CPU use

## Troubleshooting

### Common Issues

**1. "usage" command not found**
```bash
# Make sure you've linked the package
npm link

# Or run directly
npx usage
```

**2. App won't start**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm start
```

**3. Database locked error**
```bash
# Close all instances of the app
killall electron

# Clear cache
rm -rf ~/Library/Application\ Support/Usage/
```

**4. Permission denied when protecting folder**
```bash
# Check folder permissions
ls -la /path/to/folder

# Fix permissions
chmod 755 /path/to/folder
```

### Debug Logging

Enable verbose logging:
```bash
DEBUG=* npm run dev
```

Or in code:
```javascript
if (process.env.DEBUG) {
  console.log('Debug info:', data);
}
```

## Database Schema

### usage_tracker.db

```sql
CREATE TABLE app_usage (
  id INTEGER PRIMARY KEY,
  app_name TEXT NOT NULL,
  start_time DATETIME,
  end_time DATETIME,
  duration INTEGER,
  date DATE
);

CREATE TABLE app_switches (
  id INTEGER PRIMARY KEY,
  from_app TEXT,
  to_app TEXT,
  switch_time DATETIME,
  date DATE
);
```

### usage-security.db

```sql
CREATE TABLE protected_paths (
  id INTEGER PRIMARY KEY,
  file_path TEXT UNIQUE,
  protection_method TEXT,
  credential_hash TEXT,
  created_at DATETIME,
  updated_at DATETIME
);
```

## Development Roadmap

### Phase 1: MVP (Current)
- ✅ App usage tracking
- ✅ Modern UI
- ✅ Folder protection with password
- ✅ CLI tool

### Phase 2: Enhancement
- ⏳ Face recognition support
- ⏳ Statistics export (CSV/JSON)
- ⏳ Productivity goals & alerts
- ⏳ Dark mode

### Phase 3: Advanced
- ⏳ Multi-user support
- ⏳ Cloud backup
- ⏳ Mobile companion app
- ⏳ Website dashboard

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Follow the code style guide
4. Add tests for new features
5. Submit a pull request

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [SQLite3 Node.js](https://github.com/mapbox/node-sqlite3)
- [macOS Security Framework](https://developer.apple.com/documentation/security)

## License

MIT - See LICENSE file for details

## Support

- 📖 Read the [README.md](README.md)
- 🚀 Follow the [QUICKSTART.md](QUICKSTART.md)
- 🔐 Check [FACELOCK_GUIDE.md](FACELOCK_GUIDE.md) for face recognition
- 💬 Open an issue on GitHub

---

**Happy coding! 🚀**

Questions? Suggestions? Open an issue!
