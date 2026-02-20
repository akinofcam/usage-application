# Quick Start Guide - Usage App

Get up and running with the Usage app in just a few minutes! 🚀

## 1. Clone & Setup (2 minutes)

```bash
cd /path/to/usage-application
npm install
chmod +x install.sh
./install.sh
```

## 2. First Launch (1 minute)

```bash
usage
```

You should see:
```
📊 Starting
3
2
1
✨ Launching Usage...
```

Then the app window opens with today's statistics!

## 3. Monitor Your Usage (Real-time)

The app automatically tracks:
- ✓ Every app you switch to
- ✓ Time spent on each app
- ✓ Total switches today
- ✓ Pretty charts and stats

## 4. Protect Sensitive Folders (Optional)

**Protect a folder with a password:**
```bash
usage -p ~/Documents/Private -m password -c "my_secure_password"
```

Now if someone tries to access that folder, they'll need your password!

**Protect multiple folders:**
```bash
usage -p ~/Desktop/Work -m password -c "work_pass"
usage -p ~/Pictures -m password -c "photo_pass"
```

## 5. View All Protections

To see which folders are protected:
```bash
# This will be added in a future update
# For now, check the security database at:
# ~/Library/Application Support/Usage/usage-security.db
```

## 6. Unprotect a Folder

```bash
usage --unprotect ~/Documents/Private
```

## 7. Check Your Stats

The app runs continuously and updates stats every 5 seconds.

**View in Terminal:**
```bash
# Coming soon: CLI stats view
```

## Keyboard Shortcuts (In App)

- `Cmd + Q` - Quit the app
- `Cmd + W` - Close window
- `Cmd + Option + I` - Open Developer Tools (dev mode only)

## Troubleshooting

### App won't launch
```bash
# Check Node.js is installed
node --version

# Reinstall dependencies
rm -rf node_modules
npm install
```

### "usage" command not found
```bash
npm link
```

### Can't protect a folder
```bash
# Check folder exists
ls -la /path/to/folder

# Check permissions
chmod 755 /path/to/folder
usage -p /path/to/folder -m password -c "test"
```

## Tips & Tricks

**📊 Daily Reviews**
- Check your stats every evening
- Set goals for app usage
- Identify time-wasting apps

**🔒 Security**
- Use strong passwords (10+ characters)
- Different password for different folders
- Remember your passwords!

**🚀 Productivity**
- Focus on one task at a time
- Few app switches = deep work
- Track improvements over time

## Common Commands

```bash
# Launch the app
usage

# Get help
usage --help

# Protect a folder
usage -p ~/path -m password -c "password"

# Unprotect a folder  
usage --unprotect ~/path

# Check version
usage --version  # (coming soon)
```

## Next Steps

1. **Launch the app**: `usage`
2. **Observe your patterns** for a few days
3. **Protect important folders** once you understand permissions
4. **Set productivity goals** based on your data

## File Locations

If you need to access data directly:

- **App Usage Data**: `~/Library/Application Support/Usage/usage-tracker.db`
- **Protected Paths**: `~/Library/Application Support/Usage/usage-security.db`
- **App Config**: `~/.usagerc` (not yet implemented)

## Advanced Usage

### Command Line Options

```
usage --protect <path> --method <method> --credential <password>
usage -p <path> -m <method> -c <password>

Methods: password, facelock
```

### Environment Variables

```bash
DEBUG=1 usage                    # Run in debug mode
NODE_ENV=development usage       # Dev mode
USAGE_SKIP_TRACKING=1 usage     # Launch without tracking
```

## Getting Help

- 📘 Check README.md for full documentation
- 💡 See FACELOCK_GUIDE.md for face recognition setup
- 🐛 Report bugs on GitHub
- 💬 Open an issue with questions

## Video Tutorials (Coming Soon)

- Getting Started
- Protecting Folders
- Understanding Usage Stats
- Productivity Tips

---

**You're all set!** 🎉

Start tracking with: `usage`

Happy monitoring! 📊✨
