import Cocoa
import ScreenSaver

struct CityInfo {
    let name: String
    let country: String
    let lat: Double
    let lon: Double
    var displayString: String { return "\(name), \(country)" }
}

class ConfigureSheetController: NSObject, NSComboBoxDataSource, NSComboBoxDelegate, NSControlTextEditingDelegate {

    private var window: NSPanel!

    private var currentCityLabel: NSTextField!
    private var cityComboBox: NSComboBox!
    private var langPopup: NSPopUpButton!
    private var fontSizePopup: NSPopUpButton!
    private var brightnessPopup: NSPopUpButton!
    private var refreshPopup: NSPopUpButton!
    
    private var allCities: [CityInfo] = []
    private var filteredCities: [CityInfo] = []
    
    private var selectedLat: Double?
    private var selectedLon: Double?
    private var selectedCityName: String?
    
    private let defaults = ScreenSaverDefaults(forModuleWithName: "com.fangyu.MyUniverse")

    override init() {
        super.init()
        loadCitiesData()
        setupWindow()
        loadDefaults()
    }

    var configureSheet: NSWindow {
        return window
    }
    
    private func loadCitiesData() {
        guard let bundle = Bundle(for: ConfigureSheetController.self).url(forResource: "cities", withExtension: "json", subdirectory: "dist") ?? Bundle(for: ConfigureSheetController.self).url(forResource: "cities", withExtension: "json") else {
            print("cities.json not found in bundle")
            return
        }
        do {
            let data = try Data(contentsOf: bundle)
            if let jsonArray = try JSONSerialization.jsonObject(with: data, options: []) as? [[Any]] {
                for item in jsonArray {
                    if item.count >= 4,
                       let name = item[0] as? String,
                       let country = item[1] as? String,
                       let lat = item[2] as? Double,
                       let lon = item[3] as? Double {
                        allCities.append(CityInfo(name: name, country: country, lat: lat, lon: lon))
                    }
                }
            }
            filteredCities = allCities
        } catch {
            print("Failed to load cities: \(error)")
        }
    }

