// 全局变量声明：这些变量由其他的 JavaScript 文件或 Swift 桥接注入提供
// window.initAstronomyData: 初始化天文数据的函数
// window.getZenithCandidates: 获取天顶候选天体的函数
// window.generateCopy: 生成诗意天文文案的函数

// 屏保的默认配置对象，如果 Swift 端没有成功注入用户配置，将使用这些兜底值
let currentConfig = {
    city: "Beijing", // 默认城市：北京
    lat: "39.9042",  // 默认纬度
    lon: "116.4074", // 默认经度
    language: "en",  // 默认语言：英语
    fontBrightness: 0.8, // 字体默认亮度
    displayFrequency: "normal", // 显示频率
    showCoordinates: true, // 是否显示坐标
    showCity: true, // 是否显示城市名称
    showTime: true, // 是否显示时间
    breathingCycle: 10.0 // 呼吸动画的周期（秒）
};

// UI 翻译字典：用于底部元数据信息（Meta Info）的国际化展示
const UI_TRANSLATIONS = {
    "zh-Hans": {
        alt: "仰角",
        zenithOffset: "天顶偏角",
        range: "距离",
        lat: "纬度",
        lon: "经度",
        voidNav: "此刻你的上方，是深邃无垠的宇宙暗区。", // 头顶无已知天体时的兜底主文案
        voidMeta: "天顶 60° 范围内无已知目标", // 头顶无天体时的兜底副文案
        locUpdate: "实时定位更新" // 当 GPS 定位成功时的城市替代文本
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

// 存储活跃人造卫星数据的数组
let activeSatellites = [];

/**
 * 异步函数：从外部 API 动态加载实时的活跃卫星 TLE (双行元素) 轨道数据
 * 包含两部分请求：最受欢迎的卫星和 Starlink 星链卫星。
 * 屏保需要做到“断网可用”，所以这里的所有请求都被 try-catch 包裹，
 * 一旦失败，代码会默默使用本地回退数据库（fallback database），不会报错中断。
 */
async function loadActiveSatellites() {
    // 1. 尝试拉取最热门的卫星数据
    try {
        // 使用 cache: "no-store" 强制获取最新数据
        const response = await fetch('https://tle.ivanstanojevic.me/api/tle/?page-size=50&sort=popularity', { cache: "no-store" });
        const data = await response.json();
        // 成功获取后，提取所需的关键字段
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
        // 请求失败（断网等），在后台静默输出警告，不影响屏保主进程
        console.warn("Failed to fetch dynamic popular TLEs, falling back to local database.", e);
    }
    
    // 2. 尝试拉取 Starlink (星链) 卫星数据
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
            // 将获取到的星链数据拼接到现有的活跃卫星数组中
            activeSatellites = [...activeSatellites, ...starlinks];
        }
    } catch (err) {
        console.warn("Failed to fetch Starlink TLEs.", err);
    }
}

// 全局定时器与状态维护变量
let displayInterval = null; // 时钟更新定时器
let currentCandidates = []; // 当前头顶的天体候选列表
let candidateIndex = 0;     // 轮播展示的候选天体索引

/**
 * 应用配置信息到前端 UI 上，并在此时正式启动屏保的各大子系统。
 */
