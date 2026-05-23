document.addEventListener("DOMContentLoaded", () => {
    // Expected to be injected by Swift before page load:
    // window.saverConfig = { city: "Beijing", lat: "39.9042", lon: "116.4074" };
    
    const config = window.saverConfig || {};
    const city = config.city || "UNKNOWN CITY";
    const lat = config.lat || "0.0";
    const lon = config.lon || "0.0";

    const cityDisplay = document.getElementById("city-display");
    const coordDisplay = document.getElementById("coord-display");

    cityDisplay.textContent = city;
    coordDisplay.textContent = `${lat}, ${lon}`;
});
