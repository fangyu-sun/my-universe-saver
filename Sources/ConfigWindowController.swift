import Cocoa
import ScreenSaver

class ConfigWindowController: NSObject {
    var configureSheet: NSWindow?
    
    private let cityField = NSTextField()
    private let latField = NSTextField()
    private let lonField = NSTextField()
    
    override init() {
        super.init()
        setupWindow()
    }
    
    private func setupWindow() {
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 300, height: 200),
                              styleMask: [.titled],
                              backing: .buffered,
                              defer: false)
        window.title = "LocationSaver Options"
        
        let view = NSView(frame: window.contentView!.bounds)
        window.contentView = view
        
        // City Label & Field
        let cityLabel = NSTextField(labelWithString: "City:")
        cityLabel.frame = NSRect(x: 20, y: 150, width: 80, height: 20)
        view.addSubview(cityLabel)
        
        cityField.frame = NSRect(x: 100, y: 150, width: 180, height: 22)
        cityField.stringValue = LocationManager.shared.getCity()
        view.addSubview(cityField)
        
        // Latitude Label & Field
        let latLabel = NSTextField(labelWithString: "Latitude:")
        latLabel.frame = NSRect(x: 20, y: 110, width: 80, height: 20)
        view.addSubview(latLabel)
        
        latField.frame = NSRect(x: 100, y: 110, width: 180, height: 22)
        latField.stringValue = LocationManager.shared.getLatitude()
        view.addSubview(latField)
        
        // Longitude Label & Field
        let lonLabel = NSTextField(labelWithString: "Longitude:")
        lonLabel.frame = NSRect(x: 20, y: 70, width: 80, height: 20)
        view.addSubview(lonLabel)
        
        lonField.frame = NSRect(x: 100, y: 70, width: 180, height: 22)
        lonField.stringValue = LocationManager.shared.getLongitude()
        view.addSubview(lonField)
        
        // Save Button
        let saveButton = NSButton(title: "Save", target: self, action: #selector(saveClicked))
        saveButton.frame = NSRect(x: 100, y: 20, width: 100, height: 30)
        view.addSubview(saveButton)
        
        self.configureSheet = window
    }
    
    @objc private func saveClicked() {
        LocationManager.shared.saveLocation(city: cityField.stringValue,
                                            latitude: latField.stringValue,
                                            longitude: lonField.stringValue)
        
        if let window = configureSheet {
            window.sheetParent?.endSheet(window)
        }
    }
}