function applyConfig() {
    // 1. 将亮度配置应用到 CSS 的全局变量上，控制字体整体亮度
    document.documentElement.style.setProperty('--font-brightness', currentConfig.fontBrightness);
    
    // 2. 根据用户配置，决定是否显示顶部的位置和时间信息条
    document.getElementById("location-time-info").style.display = (currentConfig.showCity || currentConfig.showTime || currentConfig.showCoordinates) ? "block" : "none";
    
    // 3. 发起异步拉取最新卫星轨道的操作（静默失败则使用本地的 fallback 星表）
    loadActiveSatellites();
    
    // 4. 静默开启基于浏览器的实时定位追踪（如果未被 MacOS 沙盒机制拦截）
    // 这样当电脑物理位置移动时，星空数据能实时跟随更新
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (pos) => {
                // 更新当前配置中的经纬度为真实 GPS 坐标
                currentConfig.lat = pos.coords.latitude.toString();
                currentConfig.lon = pos.coords.longitude.toString();
                // 根据当前语言获取对应的“实时定位更新”提示文案，替代原本静态的城市名
                const t = UI_TRANSLATIONS[currentConfig.language] || UI_TRANSLATIONS["en"];
                currentConfig.city = t.locUpdate;
                // 强制刷新顶部状态栏文本
                updateClock(); 
            },
            // 静默处理定位失败或被用户/沙盒拒绝的情况
            (err) => { console.warn("Geolocation watch silently failed/denied.", err); },
            { enableHighAccuracy: false, maximumAge: 10000 } // 配置定位精度与缓存时间
        );
    }
    
    // 5. 立即执行一次顶部时钟的刷新，然后挂载每秒更新的定时器
    updateClock();
    if (displayInterval) clearInterval(displayInterval);
    displayInterval = setInterval(updateClock, 1000);
    
    // 6. 重建并启动宇宙播报的“呼吸循环”动画
    let durationSec = currentConfig.breathingCycle || 10.0;
    startCustomBreathingLoop(durationSec);
}

// 记录呼吸循环定时器的 ID，方便重置
let breathingTimer = null;

/**
 * 启动自定义的呼吸循环系统，用于交替展示不同的天体。
 * @param {number} durationSec - 一个完整循环的周期时长（秒）
 */
function startCustomBreathingLoop(durationSec) {
    // 如果已经存在定时器，先清除，避免动画交叠打架
    if (breathingTimer) clearInterval(breathingTimer);
    
    // 立即执行第一次宇宙数据计算与渲染
    updateMockSpaceData();
    
    // 挂载周期性的呼吸事件
    breathingTimer = setInterval(() => {
        const mainCopy = document.getElementById("main-copy");
        const metaInfo = document.getElementById("meta-info");
        
        // 步骤一：为核心文案和元数据信息添加 CSS 类，触发同步淡出动画
        mainCopy.classList.add("text-breath-out");
        metaInfo.classList.add("text-breath-out");
        
        // 步骤二：等待 CSS 的 2.5s 淡出过渡动画彻底完成，此时屏幕文字完全处于极暗状态
        setTimeout(() => {
            // 在黑暗中完成数据的更新（无缝切换）
            updateMockSpaceData();
            // 移除淡出类，触发淡入动画，崭新的天体文案浮现
            mainCopy.classList.remove("text-breath-out");
            metaInfo.classList.remove("text-breath-out");
        }, 2500); // 这个 2.5s 必须严格匹配 style.css 中的 transition 时间
        
    }, durationSec * 1000); // 按秒转毫秒设定周期
}

/**
 * 更新顶部的信息栏，包含城市、当地时间、以及观测者的原始经纬度坐标。
 */
function updateClock() {
    const locationTimeInfo = document.getElementById("location-time-info");
    
    const now = new Date();
    // 统一格式化为不带 AM/PM 的 24 小时制时间，如 "14:30"
    const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    let parts = [];
    // 只有在配置允许显示时才推入相应的字符串段落
    if (currentConfig.showCity && currentConfig.city) parts.push(currentConfig.city);
    if (currentConfig.showTime) parts.push(timeString);
    if (currentConfig.showCoordinates) parts.push(`${parseFloat(currentConfig.lat).toFixed(2)}, ${parseFloat(currentConfig.lon).toFixed(2)}`);
    
    // 用 · (中间点) 将所有启用的信息部分优雅地连接起来
    locationTimeInfo.textContent = parts.join(" · ");
}

/**
 * 这是整个屏保的核心业务逻辑函数。
 * 负责获取此刻头顶的天体，并格式化渲染诗意主文案与严谨的底部数据。
 */
