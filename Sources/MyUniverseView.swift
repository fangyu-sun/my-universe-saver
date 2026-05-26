import ScreenSaver
import WebKit

@objc(MyUniverseView)
class MyUniverseView: ScreenSaverView {
    
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
        
        // Inject JS config at document start
        let configDict = LocationManager.shared.getJSConfig()
        if let jsonData = try? JSONSerialization.data(withJSONObject: configDict, options: []),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            let scriptSource = "window.initialConfig = \(jsonString);"
            let userScript = WKUserScript(source: scriptSource, injectionTime: .atDocumentStart, forMainFrameOnly: true)
            webConfiguration.userContentController.addUserScript(userScript)
        }
        
        let newWebView = WKWebView(frame: self.bounds, configuration: webConfiguration)
        newWebView.autoresizingMask = [.width, .height]
        newWebView.setValue(false, forKey: "drawsBackground")
        
        self.addSubview(newWebView)
        self.webView = newWebView
        
        let bundle = Bundle(for: MyUniverseView.self)
        if let htmlURL = bundle.url(forResource: "index", withExtension: "html") {
            NSLog("MyUniverse: Found HTML at \(htmlURL)")
            newWebView.loadFileURL(htmlURL, allowingReadAccessTo: htmlURL.deletingLastPathComponent())
        } else {
            NSLog("MyUniverse ERROR: Cannot find index.html in bundle!")
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
