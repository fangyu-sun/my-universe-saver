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
    private let manualLatField = NSTextField()
    private let manualLonField = NSTextField()
    private let languagePopUp = NSPopUpButton()
    private let brightnessSlider = NSSlider()
    private let frequencyPopUp = NSPopUpButton()
    private let showCityCheck = NSButton(checkboxWithTitle: "Show City", target: nil, action: nil)
    private let showCoordsCheck = NSButton(checkboxWithTitle: "Show Coordinates", target: nil, action: nil)
    private let showTimeCheck = NSButton(checkboxWithTitle: "Show Time", target: nil, action: nil)
    
    private var allCities: [CityData] = []
    private var filteredCities: [CityData] = []
    
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
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 400, height: 450),
                              styleMask: [.titled],
                              backing: .buffered,
                              defer: false)
        window.title = "MyUniverse Options"
        
        let view = NSView(frame: window.contentView!.bounds)
        window.contentView = view
        
        // --- City Search ---
        createLabel(title: "City Search:", y: 400, view: view)
        cityComboBox.frame = NSRect(x: 130, y: 400, width: 230, height: 24)
        cityComboBox.usesDataSource = true
        cityComboBox.dataSource = self
        cityComboBox.delegate = self
        cityComboBox.completes = true
        cityComboBox.stringValue = LocationManager.shared.selectedCity
        view.addSubview(cityComboBox)
        
        // --- Manual Coordinates ---
        createLabel(title: "Manual Lat:", y: 360, view: view)
        manualLatField.frame = NSRect(x: 130, y: 360, width: 100, height: 22)
        manualLatField.stringValue = LocationManager.shared.manualLat
        view.addSubview(manualLatField)
        
        createLabel(title: "Manual Lon:", y: 320, view: view)
        manualLonField.frame = NSRect(x: 130, y: 320, width: 100, height: 22)
        manualLonField.stringValue = LocationManager.shared.manualLon
        view.addSubview(manualLonField)
        
        // --- Visual Settings ---
        createLabel(title: "Language:", y: 280, view: view)
        languagePopUp.frame = NSRect(x: 130, y: 280, width: 150, height: 24)
        languagePopUp.addItems(withTitles: ["en", "zh-Hans", "zh-Hant", "ja"])
        languagePopUp.selectItem(withTitle: LocationManager.shared.language)
        view.addSubview(languagePopUp)
        
        createLabel(title: "Brightness:", y: 240, view: view)
        brightnessSlider.frame = NSRect(x: 130, y: 240, width: 150, height: 24)
        brightnessSlider.minValue = 0.2
        brightnessSlider.maxValue = 1.0
        brightnessSlider.doubleValue = LocationManager.shared.fontBrightness
        view.addSubview(brightnessSlider)
        
        createLabel(title: "Frequency:", y: 200, view: view)
        frequencyPopUp.frame = NSRect(x: 130, y: 200, width: 150, height: 24)
        frequencyPopUp.addItems(withTitles: ["slow", "normal", "fast"])
        frequencyPopUp.selectItem(withTitle: LocationManager.shared.displayFrequency)
        view.addSubview(frequencyPopUp)
        
        // --- Toggles ---
        showCityCheck.frame = NSRect(x: 130, y: 160, width: 150, height: 22)
        showCityCheck.state = LocationManager.shared.showCity ? .on : .off
        view.addSubview(showCityCheck)
        
        showCoordsCheck.frame = NSRect(x: 130, y: 130, width: 150, height: 22)
        showCoordsCheck.state = LocationManager.shared.showCoordinates ? .on : .off
        view.addSubview(showCoordsCheck)
        
        showTimeCheck.frame = NSRect(x: 130, y: 100, width: 150, height: 22)
        showTimeCheck.state = LocationManager.shared.showTime ? .on : .off
        view.addSubview(showTimeCheck)
        
        // --- Save Button ---
        let saveButton = NSButton(title: "Save & Close", target: self, action: #selector(saveClicked))
        saveButton.frame = NSRect(x: 150, y: 30, width: 120, height: 32)
        view.addSubview(saveButton)
        
        self.configureSheet = window
    }
    
    private func createLabel(title: String, y: CGFloat, view: NSView) {
        let label = NSTextField(labelWithString: title)
        label.frame = NSRect(x: 20, y: y, width: 100, height: 20)
        label.alignment = .right
        view.addSubview(label)
    }
    
    @objc private func saveClicked() {
        let mgr = LocationManager.shared
        mgr.manualLat = manualLatField.stringValue
        mgr.manualLon = manualLonField.stringValue
        mgr.language = languagePopUp.titleOfSelectedItem ?? "en"
        mgr.fontBrightness = brightnessSlider.doubleValue
        mgr.displayFrequency = frequencyPopUp.titleOfSelectedItem ?? "normal"
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
            // User typed something unknown, just save the string
            mgr.selectedCity = selectedName
        }
        
        if let window = configureSheet {
            window.sheetParent?.endSheet(window)
        }
    }
    
    // MARK: - NSComboBoxDataSource
    func numberOfItems(in comboBox: NSComboBox) -> Int {
        return filteredCities.count
    }
    
    func comboBox(_ comboBox: NSComboBox, objectValueForItemAt index: Int) -> Any? {
        guard index < filteredCities.count else { return nil }
        let c = filteredCities[index]
        return "\(c.city)"
    }
    
    func comboBox(_ comboBox: NSComboBox, completedString string: String) -> String? {
        if let match = allCities.first(where: { $0.city.lowercased().hasPrefix(string.lowercased()) }) {
            return match.city
        }
        return nil
    }
    
    // MARK: - NSComboBoxDelegate
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
