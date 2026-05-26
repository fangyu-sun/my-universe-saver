let currentConfig = {
    city: "UNKNOWN",
    lat: "0.0",
    lon: "0.0",
    language: "en",
    fontBrightness: 0.8,
    displayFrequency: "normal",
    showCoordinates: true,
    showCity: true,
    showTime: true
};

let displayInterval = null;
let broadcastInterval = null;
let mockIndex = 0;

// 多语言文案库
const translations = {
    "en": {
        wait: "WAITING FOR TELEMETRY...",
        mock: [
            "ISS (ZARYA) · ALTITUDE 45.2° · DISTANCE 800km",
            "STARLINK-1234 · ALTITUDE 60.1° · DISTANCE 550km",
            "HUBBLE SPACE TELESCOPE · ALTITUDE 30.5° · DISTANCE 540km",
            "SIRIUS (ALPHA CANIS MAJORIS) · ALTITUDE 75.8°",
            "JUPITER · ALTITUDE 42.0°"
        ]
    },
    "zh-Hans": {
        wait: "等待遥测数据...",
        mock: [
            "国际空间站 (ZARYA) · 仰角 45.2° · 距离 800km",
            "星链-1234 · 仰角 60.1° · 距离 550km",
            "哈勃空间望远镜 · 仰角 30.5° · 距离 540km",
            "天狼星 (大犬座α) · 仰角 75.8°",
            "木星 · 仰角 42.0°"
        ]
    },
    "zh-Hant": {
        wait: "等待遙測數據...",
        mock: [
            "國際太空站 (ZARYA) · 仰角 45.2° · 距離 800km",
            "星鏈-1234 · 仰角 60.1° · 距離 550km",
            "哈伯太空望遠鏡 · 仰角 30.5° · 距離 540km",
            "天狼星 (大犬座α) · 仰角 75.8°",
            "木星 · 仰角 42.0°"
        ]
    },
    "ja": {
        wait: "テレメトリ待機中...",
        mock: [
            "国際宇宙ステーション (ZARYA) · 高度 45.2° · 距離 800km",
            "スターリンク-1234 · 高度 60.1° · 距離 550km",
            "ハッブル宇宙望遠鏡 · 高度 30.5° · 距離 540km",
            "シリウス (おおいぬ座α星) · 高度 75.8°",
            "木星 · 高度 42.0°"
        ]
    }
};

window.updateConfig = function(config) {
    currentConfig = Object.assign(currentConfig, config);
    applyConfig();
};

function applyConfig() {
    // 1. 设置亮度
    document.documentElement.style.setProperty('--font-brightness', currentConfig.fontBrightness);
    
    // 2. 控制显隐
    document.getElementById("location-time-info").style.display = (currentConfig.showCity || currentConfig.showTime) ? "block" : "none";
    document.getElementById("coord-display").style.display = currentConfig.showCoordinates ? "block" : "none";
    
    // 3. 初始刷新时钟
    updateClock();
    if (displayInterval) clearInterval(displayInterval);
    displayInterval = setInterval(updateClock, 1000);
    
    // 4. 重建宇宙播报循环
    let freqMs = 10000; // normal
    if (currentConfig.displayFrequency === "fast") freqMs = 3000;
    if (currentConfig.displayFrequency === "slow") freqMs = 30000;
    
    updateMockSpaceData();
    if (broadcastInterval) clearInterval(broadcastInterval);
    broadcastInterval = setInterval(updateMockSpaceData, freqMs);
}

function updateClock() {
    const locationTimeInfo = document.getElementById("location-time-info");
    const coordDisplay = document.getElementById("coord-display");
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    let parts = [];
    if (currentConfig.showCity && currentConfig.city) parts.push(currentConfig.city);
    if (currentConfig.showTime) parts.push(timeString);
    locationTimeInfo.textContent = parts.join(" · ");
    
    coordDisplay.textContent = `${currentConfig.lat}, ${currentConfig.lon}`;
}

function updateMockSpaceData() {
    const metaInfo = document.getElementById("meta-info");
    const lang = translations[currentConfig.language] ? currentConfig.language : "en";
    const dataList = translations[lang].mock;
    
    metaInfo.textContent = dataList[mockIndex];
    mockIndex = (mockIndex + 1) % dataList.length;
}

document.addEventListener("DOMContentLoaded", () => {
    // 设置默认等待文案
    document.getElementById("meta-info").textContent = translations["en"].wait;
});
