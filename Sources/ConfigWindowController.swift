import Cocoa
import ScreenSaver

struct CityData: Codable {
    let city: String
    let region: String
    let country: String
    let latitude: String
    let longitude: String
    let timezone: String
}

class ConfigWindowController: NSObject, NSComboBoxDelegate, NSComboBoxDataSource {
    var configureSheet: NSWindow?
    
    // UI Elements
    private let cityComboBox = NSComboBox()
    private let autoLocateBtn = NSButton()
    private let manualLatField = NSTextField()
    private let manualLonField = NSTextField()
    private let languagePopUp = NSPopUpButton()
    private let brightnessSlider = NSSlider()
    private let breathingSlider = NSSlider()
    private let breathingLabel = NSTextField()
    
    private let showCityCheck = NSButton(checkboxWithTitle: "Display Observer Location", target: nil, action: nil)
    private let showTimeCheck = NSButton(checkboxWithTitle: "Display Local Time", target: nil, action: nil)
    private let showCoordsCheck = NSButton(checkboxWithTitle: "Display Raw Coordinates", target: nil, action: nil)
    
    private var allCities: [CityData] = []
    private var filteredCities: [CityData] = []
    
    private let langMap: [(String, String)] = [
        ("English", "en"),
        ("简体中文", "zh-Hans"),
        ("繁体中文", "zh-Hant"),
        ("日本語", "ja")
    ]
    
    override init() {
        super.init()
        loadCities()
        setupWindow()
    }
    
    private func loadCities() {
        let bundle = Bundle(for: type(of: self))
        if let url = bundle.url(forResource: "cities", withExtension: "json", subdirectory: "Resources"),
           let data = try? Data(contentsOf: url),
           let cities = try? JSONDecoder().decode([CityData].self, from: data) {
            self.allCities = cities
            self.filteredCities = cities
        }
    }
    
