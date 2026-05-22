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
        
        let fontSize = (defaults?.string(forKey: "fontSize") ?? "Normal").lowercased()
        let brightness = (defaults?.string(forKey: "brightness") ?? "Normal").lowercased()
        let refreshRate = (defaults?.string(forKey: "refreshRate") ?? "Normal").lowercased()
        
        // Inject JS to forcefully bypass onboarding and inject fake GPS
        let js = """
        (function() {
            // Mock Location
            navigator.geolocation.getCurrentPosition = function(success, error) {
                success({ coords: { latitude: \(lat), longitude: \(lon), accuracy: 10 }, timestamp: Date.now() });
            };
            navigator.geolocation.watchPosition = function(success, error) {
                success({ coords: { latitude: \(lat), longitude: \(lon), accuracy: 10 }, timestamp: Date.now() });
                return 1;
            };
            
            let clicked = false;
            const tryStart = () => {
                if(clicked) return;
                
                const intro = document.getElementById('intro');
                if (intro && intro.classList.contains('active')) {
                    // Click specific language based on user preference
                    const langOpt = document.querySelector(`.lang-selector-inline .lang-inline-opt[data-lang="\(lang)"]`);
                    if (langOpt) { langOpt.click(); }
                    
                    // Click start button automatically
                    const startBtn = document.getElementById('start-btn');
                    if (startBtn) { 
                        startBtn.click(); 
                        clicked = true;
                        clearInterval(interval);
                    }
                }
            };
            const interval = setInterval(tryStart, 100);
            setTimeout(() => clearInterval(interval), 10000);
        })();
        """
        
        let userScript = WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        let contentController = WKUserContentController()
        contentController.addUserScript(userScript)
        
        let webConfiguration = WKWebViewConfiguration()
        webConfiguration.preferences.setValue(true, forKey: "developerExtrasEnabled")
        webConfiguration.userContentController = contentController
        
        let newWebView = WKWebView(frame: self.bounds, configuration: webConfiguration)
        newWebView.autoresizingMask = [.width, .height]
        newWebView.setValue(false, forKey: "drawsBackground")
        newWebView.navigationDelegate = self
        
        self.addSubview(newWebView)
        self.webView = newWebView
        
        var urlComponents = URLComponents(string: "https://my-star-project-ten.vercel.app/")!
        urlComponents.queryItems = [
            URLQueryItem(name: "mode", value: "screensaver"),
            URLQueryItem(name: "lat", value: lat),
            URLQueryItem(name: "lon", value: lon),
            URLQueryItem(name: "lang", value: lang),
            URLQueryItem(name: "fontSize", value: fontSize),
            URLQueryItem(name: "brightness", value: brightness),
            URLQueryItem(name: "refreshRate", value: refreshRate)
        ]
        
        if let url = urlComponents.url {
            let request = URLRequest(url: url)
            webView?.isHidden = false
            errorLabel?.isHidden = true
            webView?.load(request)
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
