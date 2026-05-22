#!/bin/bash
set -e

echo "📦 正在自动保存代码到 Git (工作范式)..."
# 自动添加跟踪的文件
git add .gitignore Sources/ Info.plist project.yml deploy.sh
# 检查是否有需要提交的修改
if git diff-index --quiet HEAD --; then
    echo "✔️ 没有需要提交的更改。"
else
    git commit -m "自动部署提交: 更新屏保代码与工作范式"
    echo "✔️ 代码已提交。"
fi

echo "🔨 正在编译 MyUniverse.saver..."
rm -rf MyUniverse.saver/Contents/MacOS/MyUniverse
swiftc -o MyUniverse.saver/Contents/MacOS/MyUniverse -emit-library -Xlinker -bundle Sources/MyUniverseView.swift Sources/ConfigureSheetController.swift -framework ScreenSaver -framework WebKit -framework CoreLocation -framework Cocoa

# 更新外层 Bundle 的时间戳，以便 Finder 和系统设置能正确识别到修改时间
touch MyUniverse.saver

echo "🧹 正在清理旧版本的安装缓存..."
rm -rf ~/Library/Screen\ Savers/MyUniverse.saver

echo "📥 正在安装新版本到本地..."
cp -R MyUniverse.saver ~/Library/Screen\ Savers/

echo "🔄 正在重启系统设置以清除 UI 缓存..."
killall "System Settings" 2>/dev/null || true

echo "🚀 正在打开屏幕保护程序设置面板..."
# 打开 macOS Sonoma 屏幕保护程序设置选项卡
open "x-apple.systempreferences:com.apple.ScreenSaver-Settings.extension"

echo "✅ 部署完成！请在系统设置中预览最新的屏幕保护程序。"