    private func setupWindow() {
        let panelRect = NSRect(x: 0, y: 0, width: 450, height: 400)
        window = NSPanel(contentRect: panelRect, styleMask: [.titled], backing: .buffered, defer: false)
        window.title = "My Universe Settings"

        let stackView = NSStackView()
        stackView.orientation = .vertical
        stackView.alignment = .centerX
        stackView.spacing = 15
        stackView.edgeInsets = NSEdgeInsets(top: 20, left: 20, bottom: 20, right: 20)
        window.contentView = stackView

        // Current Location Label
        currentCityLabel = NSTextField(labelWithString: "Current Location: Not Set")
        currentCityLabel.font = NSFont.boldSystemFont(ofSize: 14)
        stackView.addArrangedSubview(currentCityLabel)

        // Search Section
        let searchStack = NSStackView()
        searchStack.orientation = .horizontal
        searchStack.addArrangedSubview(NSTextField(labelWithString: "Search City:"))
        
        cityComboBox = NSComboBox()
        cityComboBox.widthAnchor.constraint(equalToConstant: 250).isActive = true
        cityComboBox.usesDataSource = true
        cityComboBox.dataSource = self
        cityComboBox.delegate = self
        cityComboBox.completes = false
        cityComboBox.numberOfVisibleItems = 10
        searchStack.addArrangedSubview(cityComboBox)
        stackView.addArrangedSubview(searchStack)
        
        // Approximate IP Location Button
        let ipBtn = NSButton(title: "Use Approximate IP Location (Network Required)", target: self, action: #selector(fetchIPLocation))
        ipBtn.bezelStyle = .rounded
        stackView.addArrangedSubview(ipBtn)

        // Divider
        let divider = NSBox()
        divider.boxType = .separator
        divider.widthAnchor.constraint(equalToConstant: 400).isActive = true
        stackView.addArrangedSubview(divider)

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
        
        if let latStr = defaults.string(forKey: "latitude"), let lat = Double(latStr),
           let lonStr = defaults.string(forKey: "longitude"), let lon = Double(lonStr) {
            self.selectedLat = lat
            self.selectedLon = lon
            self.selectedCityName = defaults.string(forKey: "city") ?? "Saved Location"
            currentCityLabel.stringValue = "Current Location: \(self.selectedCityName!)"
        }
        
        if let lang = defaults.string(forKey: "language") { langPopup.selectItem(withTitle: lang) }
        else { langPopup.selectItem(withTitle: "English") }
        
        if let size = defaults.string(forKey: "fontSize") { fontSizePopup.selectItem(withTitle: size) }
        else { fontSizePopup.selectItem(withTitle: "Normal") }
        
        if let bright = defaults.string(forKey: "brightness") { brightnessPopup.selectItem(withTitle: bright) }
        else { brightnessPopup.selectItem(withTitle: "Normal") }
        
        if let refresh = defaults.string(forKey: "refreshRate") { refreshPopup.selectItem(withTitle: refresh) }
        else { refreshPopup.selectItem(withTitle: "Normal") }
    }
    
    // MARK: - NSComboBoxDataSource & Delegate
    
    func numberOfItems(in comboBox: NSComboBox) -> Int {
        return min(filteredCities.count, 100) // Limit display for performance
    }
    
    func comboBox(_ comboBox: NSComboBox, objectValueForItemAt index: Int) -> Any? {
        guard index < filteredCities.count else { return nil }
        return filteredCities[index].displayString
    }
    
    func comboBoxSelectionDidChange(_ notification: Notification) {
        let index = cityComboBox.indexOfSelectedItem
        if index >= 0 && index < filteredCities.count {
            let city = filteredCities[index]
            self.selectedLat = city.lat
            self.selectedLon = city.lon
            self.selectedCityName = city.displayString
            currentCityLabel.stringValue = "Current Location: \(city.displayString)"
        }
    }
    
    override func controlTextDidChange(_ obj: Notification) {
        guard let comboBox = obj.object as? NSComboBox, comboBox == cityComboBox else { return }
        let query = comboBox.stringValue.lowercased()
        
        if query.isEmpty {
            filteredCities = allCities
        } else {
            filteredCities = allCities.filter { $0.displayString.lowercased().contains(query) }
        }
        
        comboBox.reloadData()
        // Keep popup open while typing
        if !comboBox.isExpanded {
            comboBox.isExpanded = true
        }
    }

    @objc private func fetchIPLocation() {
        guard let url = URL(string: "https://api.bigdatacloud.net/data/reverse-geocode-client") else { return }
        currentCityLabel.stringValue = "Locating via IP..."
        
        let task = URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            guard let self = self, let data = data, error == nil else {
                DispatchQueue.main.async { self?.currentCityLabel.stringValue = "Current Location: Network Error" }
                return
            }
            
            do {
                if let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
                   let lat = json["latitude"] as? Double,
                   let lon = json["longitude"] as? Double {
                    let city = json["city"] as? String ?? json["locality"] as? String ?? "Approximate IP Location"
                    
                    DispatchQueue.main.async {
                        self.selectedLat = lat
                        self.selectedLon = lon
                        self.selectedCityName = city
                        self.currentCityLabel.stringValue = "Current Location: \(city) (IP)"
                        self.cityComboBox.stringValue = city
                    }
                }
            } catch {
                DispatchQueue.main.async { self?.currentCityLabel.stringValue = "Current Location: Parse Error" }
            }
        }
        task.resume()
    }

    @objc private func save() {
        if let defaults = defaults {
            if let lat = selectedLat, let lon = selectedLon {
                defaults.set(String(format: "%.4f", lat), forKey: "latitude")
                defaults.set(String(format: "%.4f", lon), forKey: "longitude")
            }
            if let cityName = selectedCityName {
                defaults.set(cityName, forKey: "city")
            }
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
