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

// Mock 天体数据
const mockCelestialObject = {
    type: "star",
    constellation: "Columba",
    constellationZhHans: "天鸽座",
    constellationZhHant: "天鴿座",
    constellationJa: "はと座",
    distanceLy: 421.9,
    altitude: 86.9,
    zenithOffset: 3.1,
    catalogId: "HIP 12345"
};

// 多语言文案库
const translations = {
    "en": {
        wait: "WAITING FOR TELEMETRY...",
        narrative: `Above you, a star in ${mockCelestialObject.constellation} is shining, ${mockCelestialObject.distanceLy} light-years away.`,
        mock: [
            `${mockCelestialObject.catalogId} · ALTITUDE ${mockCelestialObject.altitude}° · ZENITH OFFSET ${mockCelestialObject.zenithOffset}°`,
            "ISS (ZARYA) · ALTITUDE 45.2° · DISTANCE 800km",
            "HUBBLE SPACE TELESCOPE · ALTITUDE 30.5° · DISTANCE 540km"
        ]
    },
    "zh-Hans": {
        wait: "等待遥测数据...",
        narrative: `你的上空，一颗属于${mockCelestialObject.constellationZhHans}的恒星正在发光，距离 ${mockCelestialObject.distanceLy} 光年。`,
        mock: [
            `${mockCelestialObject.catalogId} · 高度角 ${mockCelestialObject.altitude}° · 天顶偏移 ${mockCelestialObject.zenithOffset}°`,
            "国际空间站 (ZARYA) · 仰角 45.2° · 距离 800km",
            "哈勃空间望远镜 · 仰角 30.5° · 距离 540km"
        ]
    },
    "zh-Hant": {
        wait: "等待遙測數據...",
        narrative: `你的上空，一顆屬於${mockCelestialObject.constellationZhHant}的恆星正在發光，距離 ${mockCelestialObject.distanceLy} 光年。`,
        mock: [
            `${mockCelestialObject.catalogId} · 高度角 ${mockCelestialObject.altitude}° · 天頂偏移 ${mockCelestialObject.zenithOffset}°`,
            "國際太空站 (ZARYA) · 仰角 45.2° · 距離 800km",
            "哈伯太空望遠鏡 · 仰角 30.5° · 距離 540km"
        ]
    },
    "ja": {
        wait: "テレメトリ待機中...",
        narrative: `あなたの上空で、${mockCelestialObject.constellationJa}に属する恒星が光っています。距離は${mockCelestialObject.distanceLy}光年です。`,
        mock: [
            `${mockCelestialObject.catalogId} · 高度 ${mockCelestialObject.altitude}° · 天頂オフセット ${mockCelestialObject.zenithOffset}°`,
            "国際宇宙ステーション (ZARYA) · 高度 45.2° · 距離 800km",
            "ハッブル宇宙望遠鏡 · 高度 30.5° · 距離 540km"
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
    
    // 4. 重建宇宙播报循环 (与动画至暗时刻咬合)
    let durationStr = "10s"; // normal
    if (currentConfig.displayFrequency === "fast") durationStr = "3s";
    if (currentConfig.displayFrequency === "slow") durationStr = "30s";
    
    // 设置 CSS 呼吸周期
    document.documentElement.style.setProperty('--breathe-duration', durationStr);
    
    // 首次立即更新
    updateMockSpaceData();
}

// 监听动画迭代事件：当动画回到 100%（至暗时刻）时切换文本
document.getElementById("main-narrative").addEventListener("animationiteration", () => {
    updateMockSpaceData();
});

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
    const mainNarrative = document.getElementById("main-narrative");
    const metaInfo = document.getElementById("meta-info");
    
    const lang = translations[currentConfig.language] ? currentConfig.language : "en";
    const dataList = translations[lang].mock;
    const narrativeText = translations[lang].narrative;
    
    // 更新主叙事文案
    mainNarrative.textContent = narrativeText;
    
    // 更新底部技术行
    metaInfo.textContent = dataList[mockIndex];
    mockIndex = (mockIndex + 1) % dataList.length;
}

document.addEventListener("DOMContentLoaded", () => {
    // 设置默认等待文案
    document.getElementById("meta-info").textContent = translations["en"].wait;
});
