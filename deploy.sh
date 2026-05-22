#!/bin/bash
set -e

echo "📦 正在自动保存代码到 Git (工作范式)..."
# 自动添加跟踪的文件
git add .gitignore Sources/ Info.plist project.yml deploy.sh src/ index.html
# 检查是否有需要提交的修改
if git diff-index --quiet HEAD --; then
    echo "✔️ 没有需要提交的更改。"
else
    git commit -m "自动部署提交: 更新屏保代码与工作范式"
    echo "✔️ 代码已提交。"
fi

echo "🔨 正在构建前端 Web 应用..."
npm install
npm run build
cp cities.json dist/cities.json

echo "🔨 正在编译 MyUniverse.saver..."
rm -rf MyUniverse.saver/Contents/MacOS/MyUniverse
echo "🔨 正在为 x86_64 架构编译..."
swiftc -target x86_64-apple-macos11.0 -o MyUniverse_x86_64 -emit-library -Xlinker -bundle Sources/MyUniverseView.swift Sources/ConfigureSheetController.swift -framework ScreenSaver -framework WebKit -framework CoreLocation -framework Cocoa
echo "🔨 正在为 arm64 架构编译..."
swiftc -target arm64-apple-macos11.0 -o MyUniverse_arm64 -emit-library -Xlinker -bundle Sources/MyUniverseView.swift Sources/ConfigureSheetController.swift -framework ScreenSaver -framework WebKit -framework CoreLocation -framework Cocoa
echo "🧬 正在合成 Universal Binary..."
lipo -create -output MyUniverse.saver/Contents/MacOS/MyUniverse MyUniverse_x86_64 MyUniverse_arm64
rm MyUniverse_x86_64 MyUniverse_arm64

echo "🔐 正在进行代码签名..."
codesign --force --sign - MyUniverse.saver/Contents/MacOS/MyUniverse

echo "📦 正在将本地前端构建产物打包进入 Screen Saver..."
mkdir -p MyUniverse.saver/Contents/Resources
cp -R dist MyUniverse.saver/Contents/Resources/

# 更新外层 Bundle 的时间戳，以便 Finder 和系统设置能正确识别到修改时间
touch MyUniverse.saver

echo "🧹 正在清理旧版本的安装缓存..."
rm -rf ~/Library/Screen\ Savers/MyUniverse.saver

echo "📥 正在安装新版本到本地..."
cp -R MyUniverse.saver ~/Library/Screen\ Savers/

echo "🔄 正在重启系统设置与清理内核缓存..."
killall "System Settings" 2>/dev/null || true
killall legacyScreenSaver 2>/dev/null || true
killall ScreenSaverEngine 2>/dev/null || true

# 彻底清除 WKWebView 磁盘缓存，防止它加载旧版的 index.html
rm -rf ~/Library/Containers/com.apple.ScreenSaver.Engine.legacyScreenSaver/Data/Library/Caches/* 2>/dev/null || true
rm -rf ~/Library/Containers/com.apple.ScreenSaver.Engine.legacyScreenSaver/Data/Library/WebKit/* 2>/dev/null || true
echo "🚀 正在打开屏幕保护程序设置面板..."
# 打开 macOS Sonoma 屏幕保护程序设置选项卡
open -b com.apple.systempreferences /System/Library/PreferencePanes/DesktopScreenEffectsPref.prefPane || true

echo "✅ 部署完成！请在系统设置中预览最新的屏幕保护程序。"
