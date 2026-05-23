let currentCity = "UNKNOWN";

// 接收来自 Swift 的配置注入
window.updateLocation = function(city, lat, lon) {
    currentCity = city;
    // 立即触发一次时间与显示更新
    updateDisplay();
};

function updateDisplay() {
    // 1. 更新时间和城市
    const locationTimeInfo = document.getElementById("location-time-info");
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    locationTimeInfo.textContent = `${currentCity} · ${timeString}`;
}

// 2. 模拟底部的星空播报数据
const mockSpaceData = [
    "ISS (ZARYA) · ALTITUDE 45.2° · DISTANCE 800km",
    "STARLINK-1234 · ALTITUDE 60.1° · DISTANCE 550km",
    "HUBBLE SPACE TELESCOPE · ALTITUDE 30.5° · DISTANCE 540km",
    "SIRIUS (ALPHA CANIS MAJORIS) · ALTITUDE 75.8°",
    "JUPITER · ALTITUDE 42.0°"
];

let mockIndex = 0;

function updateMockSpaceData() {
    const metaInfo = document.getElementById("meta-info");
    metaInfo.textContent = mockSpaceData[mockIndex];
    mockIndex = (mockIndex + 1) % mockSpaceData.length;
}

document.addEventListener("DOMContentLoaded", () => {
    // 启动时钟循环 (每秒更新)
    setInterval(updateDisplay, 1000);
    
    // 启动底部文案滚动循环 (每 8 秒切换一次)
    updateMockSpaceData();
    setInterval(updateMockSpaceData, 8000);
});
