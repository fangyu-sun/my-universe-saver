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

let currentCandidates = [];
let candidateIndex = 0;

function updateMockSpaceData() {
    const mainNarrative = document.getElementById("main-narrative");
    const metaInfo = document.getElementById("meta-info");
    
    // 实时计算当前头顶天体
    const now = new Date();
    // 每次迭代重新计算，以保证地球自转的实时性
    currentCandidates = getZenithCandidates(currentConfig.lat, currentConfig.lon, now);
    
    if (currentCandidates.length === 0) {
        // 兜底暗区文案
        const fallbacks = {
            "en": { nav: "Right now above you, is a vast and deep cosmic void.", meta: "NO CELESTIAL OBJECTS IN ZENITH 60° DOME" },
            "zh-Hans": { nav: "此刻你的上方，是深邃无垠的宇宙暗区。", meta: "天顶 60° 范围内无已知亮星" },
            "zh-Hant": { nav: "此刻你的上方，是深邃無垠的宇宙暗區。", meta: "天頂 60° 範圍內無已知亮星" },
            "ja": { nav: "今あなたの上空は、深く果てしない宇宙の暗闇です。", meta: "天頂60°以内に既知の輝星はありません" }
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
    
    if (currentConfig.language === "zh-Hans") {
        name = obj.nameZhHans || obj.name;
        constellation = obj.constellationZhHans || obj.constellation;
        distStr = obj.distLy ? `距离 ${obj.distLy} 光年。` : "在我们的太阳系中。";
        mainNarrative.textContent = `你的上空，一颗属于${constellation}的${obj.type === 'star' ? '恒星' : '行星'}正在发光，${distStr}`;
        metaInfo.textContent = `${name.toUpperCase()} · 高度角 ${obj.altitude}° · 方位角 ${obj.azimuth}°`;
    } else if (currentConfig.language === "zh-Hant") {
        name = obj.nameZhHant || obj.name;
        constellation = obj.constellationZhHant || obj.constellation;
        distStr = obj.distLy ? `距離 ${obj.distLy} 光年。` : "在我們的太陽系中。";
        mainNarrative.textContent = `你的上空，一顆屬於${constellation}的${obj.type === 'star' ? '恆星' : '行星'}正在發光，${distStr}`;
        metaInfo.textContent = `${name.toUpperCase()} · 高度角 ${obj.altitude}° · 方位角 ${obj.azimuth}°`;
    } else if (currentConfig.language === "ja") {
        name = obj.nameJa || obj.name;
        constellation = obj.constellationJa || obj.constellation;
        distStr = obj.distLy ? `距離は${obj.distLy}光年です。` : "私たちの太陽系にあります。";
        mainNarrative.textContent = `あなたの上空で、${constellation}に属する${obj.type === 'star' ? '恒星' : '惑星'}が光っています。${distStr}`;
        metaInfo.textContent = `${name.toUpperCase()} · 高度 ${obj.altitude}° · 方位角 ${obj.azimuth}°`;
    } else {
        // English Default
        distStr = obj.distLy ? `${obj.distLy} light-years away.` : "in our solar system.";
        mainNarrative.textContent = `Above you, a ${obj.type} in ${constellation} is shining, ${distStr}`;
        metaInfo.textContent = `${name.toUpperCase()} · ALTITUDE ${obj.altitude}° · AZIMUTH ${obj.azimuth}°`;
    }
    
    candidateIndex++;
}

document.addEventListener("DOMContentLoaded", () => {
    // 设置默认等待文案
    document.getElementById("meta-info").textContent = "WAITING FOR TELEMETRY...";
});
