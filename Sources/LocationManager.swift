import Foundation
import ScreenSaver

class LocationManager {
    static let shared = LocationManager()
    
    private let defaults = ScreenSaverDefaults(forModuleWithName: "com.fangyu.MyUniverse")
    
    // --- Location Data ---
    var selectedCity: String {
        get { return defaults?.string(forKey: "selectedCity") ?? "Unknown City" }
        set { defaults?.set(newValue, forKey: "selectedCity"); defaults?.synchronize() }
    }
    
    var selectedRegion: String {
        get { return defaults?.string(forKey: "selectedRegion") ?? "" }
        set { defaults?.set(newValue, forKey: "selectedRegion"); defaults?.synchronize() }
    }
    
    var selectedCountry: String {
        get { return defaults?.string(forKey: "selectedCountry") ?? "" }
        set { defaults?.set(newValue, forKey: "selectedCountry"); defaults?.synchronize() }
    }
    
    var cityLatitude: String {
        get { return defaults?.string(forKey: "cityLatitude") ?? "0.0" }
        set { defaults?.set(newValue, forKey: "cityLatitude"); defaults?.synchronize() }
    }
    
    var cityLongitude: String {
        get { return defaults?.string(forKey: "cityLongitude") ?? "0.0" }
        set { defaults?.set(newValue, forKey: "cityLongitude"); defaults?.synchronize() }
    }
    
    var timezone: String {
        get { return defaults?.string(forKey: "timezone") ?? "" }
        set { defaults?.set(newValue, forKey: "timezone"); defaults?.synchronize() }
    }
    
    var manualLat: String {
        get { return defaults?.string(forKey: "manualLat") ?? "" }
        set { defaults?.set(newValue, forKey: "manualLat"); defaults?.synchronize() }
    }
    
    var manualLon: String {
        get { return defaults?.string(forKey: "manualLon") ?? "" }
        set { defaults?.set(newValue, forKey: "manualLon"); defaults?.synchronize() }
    }
    
    // --- Visual Data ---
    var language: String {
        get { return defaults?.string(forKey: "language") ?? "en" }
        set { defaults?.set(newValue, forKey: "language"); defaults?.synchronize() }
    }
    
    var fontBrightness: Double {
        get { 
            let val = defaults?.double(forKey: "fontBrightness") ?? 0.0
            return val == 0.0 ? 0.8 : val 
        }
        set { defaults?.set(newValue, forKey: "fontBrightness"); defaults?.synchronize() }
    }
    
    var displayFrequency: String {
        get { return defaults?.string(forKey: "displayFrequency") ?? "normal" }
        set { defaults?.set(newValue, forKey: "displayFrequency"); defaults?.synchronize() }
    }
    
    var showCoordinates: Bool {
        get { return defaults?.object(forKey: "showCoordinates") as? Bool ?? true }
        set { defaults?.set(newValue, forKey: "showCoordinates"); defaults?.synchronize() }
    }
    
    var showCity: Bool {
        get { return defaults?.object(forKey: "showCity") as? Bool ?? true }
        set { defaults?.set(newValue, forKey: "showCity"); defaults?.synchronize() }
    }
    
    var showTime: Bool {
        get { return defaults?.object(forKey: "showTime") as? Bool ?? true }
        set { defaults?.set(newValue, forKey: "showTime"); defaults?.synchronize() }
    }
    
    // --- Helper to get final coordinates ---
    func getFinalLatitude() -> String {
        let mLat = manualLat.trimmingCharacters(in: .whitespacesAndNewlines)
        return mLat.isEmpty ? cityLatitude : mLat
    }
    
    func getFinalLongitude() -> String {
        let mLon = manualLon.trimmingCharacters(in: .whitespacesAndNewlines)
        return mLon.isEmpty ? cityLongitude : mLon
    }
    
    // Generate config dictionary for JS Bridge
    func getJSConfig() -> [String: Any] {
        return [
            "city": selectedCity,
            "region": selectedRegion,
            "country": selectedCountry,
            "lat": getFinalLatitude(),
            "lon": getFinalLongitude(),
            "timezone": timezone,
            "language": language,
            "fontBrightness": fontBrightness,
            "displayFrequency": displayFrequency,
            "showCoordinates": showCoordinates,
            "showCity": showCity,
            "showTime": showTime
        ]
    }
}
