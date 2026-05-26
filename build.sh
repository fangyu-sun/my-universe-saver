#!/bin/bash
set -e

echo "🔨 正在编译 MyUniverse.saver..."
rm -rf MyUniverse.saver

# 编译 Swift 源文件为动态库
echo "🔨 正在为 x86_64 架构编译..."
swiftc -target x86_64-apple-macos11.0 -o MyUniverse_x86_64 -emit-library -Xlinker -bundle Sources/MyUniverseView.swift Sources/LocationManager.swift Sources/ConfigWindowController.swift -framework ScreenSaver -framework WebKit -framework CoreLocation -framework Cocoa

echo "🔨 正在为 arm64 架构编译..."
swiftc -target arm64-apple-macos11.0 -o MyUniverse_arm64 -emit-library -Xlinker -bundle Sources/MyUniverseView.swift Sources/LocationManager.swift Sources/ConfigWindowController.swift -framework ScreenSaver -framework WebKit -framework CoreLocation -framework Cocoa

echo "🧬 正在合成 Universal Binary..."
mkdir -p MyUniverse.saver/Contents/MacOS
lipo -create -output MyUniverse.saver/Contents/MacOS/MyUniverse MyUniverse_x86_64 MyUniverse_arm64
rm MyUniverse_x86_64 MyUniverse_arm64

echo "📦 正在打包 Resources 和 Info.plist..."
cp Info.plist MyUniverse.saver/Contents/
cp -R Resources MyUniverse.saver/Contents/

echo "🔐 正在进行代码签名..."
codesign --force --sign - MyUniverse.saver/Contents/MacOS/MyUniverse

# 更新时间戳，以便系统重新加载
touch MyUniverse.saver

echo "🧹 正在清理旧版本的安装缓存..."
rm -rf ~/Library/Screen\ Savers/MyUniverse.saver

echo "📥 正在安装新版本到本地..."
cp -R MyUniverse.saver ~/Library/Screen\ Savers/

echo "🔄 正在重启系统设置与清理内核缓存..."
killall "System Settings" 2>/dev/null || true
killall legacyScreenSaver 2>/dev/null || true
killall ScreenSaverEngine 2>/dev/null || true
killall WallpaperAgent 2>/dev/null || true
killall cfprefsd 2>/dev/null || true

# 清除 WebKit 缓存
rm -rf ~/Library/Containers/com.apple.ScreenSaver.Engine.legacyScreenSaver/Data/Library/Caches/* 2>/dev/null || true
rm -rf ~/Library/Containers/com.apple.ScreenSaver.Engine.legacyScreenSaver/Data/Library/WebKit/* 2>/dev/null || true
rm -rf ~/Library/Containers/com.apple.ScreenSaver.Engine.legacyScreenSaver/Data/Library/Saved\ Application\ State/* 2>/dev/null || true

echo "🚀 正在打开屏幕保护程序设置面板..."
open -b com.apple.systempreferences /System/Library/PreferencePanes/DesktopScreenEffectsPref.prefPane || true

echo "✅ 部署完成！请在系统设置中找到并预览 LocationSaver。"
