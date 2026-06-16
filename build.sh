#!/bin/bash
set -euo pipefail

APP_NAME="Klipski"
BUNDLE_ID="com.klipski.app"
VERSION="1.0.0"
APP="$APP_NAME.app"
DEST="/Applications/$APP"

echo "▶ Compilo $APP_NAME in release..."
swift build -c release

BIN=".build/release/$APP_NAME"
if [ ! -f "$BIN" ]; then
    echo "✗ Binario non trovato in $BIN" >&2
    exit 1
fi

echo "▶ Assemblo il bundle $APP..."
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$BIN" "$APP/Contents/MacOS/$APP_NAME"

if [ -f "Resources/$APP_NAME.icns" ]; then
    cp "Resources/$APP_NAME.icns" "$APP/Contents/Resources/$APP_NAME.icns"
fi

cat > "$APP/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundleDisplayName</key>
    <string>$APP_NAME</string>
    <key>CFBundleExecutable</key>
    <string>$APP_NAME</string>
    <key>CFBundleIdentifier</key>
    <string>$BUNDLE_ID</string>
    <key>CFBundleVersion</key>
    <string>$VERSION</string>
    <key>CFBundleShortVersionString</key>
    <string>$VERSION</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleIconFile</key>
    <string>$APP_NAME</string>
    <key>LSMinimumSystemVersion</key>
    <string>14.0</string>
    <key>LSUIElement</key>
    <true/>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
    <key>NSHumanReadableCopyright</key>
    <string>Klipski</string>
</dict>
</plist>
EOF

echo "▶ Firma ad-hoc..."
codesign --force --deep --sign - "$APP"

echo "▶ Installo in /Applications..."
if [ -d "$DEST" ]; then
    # Chiudo eventuale istanza in esecuzione
    pkill -x "$APP_NAME" 2>/dev/null || true
    sleep 1
    rm -rf "$DEST"
fi
cp -R "$APP" /Applications/

echo "▶ Avvio $APP_NAME..."
open "$DEST"

echo "✓ Fatto! $APP_NAME è installata in /Applications e in esecuzione (icona nella barra di stato)."
