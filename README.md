# 📊 Usage - macOS App Tracker

A modern macOS application that tracks app usage in real-time and allows you to protect sensitive folders with password or face recognition.

## Features

✨ **App Usage Tracking**
- Real-time monitoring of active applications
- Tracks time spent on each app
- Records app switches throughout the day
- Modern, beautiful UI with usage statistics

🔒 **Folder Protection**
- Protect sensitive folders with password
- Face recognition support (via camera)
- Device password authentication
- Prevents unauthorized access

💻 **Command Line Interface**
- Simple `usage` command to launch the app
- Countdown animation on startup
- Built-in protection management

## Installation

### Prerequisites
- macOS 10.13+
- Node.js 14+
- npm

### Setup

1. **Clone the repository**
```bash
cd /path/to/usage-application
```

2. **Install dependencies**
```bash
npm install
```

3. **Make CLI executable**
```bash
chmod +x src/cli.js
```

4. **Install globally (optional)**
```bash
npm link
```

After linking, you can run `usage` from anywhere in your terminal.

## Usage

### Launch the App

Simply type in your terminal:
```bash
usage
```

You'll see:
```
📊 Starting
3
2
1
✨ Launching Usage...
```

Then the app will open with today's usage statistics.

### Protect a Folder with Password

```bash
usage --protect /path/to/folder --method password --credential "your-password"
```

Or:
```bash
usage -p /path/to/folder -m password -c "your-password"
```

### Protect a Folder with Face Recognition

```bash
usage --protect /path/to/folder --method facelock --credential facelock
```

### View Help

```bash
usage --help
```

## Building

### Development

```bash
npm run dev
```

### Build for macOS

```bash
npm run build
```

This creates a `.dmg` file in the `dist` directory.

## Project Structure

```
usage-application/
├── src/
│   ├── main.js           # Electron main process
│   ├── preload.js        # Secure context bridge
│   ├── ui.html           # Modern UI
│   ├── cli.js            # Command line interface
│   ├── tracker.js        # App usage tracking
│   └── security.js       # Protection & security
├── package.json          # Dependencies & config
└── README.md             # This file
```

## How It Works

### App Tracking
1. The app monitors the active application every 500ms
2. When an app switch occurs, the timing data is recorded
3. All data is stored in a local SQLite database
4. The UI pulls data and displays beautiful statistics

### Folder Protection
1. When you protect a folder, credentials are hashed with SHA-256
2. The folder permissions are modified to restrict access
3. When someone tries to access the folder, they need to unlock it
4. Access logs can be retrieved from the security database

## Data Storage

All data is stored locally on your machine:
- **App Usage**: `~/Library/Application Support/Usage/usage-tracker.db`
- **Security**: `~/Library/Application Support/Usage/usage-security.db`

## Privacy

- ✅ No data is sent to servers
- ✅ All tracking is local
- ✅ You have full control over your data
- ✅ Folder protection uses local file permissions

## System Requirements

- macOS 10.13 or later
- 50 MB free disk space
- Camera (optional, for face recognition)

## Troubleshooting

### "Usage" command not found
Make sure you've installed the package globally:
```bash
npm link
```

### App not appearing
Check that Electron is properly installed:
```bash
npm install
```

### Permission denied when protecting folder
Make sure the folder exists and you have sufficient permissions:
```bash
ls -la /path/to/folder
```

### Face recognition not working
Face recognition requires:
- macOS 10.15+
- Built-in webcam or external camera
- Proper permissions in System Preferences

## Development

### Run in Development Mode
```bash
npm run dev
```

### Debug
The app includes DevTools in development mode. Press `Cmd+Option+I` to open.

## Building & Packaging

### Create DMG for distribution
```bash
npm run package
```

This creates a `.dmg` file that can be distributed to other macOS users.

### Notarization (for distribution)
For App Store distribution or wider release, you'll need to notarize the app:
```bash
electron-builder --publish always
```

## API Reference

### IPC Events (Main Process)

#### Usage Tracking
- `get-usage-data`: Get today's usage statistics
- `get-app-details`: Get details for specific app
- `start-tracking`: Start monitoring apps
- `stop-tracking`: Stop monitoring apps

#### Security
- `check-protection`: Check if path is protected
- `verify-access`: Verify access to protected path
- `protect-path`: Create protection for path
- `unprotect-path`: Remove protection from path

### CLI Arguments

```
--protect, -p    Path to protect
--method, -m     Protection method (password|facelock)
--credential, -c Credentials (password string)
--help, -h       Show help
```

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss.

## License

MIT

## Support

For issues, questions, or feature requests, please create an issue on GitHub.

---

Made with ❤️ for macOS





npm rebuild - npm run package 2>&1 | tail -30