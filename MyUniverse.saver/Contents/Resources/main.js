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
    showTime: true,
    breathingCycle: 10.0
};

let displayInterval = null;
let currentCandidates = [];
let candidateIndex = 0;

function applyConfig() {
    // 1. 设置亮度
    document.documentElement.style.setProperty('--font-brightness', currentConfig.fontBrightness);
    
    // 2. 控制显隐
    document.getElementById("location-time-info").style.display = (currentConfig.showCity || currentConfig.showTime) ? "block" : "none";
    
    // 3. 初始刷新时钟
    updateClock();
    if (displayInterval) clearInterval(displayInterval);
    displayInterval = setInterval(updateClock, 1000);
    
    // 4. 重建宇宙播报循环
    let durationSec = currentConfig.breathingCycle || 10.0;
    
    // 启动基于 JS setInterval 和 CSS transition 的自定义呼吸循环
    startCustomBreathingLoop(durationSec);
}

let breathingTimer = null;
function startCustomBreathingLoop(durationSec) {
    if (breathingTimer) clearInterval(breathingTimer);
    
    // 立即执行一次
    updateMockSpaceData();
    
    const halfCycle = (durationSec * 1000) / 2;
    
    breathingTimer = setInterval(() => {
        const mainCopy = document.getElementById("main-copy");
        // Fade out
        mainCopy.classList.add("text-breath-out");
        
        // Wait for transition to finish (2.5s as per CSS), then update text and fade in
        setTimeout(() => {
            updateMockSpaceData();
            mainCopy.classList.remove("text-breath-out");
        }, 2500);
        
    }, durationSec * 1000);
}

function updateClock() {
    const locationTimeInfo = document.getElementById("location-time-info");
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    let parts = [];
    if (currentConfig.showCity && currentConfig.city) parts.push(currentConfig.city);
    if (currentConfig.showTime) parts.push(timeString);
    if (currentConfig.showCoordinates) parts.push(`${currentConfig.lat}, ${currentConfig.lon}`);
    locationTimeInfo.textContent = parts.join(" · ");
}

// (window.generateCopy is now in copywriter.js)

function updateMockSpaceData() {
    const mainCopy = document.getElementById("main-copy");
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
        mainCopy.textContent = fallbacks[lang].nav;
        metaInfo.textContent = fallbacks[lang].meta;
        return;
    }
    
    // 循环播放现有的 Candidates
    if (candidateIndex >= currentCandidates.length) {
        candidateIndex = 0;
    }
    
    const obj = currentCandidates[candidateIndex];
    const copyStr = window.generateCopy(obj, currentConfig.language);
    
    // Generate meta string manually (since copywriter only returns nav)
    let metaStr = "";
    let dispName = obj.nameJa || obj.nameZhHans || obj.name;
    if (obj.isSatellite || obj.isPlanet) {
        dispName = obj.name;
    }
    const cleanName = dispName ? dispName.toUpperCase() : "UNKNOWN";
    const alt = obj.altitude || 0;
    const az = obj.azimuth || 0;

    if (currentConfig.language === "zh-Hans" || currentConfig.language === "zh-Hant") {
        metaStr = `${cleanName} · 高度角 ${alt}° · 方位角 ${az}°`;
    } else if (currentConfig.language === "ja") {
        metaStr = `${cleanName} · 高度 ${alt}° · 方位角 ${az}°`;
    } else {
        metaStr = `${cleanName} · ALTITUDE ${alt}° · AZIMUTH ${az}°`;
    }
    
    mainCopy.textContent = copyStr;
    metaInfo.textContent = metaStr;
    
    candidateIndex++;
}

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("meta-info").textContent = "LOADING DEEP SPACE CATALOGS...";
    
    // 读取 WKUserScript 预先注入的配置
    if (window.initialConfig) {
        currentConfig = Object.assign(currentConfig, window.initialConfig);
    }
    
    // 初始化并加载海量星表数据与卫星数据
    await window.initAstronomyData();
    
    if (currentConfig.city !== "UNKNOWN" && currentConfig.city !== "Unknown City") {
        applyConfig();
    } else {
        document.getElementById("meta-info").textContent = "NO LOCATION SET. PLEASE CONFIGURE OPTIONS.";
    }
});
