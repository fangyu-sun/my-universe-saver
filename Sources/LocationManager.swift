import Foundation
import ScreenSaver

class LocationManager {
    static let shared = LocationManager()
    
    private let defaults = ScreenSaverDefaults(forModuleWithName: "com.fangyu.MyUniverse")
    
    func getCity() -> String {
        return defaults?.string(forKey: "city") ?? "Unknown City"
    }
    
    func getLatitude() -> String {
        return defaults?.string(forKey: "latitude") ?? "0.0"
    }
    
    func getLongitude() -> String {
        return defaults?.string(forKey: "longitude") ?? "0.0"
    }
    
    func saveLocation(city: String, latitude: String, longitude: String) {
        defaults?.set(city, forKey: "city")
        defaults?.set(latitude, forKey: "latitude")
        defaults?.set(longitude, forKey: "longitude")
        defaults?.synchronize()
    }
}
