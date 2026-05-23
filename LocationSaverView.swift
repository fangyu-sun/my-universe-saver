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
        
        let webConfiguration = WKWebViewConfiguration()
        webConfiguration.preferences.setValue(true, forKey: "developerExtrasEnabled")
        webConfiguration.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        webConfiguration.setValue(true, forKey: "allowUniversalAccessFromFileURLs")
        webConfiguration.websiteDataStore = WKWebsiteDataStore.nonPersistent()
        
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
    
    // MARK: - WKNavigationDelegate
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        let city = LocationManager.shared.getCity()
        let lat = LocationManager.shared.getLatitude()
        let lon = LocationManager.shared.getLongitude()
        
        // Use JSONSerialization to safely escape strings for JS
        let dict: [String: String] = ["city": city, "lat": lat, "lon": lon]
        if let jsonData = try? JSONSerialization.data(withJSONObject: dict, options: []),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            let script = "if (window.updateLocation) { var data = \(jsonString); window.updateLocation(data.city, data.lat, data.lon); }"
            webView.evaluateJavaScript(script) { (result, error) in
                if let error = error {
                    print("JS Error: \(error)")
                }
            }
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
