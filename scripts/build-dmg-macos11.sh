#!/bin/bash

# This script builds a DMG installer for macOS 11 and older
# Must be run on macOS. Run this after npm run package

set -e

echo "🔧 Building DMG for macOS 11 (and older)..."

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script must be run on macOS"
    exit 1
fi

# Create a temporary directory for the DMG structure
TEMP_DIR=$(mktemp -d)
MOUNT_POINT="$TEMP_DIR/mnt"
mkdir -p "$MOUNT_POINT"

# Source and destination
SOURCE_APP="dist/mac/Usage.app"
DMG_FILE="dist/usage_application-1.8.5_under12.dmg"

if [ ! -d "$SOURCE_APP" ]; then
    echo "❌ Source app not found: $SOURCE_APP"
    echo "Run 'npm run package' first"
    exit 1
fi

# Create a sparse image
hdiutil create -srcfolder dist/mac -volname "Usage 1.8.5" -fs HFS+ -fsargs "-c c=64,a=16,e=16" -format UDZO -o "$DMG_FILE"

echo "✅ DMG created: $DMG_FILE"
echo "📦 File size: $(ls -lh "$DMG_FILE" | awk '{print $5}')"

# Cleanup
rm -rf "$TEMP_DIR"

echo "✨ Done! The DMG is ready for distribution on macOS 11+"
