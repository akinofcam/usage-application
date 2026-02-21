#!/bin/bash

# Create DMG installer for macOS 11 (and older)
# This script must be run on macOS

set -e

echo "🔧 Building DMG installer for macOS 11..."

# Check if on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script requires macOS"
    echo "   Current OS: $(uname -s)"
    exit 1
fi

# Paths
APP_BUNDLE="dist/mac/Usage.app"
DMG_OUTPUT="dist/usage_application-1.8.5_under12.dmg"

# Check if app bundle exists
if [ ! -d "$APP_BUNDLE" ]; then
    echo "❌ App bundle not found: $APP_BUNDLE"
    echo "   First run: npm run package"
    exit 1
fi

# Remove old DMG if exists
if [ -f "$DMG_OUTPUT" ]; then
    rm "$DMG_OUTPUT"
    echo "🗑️  Removed old DMG"
fi

# Create temporary volume directory
TEMP_DMG_DIR=$(mktemp -d)
cp -r "$APP_BUNDLE" "$TEMP_DMG_DIR/"

# Create symbolic link to Applications
ln -s /Applications "$TEMP_DMG_DIR/Applications"

# Create DMG
hdiutil create -volname "Usage 1.8.5" \
    -srcfolder "$TEMP_DMG_DIR" \
    -ov -format UDZO \
    "$DMG_OUTPUT"

# Cleanup
rm -rf "$TEMP_DMG_DIR"

echo "✅ DMG created successfully!"
echo "📦 File: $DMG_OUTPUT"
ls -lh "$DMG_OUTPUT"
echo ""
echo "🎉 Ready for distribution on macOS 11 and earlier!"
