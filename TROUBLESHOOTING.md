# 🆘 Troubleshooting Guide

## Common Issues and Solutions

### Installation Issues

#### 1. npm command not found
**Problem**: `npm: command not found`

**Solution**:
- Install Node.js from https://nodejs.org/
- Verify: `node --version` and `npm --version`
- Restart terminal after installation

#### 2. Package installation fails
**Problem**: `npm install` fails with errors

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Try installing again
npm install

# If still failing, try with sudo
sudo npm install -g npm@latest
npm install
```

#### 3. permission denied: './src/cli.js'
**Problem**: CLI script is not executable

**Solution**:
```bash
chmod +x src/cli.js
chmod +x install.sh verify.sh
```

### Runtime Issues

#### 1. "usage" command not found
**Problem**: `command not found: usage`

**Solution**:
```bash
# Install globally
npm link

# Or run directly
npx usage

# Or in project folder
npm start
```

#### 2. App won't launch
**Problem**: App crashes on startup

**Solution**:
```bash
# Check logs
cat ~/Library/Application\ Support/Usage/

# Clear cache and reinstall
rm -rf node_modules
npm install

# Try running in dev mode
npm run dev
```

#### 3. "Module not found" errors
**Problem**: `Cannot find module 'sqlite3'` or similar

**Solution**:
```bash
# Reinstall specific module
npm install sqlite3

# Or rebuild all modules
npm ci

# If still failing, try clearing and reinstalling
rm -rf node_modules package-lock.json
npm install
```

### Database Issues

#### 1. Database locked error
**Problem**: "Error: database is locked"

**Solution**:
```bash
# Kill all Electron processes
killall electron

# Wait a moment
sleep 2

# Remove problematic database
rm ~/Library/Application\ Support/Usage/usage-tracker.db*

# Restart app
npm start
```

#### 2. Can't find database files
**Problem**: No data being stored

**Solution**:
```bash
# Check if directory exists
ls ~/Library/Application\ Support/

# If not, create it
mkdir -p ~/Library/Application\ Support/Usage

# Restart app
npm start

# Verify creation
ls -la ~/Library/Application\ Support/Usage/
```

### Folder Protection Issues

#### 1. Permission denied when protecting
**Problem**: "Can't protect folder: Permission denied"

**Solution**:
```bash
# Check folder permissions
ls -la /path/to/folder

# Fix if needed
chmod 755 /path/to/folder

# Try protecting again
usage -p /path/to/folder -m password -c "password"

# If still failing, try with sudo
sudo usage -p /path/to/folder -m password -c "password"
```

#### 2. Can't access protected folder
**Problem**: "Access denied" when accessing protected folder

**Solution**:
```bash
# First, unprotect the folder
usage --unprotect /path/to/folder

# Check password
usage -p /path/to/folder -m password -c "THE-CORRECT-PASSWORD"

# If forgotten password:
# 1. Stop the app
# 2. Delete the database: rm ~/Library/Application\ Support/Usage/usage-security.db
# 3. Restart app
# 4. Re-protect with new password
```

#### 3. Folder permissions reset
**Problem**: Folder protection settings reset

**Solution**:
```bash
# Check database integrity
cd ~/Library/Application\ Support/Usage

# Try to query database (requires sqlite3 CLI)
sqlite3 usage-security.db "SELECT * FROM protected_paths;"

# If corrupted, rebuild:
rm usage-security.db
# Restart app to recreate
```

### UI Issues

#### 1. UI doesn't load
**Problem**: Black/white window, no content

**Solution**:
```bash
# Open DevTools in dev mode
npm run dev
# Press Cmd+Option+I

# Check console for errors
# Check if ui.html exists
ls -la src/ui.html

# Try restart
killall electron
npm start
```

#### 2. UI not updating
**Problem**: Stats don't refresh/show "Loading..."

**Solution**:
```bash
# Check if tracker is running
# In the app, wait 5+ seconds

# Still frozen? Restart
killall electron
npm start

# Check database permissions
chmod 644 ~/Library/Application\ Support/Usage/*.db
```

#### 3. Blank stats
**Problem**: "No app usage data yet"

**Solution**:
- This is normal on first launch!
- Use your Mac for a few minutes
- Stats will appear after ~30 seconds
- Wait 5 seconds for UI to refresh

### Development Issues

#### 1. Can't edit files
**Problem**: "Permission denied" when editing

**Solution**:
```bash
# Fix file permissions
chmod 644 src/*.js src/*.html

# If still failing, change ownership
sudo chown $USER src/
```

#### 2. DevTools won't open
**Problem**: DevTools doesn't appear with Cmd+Option+I

**Solution**:
```bash
# Must run in dev mode
npm run dev
# NOT npm start

# Try again with Cmd+Option+I
```

#### 3. Changes don't take effect
**Problem**: Code changes don't reflect in running app

**Solution**:
- Currently no hot reload
- Restart the app:
```bash
killall electron
npm start
```

### macOS-Specific Issues

#### 1. "Usage" not recognized as macOS app
**Problem**: Can't launch from Launchpad/Spotlight

**Solution**:
- Currently only available via CLI
- To use from Launchpad:
  1. Build package: `npm run package`
  2. Mount DMG file
  3. Drag Usage to Applications

#### 2. Camera permission denied (for face recognition)
**Problem**: Face recognition says "permission denied"

**Solution**:
1. System Preferences → Security & Privacy → Camera
2. Add Usage app to camera access list
3. Restart the app

#### 3. Folder becomes inaccessible
**Problem**: Protected folder won't open

**Solution**:
```bash
# Check folder permissions in Terminal
ls -la ~/path/to/folder

# Reset permissions
chmod 755 ~/path/to/folder

# Or restore from protection
usage --unprotect ~/path/to/folder
```

## Manual Verification Steps

### Verify Installation
```bash
bash verify.sh
```

### Verify Modules Installed
```bash
npm list --depth=0
```

### Verify Databases Created
```bash
ls -la ~/Library/Application\ Support/Usage/
```

### Verify CLI
```bash
chmod +x src/cli.js
./src/cli.js --help
```

### Verify Electron
```bash
npx electron --version
```

## Debug Mode

Enable debug logging:
```bash
DEBUG=* npm start
```

Or just for usage:
```bash
DEBUG=usage npm start
```

## Getting Help

If you're still stuck:

1. **Check error message** - Usually descriptive
2. **Check logs** - Look in ~/Library/Application Support/Usage/
3. **Read relevant docs** - README.md, DEVELOPMENT.md
4. **Restart everything** - Kill the app, clear cache, reinstall
5. **Open an issue** - Include error message and steps to reproduce

## Performance Issues

### App feels slow
```bash
# Monitor process
top -o %CPU -o %MEM | grep electron

# Check disk space
df -h

# Reduce UI refresh rate
Edit src/ui.html line with: refreshInterval = 10000 (was 5000)
```

### High memory usage
```bash
# Normal usage patterns:
# - Fresh start: ~150-200MB
# - After 1 hour: ~250-350MB
# - After restart clears memory

# If exceeding 500MB:
killall electron
npm start
```

## Still Need Help?

1. Verify setup with `bash verify.sh`
2. Check [README.md](README.md)
3. Read [DEVELOPMENT.md](DEVELOPMENT.md)
4. Look at [FACELOCK_GUIDE.md](FACELOCK_GUIDE.md) for face recognition
5. Open an issue with:
   - Error message
   - Steps to reproduce
   - System info (`uname -a`)
   - Node version (`node --version`)

---

**Good luck! 🍀**

Most issues are easily fixable with the solutions above.

If you find a new issue, document it and share!
