// globals available: window.initAstronomyData, window.getZenithCandidates, window.generateCopy

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

const UI_TRANSLATIONS = {
    "zh-Hans": {
        alt: "仰角",
        zenithOffset: "天顶偏角",
        range: "距离",
        lat: "纬度",
        lon: "经度",
        voidNav: "此刻你的上方，是深邃无垠的宇宙暗区。",
        voidMeta: "天顶 60° 范围内无已知目标",
        locUpdate: "实时定位更新"
    },
    "zh-Hant": {
        alt: "仰角",
        zenithOffset: "天頂偏角",
        range: "距離",
        lat: "緯度",
        lon: "經度",
        voidNav: "此刻你的上方，是深邃無垠的宇宙暗區。",
        voidMeta: "天頂 60° 範圍內無已知目標",
        locUpdate: "實時定位更新"
    },
    "en": {
        alt: "ALTITUDE",
        zenithOffset: "ZENITH OFFSET",
        range: "RANGE",
        lat: "LAT",
        lon: "LON",
        voidNav: "Right now above you, is a vast and deep cosmic void.",
        voidMeta: "NO OBJECTS IN ZENITH 60° DOME",
        locUpdate: "LIVE LOC"
    },
    "ja": {
        alt: "仰角",
        zenithOffset: "天頂角",
        range: "距離",
        lat: "緯度",
        lon: "経度",
        voidNav: "今あなたの上空は、深く果てしない宇宙の暗闇です。",
        voidMeta: "天頂60°以内に既知の目標はありません",
        locUpdate: "リアルタイム位置"
    }
};

let activeSatellites = [];

async function loadActiveSatellites() {
    try {
        const response = await fetch('https://tle.ivanstanojevic.me/api/tle/?page-size=50&sort=popularity', { cache: "no-store" });
        const data = await response.json();
        if (data && data.member && data.member.length > 0) {
            const pops = data.member.map(sat => ({
                satelliteId: sat.satelliteId,
                name: sat.name,
                line1: sat.line1,
                line2: sat.line2
            }));
            activeSatellites = pops;
        }
    } catch (e) {
        console.warn("Failed to fetch dynamic popular TLEs, falling back to local database.", e);
    }
    
    try {
        const responseStarlink = await fetch('https://tle.ivanstanojevic.me/api/tle/?search=STARLINK&page-size=40', { cache: "no-store" });
        const dataStarlink = await responseStarlink.json();
        if (dataStarlink && dataStarlink.member && dataStarlink.member.length > 0) {
            const starlinks = dataStarlink.member.map(sat => ({
                satelliteId: sat.satelliteId,
                name: sat.name,
                line1: sat.line1,
                line2: sat.line2
            }));
            activeSatellites = [...activeSatellites, ...starlinks];
        }
    } catch (err) {
        console.warn("Failed to fetch Starlink TLEs.", err);
    }
}

let displayInterval = null;
let currentCandidates = [];
let candidateIndex = 0;

function applyConfig() {
    // 1. 设置亮度
    document.documentElement.style.setProperty('--font-brightness', currentConfig.fontBrightness);
    
    // 2. 控制显隐
    document.getElementById("location-time-info").style.display = (currentConfig.showCity || currentConfig.showTime || currentConfig.showCoordinates) ? "block" : "none";
    
    // 3. 异步拉取最新卫星轨道（静默失败则使用本地 fallback）
    loadActiveSatellites();
    
    // 4. 静默开启实时定位追踪 (如果不被沙盒拦截)
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (pos) => {
                currentConfig.lat = pos.coords.latitude.toString();
                currentConfig.lon = pos.coords.longitude.toString();
                // We keep currentConfig.city but maybe append an indicator
                const t = UI_TRANSLATIONS[currentConfig.language] || UI_TRANSLATIONS["en"];
                currentConfig.city = t.locUpdate;
                updateClock(); // force update the top text
            },
            (err) => { console.warn("Geolocation watch silently failed/denied.", err); },
            { enableHighAccuracy: false, maximumAge: 10000 }
        );
    }
    
    // 5. 初始刷新时钟
    updateClock();
    if (displayInterval) clearInterval(displayInterval);
    displayInterval = setInterval(updateClock, 1000);
    
    // 6. 重建宇宙播报循环
    let durationSec = currentConfig.breathingCycle || 10.0;
    startCustomBreathingLoop(durationSec);
}

let breathingTimer = null;
function startCustomBreathingLoop(durationSec) {
    if (breathingTimer) clearInterval(breathingTimer);
    
    // 立即执行一次
    updateMockSpaceData();
    
    breathingTimer = setInterval(() => {
        const mainCopy = document.getElementById("main-copy");
        const metaInfo = document.getElementById("meta-info");
        
        // 核心与元数据同步淡出
        mainCopy.classList.add("text-breath-out");
        metaInfo.classList.add("text-breath-out");
        
        // 等待 CSS 的 2.5s 过渡完成
        setTimeout(() => {
            updateMockSpaceData();
            mainCopy.classList.remove("text-breath-out");
            metaInfo.classList.remove("text-breath-out");
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
    if (currentConfig.showCoordinates) parts.push(`${parseFloat(currentConfig.lat).toFixed(2)}, ${parseFloat(currentConfig.lon).toFixed(2)}`);
    locationTimeInfo.textContent = parts.join(" · ");
}

function updateMockSpaceData() {
    const mainCopy = document.getElementById("main-copy");
    const metaInfo = document.getElementById("meta-info");
    const t = UI_TRANSLATIONS[currentConfig.language] || UI_TRANSLATIONS["en"];
    
    const now = new Date();
    currentCandidates = window.getZenithCandidates(currentConfig.lat, currentConfig.lon, now, activeSatellites);
    
    if (!currentCandidates || currentCandidates.length === 0) {
        mainCopy.textContent = t.voidNav;
        metaInfo.textContent = t.voidMeta;
        return;
    }
    
    if (candidateIndex >= currentCandidates.length) {
        candidateIndex = 0;
    }
    
    const obj = currentCandidates[currentCandidates.length - 1 - candidateIndex]; // Fix direction or keep as is? actually let's keep original index logic
    const currentObj = currentCandidates[candidateIndex];
    const copyStr = window.generateCopy(currentObj, currentConfig.language);
    
    const altFixed = parseFloat(currentObj.altitude).toFixed(3);
    const displayId = currentObj.id ? currentObj.id.toUpperCase() : (currentObj.nameJa || currentObj.nameZhHans || currentObj.name).toUpperCase();
    
    if (currentObj.isSatellite) {
        metaInfo.innerHTML = `${currentObj.name.toUpperCase()} &nbsp;&middot;&nbsp; ${t.alt} ${altFixed}&deg; &nbsp;&middot;&nbsp; ${t.range} ${currentObj.rangeKm || currentObj.distanceStr}`;
    } else {
        const offZenith = (90 - parseFloat(currentObj.altitude)).toFixed(3);
        metaInfo.innerHTML = `${displayId} &nbsp;&middot;&nbsp; ${t.alt} ${altFixed}&deg; &nbsp;&middot;&nbsp; ${t.zenithOffset} ${offZenith}&deg;`;
    }
    
    mainCopy.textContent = copyStr;
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
    
    // 无论是否配置了位置，都进入播报（默认经纬度为 0,0）
    applyConfig();
});
