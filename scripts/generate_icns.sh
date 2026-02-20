#!/usr/bin/env bash
# Generates a macOS .icns file from `assets/icon.png`.
# On macOS: uses `sips` and `iconutil`. On other hosts: creates placeholder by copying PNG.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_ICON="$ROOT_DIR/assets/icon.png"
ICONSET_DIR="$ROOT_DIR/build/AppIcon.iconset"
OUT_ICNS="$ROOT_DIR/assets/icon.icns"

if [[ ! -f "$SRC_ICON" ]]; then
  echo "Source icon not found: $SRC_ICON" >&2
  exit 3
fi

if [[ "$(uname)" != "Darwin" ]]; then
  echo "Non-macOS host detected; creating placeholder assets/icon.icns by copying PNG." >&2
  cp "$SRC_ICON" "$OUT_ICNS"
  echo "Wrote placeholder: $OUT_ICNS" >&2
  exit 0
fi

rm -rf "$ICONSET_DIR"
mkdir -p "$ICONSET_DIR"

# sizes required by iconutil (1x and 2x)
sizes=(16 32 64 128 256 512)
for s in "${sizes[@]}"; do
  out1="$ICONSET_DIR/icon_${s}x${s}.png"
  out2="$ICONSET_DIR/icon_${s}x${s}@2x.png"
  sips -z $s $s "$SRC_ICON" --out "$out1" >/dev/null
  sips -z $((s*2)) $((s*2)) "$SRC_ICON" --out "$out2" >/dev/null
done

echo "Building $OUT_ICNS..."
iconutil -c icns "$ICONSET_DIR" -o "$OUT_ICNS"
echo "Created: $OUT_ICNS"

rm -rf "$ICONSET_DIR"

exit 0