    private func setupWindow() {
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 480, height: 570),
                              styleMask: [.titled],
                              backing: .buffered,
                              defer: false)
        window.title = "MyUniverse Settings"
        if #available(macOS 10.14, *) {
            window.appearance = NSAppearance(named: .vibrantDark)
        }
        
        let view = NSView(frame: window.contentView!.bounds)
        window.contentView = view
        
        // --- 1. OBSERVER VANTAGE ---
        createSectionTitle("OBSERVER VANTAGE", y: 520, view: view)
        
        createLabel(title: "Location:", y: 480, view: view)
        cityComboBox.frame = NSRect(x: 160, y: 480, width: 190, height: 24)
        cityComboBox.usesDataSource = true
        cityComboBox.dataSource = self
        cityComboBox.delegate = self
        cityComboBox.completes = true
        cityComboBox.stringValue = LocationManager.shared.selectedCity
        view.addSubview(cityComboBox)
        
        autoLocateBtn.title = "Auto Locate"
        autoLocateBtn.bezelStyle = .rounded
        autoLocateBtn.frame = NSRect(x: 350, y: 478, width: 100, height: 28)
        autoLocateBtn.target = self
        autoLocateBtn.action = #selector(autoLocateClicked)
        view.addSubview(autoLocateBtn)
        
        createLabel(title: "Lat / Lon:", y: 440, view: view)
        manualLatField.frame = NSRect(x: 160, y: 440, width: 90, height: 22)
        manualLatField.placeholderString = "Lat"
        manualLatField.stringValue = LocationManager.shared.manualLat
        view.addSubview(manualLatField)
        
        manualLonField.frame = NSRect(x: 260, y: 440, width: 90, height: 22)
        manualLonField.placeholderString = "Lon"
        manualLonField.stringValue = LocationManager.shared.manualLon
        view.addSubview(manualLonField)
        
        // --- 2. RHYTHM & FLOW ---
        createSectionTitle("RHYTHM & FLOW", y: 380, view: view)
        
        createLabel(title: "Breathing Cycle:", y: 340, view: view)
        breathingSlider.frame = NSRect(x: 160, y: 340, width: 190, height: 24)
        breathingSlider.minValue = 3.0
        breathingSlider.maxValue = 30.0
        breathingSlider.doubleValue = LocationManager.shared.breathingCycle
        breathingSlider.target = self
        breathingSlider.action = #selector(sliderChanged)
        view.addSubview(breathingSlider)
        
        breathingLabel.frame = NSRect(x: 355, y: 340, width: 60, height: 20)
        breathingLabel.isEditable = false
        breathingLabel.isBordered = false
        breathingLabel.drawsBackground = false
        if #available(macOS 10.10, *) {
            breathingLabel.textColor = .secondaryLabelColor
        }
        view.addSubview(breathingLabel)
        updateBreathingLabel()
        
        // --- 3. AESTHETICS ---
        createSectionTitle("AESTHETICS", y: 280, view: view)
        
        createLabel(title: "Language:", y: 240, view: view)
        languagePopUp.frame = NSRect(x: 160, y: 240, width: 200, height: 24)
        for map in langMap {
            languagePopUp.addItem(withTitle: map.0)
        }
        let currentLangCode = LocationManager.shared.language
        if let match = langMap.first(where: { $0.1 == currentLangCode }) {
            languagePopUp.selectItem(withTitle: match.0)
        }
        view.addSubview(languagePopUp)
        
        createLabel(title: "Luminance:", y: 200, view: view)
        brightnessSlider.frame = NSRect(x: 160, y: 200, width: 190, height: 24)
        brightnessSlider.minValue = 0.2
        brightnessSlider.maxValue = 1.0
        brightnessSlider.doubleValue = LocationManager.shared.fontBrightness
        view.addSubview(brightnessSlider)
        
        // --- 4. MINIMALISM ---
        createSectionTitle("MINIMALISM", y: 140, view: view)
        
        showCityCheck.frame = NSRect(x: 160, y: 105, width: 250, height: 22)
        showCityCheck.state = LocationManager.shared.showCity ? .on : .off
        view.addSubview(showCityCheck)
        
        showTimeCheck.frame = NSRect(x: 160, y: 80, width: 250, height: 22)
        showTimeCheck.state = LocationManager.shared.showTime ? .on : .off
        view.addSubview(showTimeCheck)
        
        showCoordsCheck.frame = NSRect(x: 160, y: 55, width: 250, height: 22)
        showCoordsCheck.state = LocationManager.shared.showCoordinates ? .on : .off
        view.addSubview(showCoordsCheck)
        
        // --- Buttons ---
        let cancelButton = NSButton(title: "Cancel", target: self, action: #selector(cancelClicked))
        cancelButton.frame = NSRect(x: 210, y: 15, width: 100, height: 32)
        cancelButton.bezelStyle = .rounded
        view.addSubview(cancelButton)
        
        let saveButton = NSButton(title: "Save & Apply", target: self, action: #selector(saveClicked))
        saveButton.frame = NSRect(x: 320, y: 15, width: 120, height: 32)
        saveButton.bezelStyle = .rounded
        saveButton.keyEquivalent = "\r"
        view.addSubview(saveButton)
        
        self.configureSheet = window
    }
    
    private func createSectionTitle(_ title: String, y: CGFloat, view: NSView) {
        let label = NSTextField(labelWithString: title)
        label.frame = NSRect(x: 30, y: y, width: 350, height: 20)
        label.font = NSFont.boldSystemFont(ofSize: 13)
        label.textColor = .white
        view.addSubview(label)
        
        let box = NSBox(frame: NSRect(x: 30, y: y - 5, width: 420, height: 1))
        box.boxType = .separator
        view.addSubview(box)
    }
    
    private func createLabel(title: String, y: CGFloat, view: NSView) {
        let label = NSTextField(labelWithString: title)
        label.frame = NSRect(x: 30, y: y, width: 120, height: 20)
        label.alignment = .right
        if #available(macOS 10.10, *) {
            label.textColor = .secondaryLabelColor
        }
        view.addSubview(label)
    }
    
    @objc private func sliderChanged() {
        updateBreathingLabel()
    }
    
    private func updateBreathingLabel() {
        let val = breathingSlider.doubleValue
        breathingLabel.stringValue = String(format: "%.1fs", val)
    }
    
    @objc private func autoLocateClicked() {
        autoLocateBtn.isEnabled = false
        autoLocateBtn.title = "Locating..."
        
        let url = URL(string: "https://ipwho.is/")!
        URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            DispatchQueue.main.async {
                guard let self = self else { return }
                self.autoLocateBtn.isEnabled = true
                self.autoLocateBtn.title = "Auto Locate"
                
                if let data = data,
                   let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
                   let success = json["success"] as? Bool, success == true,
                   let city = json["city"] as? String,
                   let lat = json["latitude"] as? Double,
                   let lon = json["longitude"] as? Double {
                    
                    self.cityComboBox.stringValue = city
                    self.manualLatField.stringValue = String(format: "%.4f", lat)
                    self.manualLonField.stringValue = String(format: "%.4f", lon)
                } else {
                    let alert = NSAlert()
                    alert.messageText = "Locate Failed"
                    alert.informativeText = "Could not fetch location from network."
                    alert.runModal()
                }
            }
        }.resume()
    }
    
    @objc private func cancelClicked() {
        if let window = configureSheet {
            window.sheetParent?.endSheet(window)
        }
    }
    
    @objc private func saveClicked() {
        let mgr = LocationManager.shared
        mgr.manualLat = manualLatField.stringValue
        mgr.manualLon = manualLonField.stringValue
        
        let selectedTitle = languagePopUp.titleOfSelectedItem ?? "English"
        if let match = langMap.first(where: { $0.0 == selectedTitle }) {
            mgr.language = match.1
        }
        
        mgr.fontBrightness = brightnessSlider.doubleValue
        mgr.breathingCycle = breathingSlider.doubleValue
        mgr.showCity = showCityCheck.state == .on
        mgr.showCoordinates = showCoordsCheck.state == .on
        mgr.showTime = showTimeCheck.state == .on
        
        // Extract selected city data
        let selectedName = cityComboBox.stringValue
        if let city = allCities.first(where: { $0.city == selectedName }) {
            mgr.selectedCity = city.city
            mgr.selectedRegion = city.region
            mgr.selectedCountry = city.country
            mgr.cityLatitude = city.latitude
            mgr.cityLongitude = city.longitude
            mgr.timezone = city.timezone
        } else {
            // User typed something unknown
            mgr.selectedCity = selectedName
        }
        
        if let window = configureSheet {
            window.sheetParent?.endSheet(window)
        }
    }
    
    // MARK: - NSComboBoxDataSource / Delegate
    func numberOfItems(in comboBox: NSComboBox) -> Int {
        return filteredCities.count
    }
    
    func comboBox(_ comboBox: NSComboBox, objectValueForItemAt index: Int) -> Any? {
        guard index < filteredCities.count else { return nil }
        return filteredCities[index].city
    }
    
    func comboBox(_ comboBox: NSComboBox, completedString string: String) -> String? {
        if let match = allCities.first(where: { $0.city.lowercased().hasPrefix(string.lowercased()) }) {
            return match.city
        }
        return nil
    }
    
    func controlTextDidChange(_ obj: Notification) {
        if let comboBox = obj.object as? NSComboBox {
            let search = comboBox.stringValue.lowercased()
            if search.isEmpty {
                filteredCities = allCities
            } else {
                filteredCities = allCities.filter { $0.city.lowercased().contains(search) || $0.country.lowercased().contains(search) }
            }
            comboBox.reloadData()
        }
    }
}