function updateMockSpaceData() {
    const mainCopy = document.getElementById("main-copy");
    const metaInfo = document.getElementById("meta-info");
    
    // 获取对应语言的 UI 字典，默认回退为英语
    const t = UI_TRANSLATIONS[currentConfig.language] || UI_TRANSLATIONS["en"];
    
    const now = new Date();
    // 调用 astronomy.js 暴露的引擎接口，基于观测者坐标和时间，计算出天顶候选天体数组
    currentCandidates = window.getZenithCandidates(currentConfig.lat, currentConfig.lon, now, activeSatellites);
    
    // 如果由于经纬度或者时间原因，头顶空空如也，则展示优美的兜底“暗区”文案
    if (!currentCandidates || currentCandidates.length === 0) {
        mainCopy.textContent = t.voidNav;
        metaInfo.textContent = t.voidMeta;
        return;
    }
    
    // 循环播放当前的候选列表，如果播到了尽头，则重头再来
    if (candidateIndex >= currentCandidates.length) {
        candidateIndex = 0;
    }
    
    // 原代码中有注释怀疑索引方向，这里保留原有的顺序提取逻辑
    // const obj = currentCandidates[currentCandidates.length - 1 - candidateIndex]; 
    const currentObj = currentCandidates[candidateIndex];
    
    // 调用文案生成引擎，基于天体的特征（恒星、行星、人造卫星）生成专属感性文案
    const copyStr = window.generateCopy(currentObj, currentConfig.language);
    
    // 格式化展示参数
    const altFixed = parseFloat(currentObj.altitude).toFixed(3); // 仰角精确到小数点后3位
    // 天体的展示名称：优先使用 ID，其次是本地化名称，并统一转为大写
    const displayId = currentObj.id ? currentObj.id.toUpperCase() : (currentObj.nameJa || currentObj.nameZhHans || currentObj.name).toUpperCase();
    
    // 根据天体类型的不同，底部渲染的数据侧重点不同
    if (currentObj.isSatellite) {
        // 人造卫星：展示名字、仰角、以及它离地球表面的【距离】
        metaInfo.innerHTML = `${currentObj.name.toUpperCase()} &nbsp;&middot;&nbsp; ${t.alt} ${altFixed}&deg; &nbsp;&middot;&nbsp; ${t.range} ${currentObj.rangeKm || currentObj.distanceStr}`;
    } else {
        // 恒星/行星：计算并展示【天顶偏角】(Zenith Offset，90度减去当前仰角)，在天文学语境下更具美感
        const offZenith = (90 - parseFloat(currentObj.altitude)).toFixed(3);
        metaInfo.innerHTML = `${displayId} &nbsp;&middot;&nbsp; ${t.alt} ${altFixed}&deg; &nbsp;&middot;&nbsp; ${t.zenithOffset} ${offZenith}&deg;`;
    }
    
    // 将生成的感性文案赋值给页面中间的主元素
    mainCopy.textContent = copyStr;
    // 索引递增，为下一次呼吸动画准备下一个天体
    candidateIndex++;
}

/**
 * 整个屏保前端环境的初始化入口。
 * 当 DOM 树构建完毕后触发。
 */
document.addEventListener("DOMContentLoaded", async () => {
    // 在数据加载期间展示优雅的 Loading 提示
    document.getElementById("meta-info").textContent = "LOADING DEEP SPACE CATALOGS...";
    
    // WKWebView 原生通信机制：如果在页面加载前 Swift 端已经注入了配置，这里进行合并覆盖
    if (window.initialConfig) {
        currentConfig = Object.assign(currentConfig, window.initialConfig);
    }
    
    // 异步等待所有繁重的天文数据（恒星坐标库、回退卫星数据、星座数据等）在本地解析完成
    await window.initAstronomyData();
    
    // 剥离了旧版本的阻断验证，无论目前位置是否确切，都强行启动播报逻辑
    applyConfig();
});
