# My Universe Saver

> 在整体屏保设计上，应用采取了极简冷峻的科幻美学，去除了所有多余的UI元素，以纯黑背景、细体文字，营造出一种凝视深空的孤独感与冥想感；在显示逻辑上，以无缝淡入淡出的方式，通过后台离线星历引擎实时推算用户头顶 60° 范围内的天体，并以缓慢、克制的“10秒一次呼吸（淡出再淡入）”的动画循环，将冰冷的物理距离与诗意般的排版文字交替推送到屏幕正中央，让观察者在数字屏幕上体验宇宙光阴流逝的真实感。

A native macOS screen saver built with Swift and WKWebView.

## Architecture (MVP)

This project has been rebuilt from scratch with a zero-interaction, minimal MVP architecture to ensure native `.saver` stability and bypass Safari/macOS caching quirks.

- **Swift Native Layer (`Sources/`)**: 
  - `MyUniverseView.swift`: The `ScreenSaverView` subclass. It loads a non-persistent `WKWebView` and injects configuration data directly via `evaluateJavaScript`.
  - `ConfigWindowController.swift`: A native Cocoa sheet allowing users to manually input `City`, `Latitude`, and `Longitude`.
  - `LocationManager.swift`: A singleton that reads/writes to `ScreenSaverDefaults` using the identifier `com.fangyu.MyUniverse`.

- **Web Frontend (`Resources/`)**:
  - `index.html`, `style.css`, `main.js`: Plain Vanilla HTML/CSS/JS. No Node.js, no Vite, no bundlers.
  - Exposes `window.updateLocation(city, lat, lon)` which the Swift layer calls upon load.
  - Implements a zero-interaction UI: Immediately displays the cosmic broadcast information. No geolocation API calls or permission dialogs.

## Build and Install

To compile the Swift source files and bundle the HTML resources into a valid macOS `.saver` package, simply run:

```bash
chmod +x build.sh
./build.sh
```

This script will:
1. Compile Swift files for both `x86_64` and `arm64`.
2. Generate a Universal Binary.
3. Package the `Resources` and `Info.plist`.
4. Codesign the bundle.
5. Install the output `MyUniverse.saver` into `~/Library/Screen Savers/`.
6. Aggressively clear macOS caches (`cfprefsd`, `legacyScreenSaver`, WebKit Caches) to ensure the latest version displays correctly in System Settings.

## Usage
1. Open macOS **System Settings** -> **Screen Saver**.
2. Select **MyUniverse**.
3. Click **Options** to input your target city and coordinates.
4. Click **Preview** to view the live cosmic broadcast simulation.
