import ScreenSaver
import WebKit

@objc(MyUniverseView)
class MyUniverseView: ScreenSaverView, WKNavigationDelegate {

    private var webView: WKWebView?
    private var errorLabel: NSTextField?
    
    private var sheetController: ConfigureSheetController?
    private let defaults = ScreenSaverDefaults(forModuleWithName: "com.fangyu.MyUniverse")

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
        
        let label = NSTextField(labelWithString: "COSMIC SIGNAL LOST")
        label.textColor = NSColor.white
        label.font = NSFont.systemFont(ofSize: 24, weight: .bold)
        label.alignment = .center
        label.isEditable = false
        label.isBezeled = false
        label.drawsBackground = false
        label.isHidden = true
        label.translatesAutoresizingMaskIntoConstraints = false
        label.maximumNumberOfLines = 0
        
        self.addSubview(label)
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: self.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: self.centerYAnchor)
        ])
        self.errorLabel = label
    }

    override func startAnimation() {
        super.startAnimation()
        
        webView?.removeFromSuperview()
        webView = nil
        
        guard let lat = defaults?.string(forKey: "latitude"), !lat.isEmpty,
              let lon = defaults?.string(forKey: "longitude"), !lon.isEmpty else {
            showFallbackMessage("LOCATION NOT SET\nOpen Screen Saver Options to configure location.")
            return
        }
        
        let rawLang = defaults?.string(forKey: "language") ?? "English"
        let lang: String
        switch rawLang {
        case "中文": lang = "zh"
        case "日本語": lang = "ja"
        default: lang = "en"
        }
        
        let city = defaults?.string(forKey: "city") ?? "Saved Location"
        let fontSize = (defaults?.string(forKey: "fontSize") ?? "Normal").lowercased()
        let brightness = (defaults?.string(forKey: "brightness") ?? "Normal").lowercased()
        let refreshRate = (defaults?.string(forKey: "refreshRate") ?? "Normal").lowercased()
        
        let webConfiguration = WKWebViewConfiguration()
        webConfiguration.preferences.setValue(true, forKey: "developerExtrasEnabled")
        // Force non-persistent data store to prevent macOS from caching old index.html
        webConfiguration.websiteDataStore = WKWebsiteDataStore.nonPersistent()
        
        let userContentController = WKUserContentController()
        let scriptSource = """
        window.zenithSettings = {
            mode: 'screensaver',
            lat: '\(lat)',
            lon: '\(lon)',
            city: '\(city)',
            lang: '\(lang)',
            fontSize: '\(fontSize)',
            brightness: '\(brightness)',
            refreshRate: '\(refreshRate)'
        };
        """
        let userScript = WKUserScript(source: scriptSource, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        userContentController.addUserScript(userScript)
        webConfiguration.userContentController = userContentController
        
        let newWebView = WKWebView(frame: self.bounds, configuration: webConfiguration)
        newWebView.autoresizingMask = [.width, .height]
        newWebView.setValue(false, forKey: "drawsBackground")
        newWebView.navigationDelegate = self
        
        self.addSubview(newWebView)
        self.webView = newWebView
        
        if let htmlURL = Bundle(for: MyUniverseView.self).url(forResource: "index", withExtension: "html", subdirectory: "dist") {
            webView?.isHidden = false
            errorLabel?.isHidden = true
            newWebView.loadFileURL(htmlURL, allowingReadAccessTo: htmlURL.deletingLastPathComponent())
        } else {
            showFallbackMessage("MISSING LOCAL RESOURCES")
        }
    }

    override func stopAnimation() {
        super.stopAnimation()
        webView?.stopLoading()
        webView?.removeFromSuperview()
        webView = nil
    }

    override func draw(_ rect: NSRect) {
        super.draw(rect)
        NSColor.black.set()
        rect.fill()
    }

    override func animateOneFrame() {
    }

    override var hasConfigureSheet: Bool {
        return true
    }

    override var configureSheet: NSWindow? {
        if sheetController == nil {
            sheetController = ConfigureSheetController()
        }
        return sheetController?.configureSheet
    }
    
    override func hitTest(_ point: NSPoint) -> NSView? {
        return nil
    }

    // MARK: - WKNavigationDelegate
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        showFallbackMessage("COSMIC SIGNAL LOST")
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        showFallbackMessage("COSMIC SIGNAL LOST")
    }
    
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if navigationAction.navigationType == .linkActivated {
            decisionHandler(.cancel)
        } else {
            decisionHandler(.allow)
        }
    }
    
    private func showFallbackMessage(_ message: String) {
        webView?.isHidden = true
        errorLabel?.stringValue = message
        errorLabel?.isHidden = false
    }
}
