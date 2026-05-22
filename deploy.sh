#!/bin/bash
set -e

echo "🔨 Building MyUniverse.saver..."
rm -rf MyUniverse.saver/Contents/MacOS/MyUniverse
swiftc -o MyUniverse.saver/Contents/MacOS/MyUniverse -emit-library -Xlinker -bundle Sources/MyUniverseView.swift Sources/ConfigureSheetController.swift -framework ScreenSaver -framework WebKit -framework CoreLocation -framework Cocoa

echo "🧹 Clearing old installation..."
rm -rf ~/Library/Screen\ Savers/MyUniverse.saver

echo "📦 Installing new version..."
cp -R MyUniverse.saver ~/Library/Screen\ Savers/

echo "🔄 Restarting System Settings..."
killall "System Settings" 2>/dev/null || true

echo "🚀 Opening Screen Saver Settings..."
# Open macOS Sonoma screen saver preference pane
open "x-apple.systempreferences:com.apple.ScreenSaver-Settings.extension"

echo "✅ Done! You can now preview the screen saver."
