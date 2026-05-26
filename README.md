# My Universe Saver

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
