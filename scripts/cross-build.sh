#!/usr/bin/env bash
# Cross-build helper for Usage app
# Builds app for macOS (zip), Linux (AppImage, deb), and Windows (exe, nsis)
set -euo pipefail

USAGE="Usage: $0 [mac|linux|win|all]"

if [[ $# -eq 0 ]]; then
  echo "$USAGE"
  exit 1
fi

TARGET="${1:-all}"

echo "=== Usage App Cross-Build ==="
echo "Target: $TARGET"
echo

case "$TARGET" in
  mac)
    echo "Building for macOS..."
    npx electron-builder --mac
    echo "✓ macOS package: dist/Usage-*.zip"
    ;;
  linux)
    echo "Building for Linux (AppImage + deb)..."
    npx electron-builder --linux
    echo "✓ Linux packages in dist/:"
    ls -lh dist/*.AppImage dist/*.deb 2>/dev/null || echo "  (Build may have failed)"
    ;;
  win)
    echo "Building for Windows (portable + nsis installer)..."
    echo "Note: Requires WINE or Windows environment for best results."
    npx electron-builder --win --publish=never || {
      echo "⚠ Windows build may require a Windows host or Wine toolchain."
      echo "  Consult: https://www.electron.build/multi-platform-build"
      exit 1
    }
    echo "✓ Windows packages in dist/:"
    ls -lh dist/*.exe 2>/dev/null || echo "  (Build may have failed)"
    ;;
  all)
    echo "Building for all platforms..."
    $0 mac
    echo
    $0 linux
    echo
    $0 win || echo "⚠ Windows build skipped (requires special setup)"
    echo
    echo "=== All builds complete ==="
    ls -lh dist/
    ;;
  *)
    echo "$USAGE" >&2
    exit 1
    ;;
esac
