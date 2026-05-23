import ScreenSaver
import WebKit

@objc(LocationSaverView)
class LocationSaverView: ScreenSaverView, WKNavigationDelegate {
    
    private var webView: WKWebView?
    private var sheetController: ConfigWindowController?
    
    override init?(frame: NSRect, isPreview: Bool) {
        super.init(frame: frame, isPreview: isPreview)
        setup()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }
    
    private func setup() {
        self.wantsLayer = true
        self.layer?.backgroundColor = NSColor.black.cgColor
    }
    
    override func startAnimation() {
        super.startAnimation()
        
        let city = LocationManager.shared.getCity()
        let lat = LocationManager.shared.getLatitude()
        let lon = LocationManager.shared.getLongitude()
        
        let webConfiguration = WKWebViewConfiguration()
        webConfiguration.preferences.setValue(true, forKey: "developerExtrasEnabled")
        webConfiguration.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        webConfiguration.setValue(true, forKey: "allowUniversalAccessFromFileURLs")
        webConfiguration.websiteDataStore = WKWebsiteDataStore.nonPersistent()
        
        let settingsDict: [String: Any] = [
            "city": city,
            "lat": lat,
            "lon": lon
        ]
        
        var scriptSource = "window.saverConfig = {};"
        if let jsonData = try? JSONSerialization.data(withJSONObject: settingsDict, options: []),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            scriptSource = "window.saverConfig = \(jsonString);"
        }
        
        let userContentController = WKUserContentController()
        let userScript = WKUserScript(source: scriptSource, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        userContentController.addUserScript(userScript)
        webConfiguration.userContentController = userContentController
        
        let newWebView = WKWebView(frame: self.bounds, configuration: webConfiguration)
        newWebView.autoresizingMask = [.width, .height]
        newWebView.setValue(false, forKey: "drawsBackground")
        newWebView.navigationDelegate = self
        
        self.addSubview(newWebView)
        self.webView = newWebView
        
        if let htmlURL = Bundle(for: LocationSaverView.self).url(forResource: "index", withExtension: "html", subdirectory: "Resources") {
            newWebView.loadFileURL(htmlURL, allowingReadAccessTo: htmlURL.deletingLastPathComponent())
        }
    }
    
    override func stopAnimation() {
        super.stopAnimation()
        webView?.stopLoading()
        webView?.removeFromSuperview()
        webView = nil
    }
    
    override var hasConfigureSheet: Bool {
        return true
    }
    
    override var configureSheet: NSWindow? {
        if sheetController == nil {
            sheetController = ConfigWindowController()
        }
        return sheetController?.configureSheet
    }
}
