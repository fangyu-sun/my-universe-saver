import Cocoa
import CoreLocation
import ScreenSaver

class ConfigureSheetController: NSObject {

    private var window: NSPanel!

    private var latField: NSTextField!
    private var lonField: NSTextField!
    private var langPopup: NSPopUpButton!
    private var fontSizePopup: NSPopUpButton!
    private var brightnessPopup: NSPopUpButton!
    private var refreshPopup: NSPopUpButton!
    
    private let defaults = ScreenSaverDefaults(forModuleWithName: "com.fangyu.MyUniverse")

    override init() {
        super.init()
        setupWindow()
        loadDefaults()
    }

    var configureSheet: NSWindow {
        return window
    }

    private func setupWindow() {
        let panelRect = NSRect(x: 0, y: 0, width: 500, height: 350)
        window = NSPanel(contentRect: panelRect, styleMask: [.titled], backing: .buffered, defer: false)
        window.title = "My Universe Settings"

        let stackView = NSStackView()
        stackView.orientation = .vertical
        stackView.alignment = .centerX
        stackView.spacing = 15
        stackView.edgeInsets = NSEdgeInsets(top: 20, left: 20, bottom: 20, right: 20)
        window.contentView = stackView

        // Location Section
        let locStack = NSStackView()
        locStack.orientation = .horizontal
        
        latField = NSTextField(string: "")
        latField.placeholderString = "Latitude"
        latField.widthAnchor.constraint(equalToConstant: 80).isActive = true
        
        lonField = NSTextField(string: "")
        lonField.placeholderString = "Longitude"
        lonField.widthAnchor.constraint(equalToConstant: 80).isActive = true
        
        let fetchBtn = NSButton(title: "Fetch Current Location", target: self, action: #selector(fetchLocation))
        
        locStack.addArrangedSubview(NSTextField(labelWithString: "Location:"))
        locStack.addArrangedSubview(latField)
        locStack.addArrangedSubview(lonField)
        locStack.addArrangedSubview(fetchBtn)
        stackView.addArrangedSubview(locStack)

        // Language Section
        let langStack = NSStackView()
        langPopup = NSPopUpButton(title: "", target: nil, action: nil)
        langPopup.addItems(withTitles: ["English", "中文", "日本語"])
        langStack.addArrangedSubview(NSTextField(labelWithString: "Language:"))
        langStack.addArrangedSubview(langPopup)
        stackView.addArrangedSubview(langStack)

        // Font Size
        let fontStack = NSStackView()
        fontSizePopup = NSPopUpButton(title: "", target: nil, action: nil)
        fontSizePopup.addItems(withTitles: ["Small", "Normal", "Large"])
        fontStack.addArrangedSubview(NSTextField(labelWithString: "Font Size:"))
        fontStack.addArrangedSubview(fontSizePopup)
        stackView.addArrangedSubview(fontStack)

        // Brightness
        let brightStack = NSStackView()
        brightnessPopup = NSPopUpButton(title: "", target: nil, action: nil)
        brightnessPopup.addItems(withTitles: ["Low", "Normal", "High"])
        brightStack.addArrangedSubview(NSTextField(labelWithString: "Brightness:"))
        brightStack.addArrangedSubview(brightnessPopup)
        stackView.addArrangedSubview(brightStack)

        // Refresh Rate
        let refreshStack = NSStackView()
        refreshPopup = NSPopUpButton(title: "", target: nil, action: nil)
        refreshPopup.addItems(withTitles: ["Low", "Normal", "High"])
        refreshStack.addArrangedSubview(NSTextField(labelWithString: "Refresh Rate:"))
        refreshStack.addArrangedSubview(refreshPopup)
        stackView.addArrangedSubview(refreshStack)

        // Buttons
        let btnStack = NSStackView()
        let saveBtn = NSButton(title: "Save", target: self, action: #selector(save))
        let cancelBtn = NSButton(title: "Cancel", target: self, action: #selector(cancel))
        btnStack.addArrangedSubview(cancelBtn)
        btnStack.addArrangedSubview(saveBtn)
        stackView.addArrangedSubview(btnStack)
    }

    private func loadDefaults() {
        guard let defaults = defaults else { return }
        
        if let lat = defaults.string(forKey: "latitude"), !lat.isEmpty { latField.stringValue = lat }
        if let lon = defaults.string(forKey: "longitude"), !lon.isEmpty { lonField.stringValue = lon }
        
        if let lang = defaults.string(forKey: "language") { langPopup.selectItem(withTitle: lang) }
        else { langPopup.selectItem(withTitle: "English") }
        
        if let size = defaults.string(forKey: "fontSize") { fontSizePopup.selectItem(withTitle: size) }
        else { fontSizePopup.selectItem(withTitle: "Normal") }
        
        if let bright = defaults.string(forKey: "brightness") { brightnessPopup.selectItem(withTitle: bright) }
        else { brightnessPopup.selectItem(withTitle: "Normal") }
        
        if let refresh = defaults.string(forKey: "refreshRate") { refreshPopup.selectItem(withTitle: refresh) }
        else { refreshPopup.selectItem(withTitle: "Normal") }
    }

    @objc private func fetchLocation() {
        guard let url = URL(string: "https://api.bigdatacloud.net/data/reverse-geocode-client") else { return }
        
        let task = URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            guard let self = self, let data = data, error == nil else {
                print("Location fetch error: \(String(describing: error))")
                return
            }
            
            do {
                if let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
                   let lat = json["latitude"] as? Double,
                   let lon = json["longitude"] as? Double {
                    DispatchQueue.main.async {
                        self.latField.stringValue = String(format: "%.4f", lat)
                        self.lonField.stringValue = String(format: "%.4f", lon)
                    }
                }
            } catch {
                print("JSON parse error: \(error)")
            }
        }
        task.resume()
    }

    @objc private func save() {
        if let defaults = defaults {
            defaults.set(latField.stringValue, forKey: "latitude")
            defaults.set(lonField.stringValue, forKey: "longitude")
            defaults.set(langPopup.titleOfSelectedItem, forKey: "language")
            defaults.set(fontSizePopup.titleOfSelectedItem, forKey: "fontSize")
            defaults.set(brightnessPopup.titleOfSelectedItem, forKey: "brightness")
            defaults.set(refreshPopup.titleOfSelectedItem, forKey: "refreshRate")
            defaults.synchronize()
        }
        window.sheetParent?.endSheet(window)
    }

    @objc private func cancel() {
        window.sheetParent?.endSheet(window)
    }
}
