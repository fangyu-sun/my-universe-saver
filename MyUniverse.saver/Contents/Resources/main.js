window.updateLocation = function(city, lat, lon) {
    const cityDisplay = document.getElementById("city-display");
    const coordDisplay = document.getElementById("coord-display");

    cityDisplay.textContent = city;
    coordDisplay.textContent = `${lat}, ${lon}`;
};

document.addEventListener("DOMContentLoaded", () => {
    // Initialization can happen here if needed.
    // We wait for Swift to call window.updateLocation(...)
});
