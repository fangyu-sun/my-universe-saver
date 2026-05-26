// globals available: window.initAstronomyData, window.getZenithCandidates

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
let currentCandidates = [];
let candidateIndex = 0;

let isDataReady = false;

// Expose updateConfig to global window object since we are in an ES module now
window.updateConfig = function(config) {
    currentConfig = Object.assign(currentConfig, config);
    if (isDataReady) {
        applyConfig();
    } else {
        window.pendingConfig = currentConfig;
    }
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
    let durationSec = currentConfig.breathingCycle || 10.0;
    
    // 设置 CSS 呼吸周期
    document.documentElement.style.setProperty('--breathe-duration', `${durationSec}s`);
    
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
    
    // 实时计算当前头顶天体
    const now = new Date();
    // 每次迭代重新计算，以保证地球自转的实时性
    currentCandidates = window.getZenithCandidates(currentConfig.lat, currentConfig.lon, now);
    
    if (currentCandidates.length === 0) {
        // 兜底暗区文案
        const fallbacks = {
            "en": { nav: "Right now above you, is a vast and deep cosmic void.", meta: "NO CELESTIAL OBJECTS IN ZENITH 60° DOME" },
            "zh-Hans": { nav: "此刻你的上方，是深邃无垠的宇宙暗区。", meta: "天顶 60° 范围内无已知亮星" },
            "zh-Hant": { nav: "此刻你的上方，是深邃無垠的宇宙暗區。", meta: "天頂 60° 範圍內无已知亮星" },
            "ja": { nav: "今あなたの上空は、深く果てしない宇宙の暗闇です。", meta: "天頂60°以内に既知の天体はありません" }
        };
        const lang = fallbacks[currentConfig.language] ? currentConfig.language : "en";
        mainNarrative.textContent = fallbacks[lang].nav;
        metaInfo.textContent = fallbacks[lang].meta;
        return;
    }
    
    // 循环播放现有的 Candidates
    if (candidateIndex >= currentCandidates.length) {
        candidateIndex = 0;
    }
    
    const obj = currentCandidates[candidateIndex];
    
    // 组装语言文案
    let name = obj.name;
    let constellation = obj.constellation;
    let distStr = "";
    
    if (obj.type === 'satellite') {
        // 航天器播报
        if (currentConfig.language === "zh-Hans" || currentConfig.language === "zh-Hant") {
            mainNarrative.textContent = `你的上空，一架名为 ${name} 的航天器正在静默掠过，距离 ${obj.rangeKm} km。`;
            metaInfo.textContent = `${name.toUpperCase()} · 高度角 ${obj.altitude}° · 方位角 ${obj.azimuth}°`;
        } else if (currentConfig.language === "ja") {
            mainNarrative.textContent = `あなたの上空で、${name} と呼ばれる宇宙船が静かに通過しています。距離 ${obj.rangeKm} km。`;
            metaInfo.textContent = `${name.toUpperCase()} · 高度 ${obj.altitude}° · 方位角 ${obj.azimuth}°`;
        } else {
            mainNarrative.textContent = `Above you, a spacecraft named ${name} is silently passing by, ${obj.rangeKm} km away.`;
            metaInfo.textContent = `${name.toUpperCase()} · ALTITUDE ${obj.altitude}° · AZIMUTH ${obj.azimuth}°`;
        }
    } else {
        // 恒星/自然天体播报
        if (currentConfig.language === "zh-Hans") {
            name = obj.nameZhHans || obj.name;
            constellation = obj.constellationZhHans || obj.constellation;
            distStr = obj.distLy ? `距离 ${obj.distLy} 光年。` : "在我们的太阳系中。";
            mainNarrative.textContent = `你的上空，一颗属于${constellation}的恒星正在发光，${distStr}`;
            metaInfo.textContent = `${name.toUpperCase()} · 高度角 ${obj.altitude}° · 方位角 ${obj.azimuth}°`;
        } else if (currentConfig.language === "zh-Hant") {
            name = obj.nameZhHant || obj.name;
            constellation = obj.constellationZhHant || obj.constellation;
            distStr = obj.distLy ? `距離 ${obj.distLy} 光年。` : "在我們的太陽系中。";
            mainNarrative.textContent = `你的上空，一顆屬於${constellation}的恆星正在發光，${distStr}`;
            metaInfo.textContent = `${name.toUpperCase()} · 高度角 ${obj.altitude}° · 方位角 ${obj.azimuth}°`;
        } else if (currentConfig.language === "ja") {
            name = obj.nameJa || obj.name;
            constellation = obj.constellationJa || obj.constellation;
            distStr = obj.distLy ? `距離は${obj.distLy}光年です。` : "私たちの太陽系にあります。";
            mainNarrative.textContent = `あなたの上空で、${constellation}に属する恒星が光っています。${distStr}`;
            metaInfo.textContent = `${name.toUpperCase()} · 高度 ${obj.altitude}° · 方位角 ${obj.azimuth}°`;
        } else {
            // English Default
            distStr = obj.distLy ? `${obj.distLy} light-years away.` : "in our solar system.";
            mainNarrative.textContent = `Above you, a star in ${constellation} is shining, ${distStr}`;
            metaInfo.textContent = `${name.toUpperCase()} · ALTITUDE ${obj.altitude}° · AZIMUTH ${obj.azimuth}°`;
        }
    }
    
    candidateIndex++;
}

document.addEventListener("DOMContentLoaded", async () => {
    // 设置默认等待文案
    document.getElementById("meta-info").textContent = "LOADING DEEP SPACE CATALOGS...";
    
    // 初始化并加载海量星表数据与卫星数据
    await window.initAstronomyData();
    
    isDataReady = true;
    
    if (window.pendingConfig) {
        currentConfig = Object.assign(currentConfig, window.pendingConfig);
        window.pendingConfig = null;
    }
    
    if (currentConfig.city !== "UNKNOWN") {
        applyConfig();
    } else {
        document.getElementById("meta-info").textContent = "WAITING FOR TELEMETRY...";
    }
});
