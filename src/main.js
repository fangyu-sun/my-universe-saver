import '../style.css'
import { getZenithCandidates, updateCandidateAltitude } from './astronomy.js'
import { generateCopy } from './copywriter.js'

let activeSatellites = [];

async function loadActiveSatellites() {
  try {
    const response = await fetch('https://tle.ivanstanojevic.me/api/tle/?page-size=50&sort=popularity');
    const data = await response.json();
    if (data && data.member && data.member.length > 0) {
      activeSatellites = data.member.map(sat => ({
        satelliteId: sat.satelliteId,
        name: sat.name,
        line1: sat.line1,
        line2: sat.line2
      }));
    }
  } catch (e) {
    console.warn("Failed to fetch dynamic TLEs, falling back to local database.", e);
  }
  
  try {
    const responseStarlink = await fetch('https://tle.ivanstanojevic.me/api/tle/?search=STARLINK&page-size=40');
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

loadActiveSatellites();

// ==========================================
// 1. Runtime Mode & Settings Adapter
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const injected = window.zenithSettings || {};
const isScreensaverMode = injected.mode === 'screensaver' || urlParams.get('mode') === 'screensaver';

const settings = {
  lang: injected.lang || urlParams.get('lang') || localStorage.getItem('zenith_lang') || 'zh',
  fontSize: injected.fontSize || urlParams.get('fontSize') || 'normal',
  brightness: injected.brightness || urlParams.get('brightness') || 'normal',
  refreshRate: injected.refreshRate || urlParams.get('refreshRate') || 'normal',
  lat: injected.lat ? parseFloat(injected.lat) : (urlParams.get('lat') ? parseFloat(urlParams.get('lat')) : null),
  lon: injected.lon ? parseFloat(injected.lon) : (urlParams.get('lon') ? parseFloat(urlParams.get('lon')) : null),
  city: injected.city || urlParams.get('city') || null
};

if (!isScreensaverMode) {
  localStorage.setItem('zenith_lang', settings.lang);
}
let currentLang = settings.lang;

// Map settings to DOM for visual adaptations if needed
document.documentElement.setAttribute('data-font-size', settings.fontSize);
document.documentElement.setAttribute('data-brightness', settings.brightness);
document.documentElement.setAttribute('data-refresh-rate', settings.refreshRate);


// ==========================================
// 2. View Controller
// ==========================================
const introScreen = document.getElementById('intro');
const loadingScreen = document.getElementById('loading');
const broadcasterScreen = document.getElementById('broadcaster');
const fallbackScreen = document.getElementById('fallback');

function switchScreen(screenEl) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  if (screenEl) screenEl.classList.add('active');
}

function showIntro() { switchScreen(introScreen); }
function showBroadcaster() { switchScreen(broadcasterScreen); }
function showFallback() { switchScreen(fallbackScreen); }
function showLoading() { switchScreen(loadingScreen); }


// ==========================================
// 3. I18n & UI
// ==========================================
const UI_TRANSLATIONS = {
  zh: {
    introText: "此应用需要获取地理位置，<br>以计算此时此刻您上方的宇宙状态。",
    startBtn: "开启连接",
    geoAcquiring: "正在解析空间坐标...",
    fallbackCity: "北京 (默认位置)",
    cachedCity: "缓存位置",
    geoError: "您的浏览器不支持获取地理位置。",
    cityUnknown: "未知地点",
    alt: "仰角",
    zenithOffset: "天顶偏角",
    range: "距离",
    lat: "纬度",
    lon: "经度"
  },
  en: {
    introText: "This application requires location access<br>to calculate the cosmic state directly above you right now.",
    startBtn: "Connect",
    geoAcquiring: "Acquiring Spatial Coordinates...",
    fallbackCity: "Beijing (Default Location)",
    cachedCity: "Cached Location",
    geoError: "Your browser does not support geolocation.",
    cityUnknown: "Unknown Location",
    alt: "ALTITUDE",
    zenithOffset: "ZENITH OFFSET",
    range: "RANGE",
    lat: "LAT",
    lon: "LON"
  },
  ja: {
    introText: "このアプリは現在地情報を取得し、<br>今この瞬間にあなたの真上にある宇宙の状態を计算します。",
    startBtn: "接続開始",
    geoAcquiring: "空間座標を解析中...",
    fallbackCity: "北京 (デフォルト位置)",
    cachedCity: "キャッシュされた位置",
    geoError: "お使いのブラウザは位置情報の取得に対応していません。",
    cityUnknown: "未知の場所",
    alt: "仰角",
    zenithOffset: "天頂角",
    range: "距離",
    lat: "緯度",
    lon: "経度"
  }
};

function applyLanguage() {
  const t = UI_TRANSLATIONS[currentLang];
  
  if (currentLang === 'en') {
    document.body.classList.add('lang-en');
    document.body.classList.remove('lang-zh', 'lang-ja');
  } else if (currentLang === 'ja') {
    document.body.classList.add('lang-ja');
    document.body.classList.remove('lang-en', 'lang-zh');
  } else {
    document.body.classList.add('lang-zh');
    document.body.classList.remove('lang-en', 'lang-ja');
  }
  
  const introTextEl = document.getElementById('intro-text');
  const startBtnEl = document.getElementById('start-btn');
  
  if (introTextEl) introTextEl.innerHTML = t.introText;
  if (startBtnEl) startBtnEl.textContent = t.startBtn;
  
  document.querySelectorAll('.lang-inline-opt').forEach(btn => {
    if (btn.getAttribute('data-lang') === currentLang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

applyLanguage();

document.querySelectorAll('.lang-inline-opt').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const selectedLang = e.currentTarget.getAttribute('data-lang');
    if (selectedLang === currentLang) return;
    
    document.querySelectorAll('.lang-inline-opt').forEach(b => b.classList.remove('active'));
    document.querySelectorAll(`.lang-inline-opt[data-lang="${selectedLang}"]`).forEach(el => el.classList.add('active'));
    
    currentLang = selectedLang;
    if (!isScreensaverMode) {
      localStorage.setItem('zenith_lang', selectedLang);
    }
    
    const introTextEl = document.getElementById('intro-text');
    const startBtnEl = document.getElementById('start-btn');
    const mainCopyEl = document.getElementById('main-copy');
    const locationTimeInfoEl = document.getElementById('location-time-info');
    const metaInfoEl = document.getElementById('meta-info');
    
    const elementsToFade = [introTextEl, startBtnEl, mainCopyEl, locationTimeInfoEl, metaInfoEl];
    
    elementsToFade.forEach(el => {
      if (el) el.classList.add('text-breath-out');
    });
    
    setTimeout(() => {
      applyLanguage();
      
      if (typeof window.triggerZenithUpdate === 'function') {
        window.triggerZenithUpdate();
      }
      if (typeof window.triggerGeocodeRefine === 'function') {
        window.triggerGeocodeRefine();
      }
      
      elementsToFade.forEach(el => {
        if (el) el.classList.remove('text-breath-out');
      });
    }, 2500);
  });
});


// ==========================================
// 4. Cosmic Engine
// ==========================================
const mainCopyEl = document.getElementById('main-copy');
const metaInfoEl = document.getElementById('meta-info');
const locationTimeInfoEl = document.getElementById('location-time-info');

// Expose a function to inject fresh coords dynamically if needed
window.updateCoordinatesDynamic = null;

function startBroadcasterSession(initialLat, initialLon, initialCity, isDynamicCity) {
  let currentLat = initialLat;
  let currentLon = initialLon;
  let cityString = initialCity || "";
  let isCityDynamic = isDynamicCity;

  let domeCandidates = [];
  let currentDomeIndex = 0;

  function updateTime() {
    const date = new Date();
    const localeStr = currentLang === 'zh' ? 'zh-CN' : currentLang === 'ja' ? 'ja-JP' : 'en-US';
    const timeString = date.toLocaleTimeString(localeStr, { hour: '2-digit', minute: '2-digit', hour12: false });
    
    let displayCity = cityString;
    if (isCityDynamic) {
      displayCity = currentLang === 'zh' ? '北京' : currentLang === 'ja' ? '北京' : 'Beijing';
      if (!isScreensaverMode && localStorage.getItem('zenith_last_lat') && !localStorage.getItem('zenith_last_city')) {
        displayCity = UI_TRANSLATIONS[currentLang].cachedCity;
      }
    }

    if (locationTimeInfoEl) {
      locationTimeInfoEl.textContent = `${displayCity} · ${timeString}`;
    }

    if (domeCandidates && domeCandidates.length > 0) {
      const currentObj = domeCandidates[currentDomeIndex % domeCandidates.length];
      if (currentObj) {
        updateCandidateAltitude(currentObj, currentLat, currentLon, date);
        const currentT = UI_TRANSLATIONS[currentLang];
        const offZenith = (90 - currentObj.altitude).toFixed(3);
        const displayId = currentObj.id ? currentObj.id.toUpperCase() : 'STAR';
        if (currentObj.isSatellite) {
          metaInfoEl.innerHTML = `${currentObj.name.toUpperCase()} &nbsp;&middot;&nbsp; ${currentT.alt} ${currentObj.altitude.toFixed(3)}&deg; &nbsp;&middot;&nbsp; ${currentT.range} ${currentObj.distanceStr}`;
        } else {
          metaInfoEl.innerHTML = `${displayId} &nbsp;&middot;&nbsp; ${currentT.alt} ${currentObj.altitude.toFixed(3)}&deg; &nbsp;&middot;&nbsp; ${currentT.zenithOffset} ${offZenith}&deg;`;
        }
      }
    }
  }

  function fetchDomeCandidates() {
    const date = new Date();
    try {
      domeCandidates = getZenithCandidates(currentLat, currentLon, date, activeSatellites) || [];
    } catch (e) {
      console.error(e);
      domeCandidates = [];
    }
  }

  function renderCurrentCandidate() {
    if (!domeCandidates || domeCandidates.length === 0) {
      const currentT = UI_TRANSLATIONS[currentLang];
      metaInfoEl.innerHTML = `${currentT.lat} ${currentLat.toFixed(2)} &nbsp;&middot;&nbsp; ${currentT.lon} ${currentLon.toFixed(2)}`;
      mainCopyEl.textContent = "";
      return;
    }
    
    if (currentDomeIndex >= domeCandidates.length) {
      currentDomeIndex = 0;
    }

    const currentObj = domeCandidates[currentDomeIndex];
    const copy = generateCopy(currentObj, currentLang);
    mainCopyEl.textContent = copy;
    
    const currentT = UI_TRANSLATIONS[currentLang];
    const offZenith = (90 - currentObj.altitude).toFixed(3);
    const displayId = currentObj.id ? currentObj.id.toUpperCase() : 'STAR';
    
    if (currentObj.isSatellite) {
      metaInfoEl.innerHTML = `${currentObj.name.toUpperCase()} &nbsp;&middot;&nbsp; ${currentT.alt} ${currentObj.altitude.toFixed(3)}&deg; &nbsp;&middot;&nbsp; ${currentT.range} ${currentObj.distanceStr}`;
    } else {
      metaInfoEl.innerHTML = `${displayId} &nbsp;&middot;&nbsp; ${currentT.alt} ${currentObj.altitude.toFixed(3)}&deg; &nbsp;&middot;&nbsp; ${currentT.zenithOffset} ${offZenith}&deg;`;
    }
  }

  let carouselIntervalId = null;
  let isTransitioning = false;

  function carouselTick(isManual = false) {
    if (domeCandidates.length <= 1 || isTransitioning) return;
    
    isTransitioning = true;
    const transitionDuration = isManual ? 600 : 2500;
    
    if (isManual) {
      mainCopyEl.classList.add('fast-transition');
      metaInfoEl.classList.add('fast-transition');
    }
    
    mainCopyEl.classList.add('text-breath-out');
    metaInfoEl.classList.add('text-breath-out');
    
    setTimeout(() => {
      currentDomeIndex++;
      if (currentDomeIndex >= domeCandidates.length) {
        currentDomeIndex = 0;
      }
      renderCurrentCandidate();
      
      mainCopyEl.classList.remove('text-breath-out');
      metaInfoEl.classList.remove('text-breath-out');
      
      setTimeout(() => {
        isTransitioning = false;
        if (isManual) {
          mainCopyEl.classList.remove('fast-transition');
          metaInfoEl.classList.remove('fast-transition');
        }
      }, transitionDuration);
    }, transitionDuration);
  }

  function startCarousel() {
    if (carouselIntervalId) clearInterval(carouselIntervalId);
    carouselIntervalId = setInterval(carouselTick, 10000);
  }

  broadcasterScreen.addEventListener('click', (e) => {
    if (e.target.closest('.lang-selector-top-right')) return;
    if (!isTransitioning && domeCandidates.length > 1) {
      carouselTick(true);
      startCarousel();
    }
  });

  window.triggerZenithUpdate = () => {
    updateTime();
    renderCurrentCandidate();
  };

  window.triggerGeocodeRefine = function() {
    if (currentLat && currentLon) {
      fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${currentLat}&longitude=${currentLon}&localityLanguage=${currentLang}`)
        .then(res => res.json())
        .then(data => {
          cityString = data.city || data.locality || data.principalSubdivision || UI_TRANSLATIONS[currentLang].cityUnknown;
          if (!isScreensaverMode) localStorage.setItem('zenith_last_city', cityString);
          isCityDynamic = false;
          updateTime();
        })
        .catch(() => {});
    }
  };

  // Provide a method to instantly inject fresh coordinates
  window.updateCoordinatesDynamic = function(freshLat, freshLon) {
    currentLat = freshLat;
    currentLon = freshLon;
    window.triggerGeocodeRefine();
    fetchDomeCandidates();
    currentDomeIndex = 0;
    renderCurrentCandidate();
  };

  fetchDomeCandidates();
  updateTime();
  renderCurrentCandidate();
  showBroadcaster();

  setInterval(updateTime, 1000);
  setInterval(fetchDomeCandidates, 60000);
  
  setTimeout(() => {
    carouselTick();
    startCarousel();
  }, 2500);

  // Attempt reverse geocoding on boot
  window.triggerGeocodeRefine();
}


// ==========================================
// 5. Location Provider & Bootstrapping
// ==========================================
if (isScreensaverMode) {
  // Screensaver Mode: Skip intro, skip geolocation API, use passed settings
  if (settings.lat !== null && settings.lon !== null && !isNaN(settings.lat) && !isNaN(settings.lon)) {
    startBroadcasterSession(settings.lat, settings.lon, settings.city || `${settings.lat.toFixed(2)}, ${settings.lon.toFixed(2)}`, false);
  } else {
    showFallback();
  }
} else {
  // Web Mode: Standard original workflow
  showIntro();
  
  const startBtn = document.getElementById('start-btn');
  startBtn.addEventListener('click', () => {
    const t = UI_TRANSLATIONS[currentLang];
    if (!navigator.geolocation) {
      alert(t.geoError);
      return;
    }

    startBtn.textContent = t.geoAcquiring;
    startBtn.style.pointerEvents = "none";

    // Start with cached or default immediately
    const cachedLatStr = localStorage.getItem('zenith_last_lat');
    const cachedLonStr = localStorage.getItem('zenith_last_lon');
    
    let currentLat = 39.9042;
    let currentLon = 116.4074;
    let cityString = t.fallbackCity;
    let isCityDynamic = true;

    if (cachedLatStr && cachedLonStr) {
      currentLat = parseFloat(cachedLatStr);
      currentLon = parseFloat(cachedLonStr);
      cityString = localStorage.getItem('zenith_last_city') || t.cachedCity;
      isCityDynamic = !localStorage.getItem('zenith_last_city');
    }

    setTimeout(() => {
      startBroadcasterSession(currentLat, currentLon, cityString, isCityDynamic);
      
      // Query for fresh coordinates in the background silently
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const freshLat = position.coords.latitude;
          const freshLon = position.coords.longitude;
          localStorage.setItem('zenith_last_lat', freshLat);
          localStorage.setItem('zenith_last_lon', freshLon);
          
          if (window.updateCoordinatesDynamic) {
             window.updateCoordinatesDynamic(freshLat, freshLon);
          }
        },
        (error) => {
          console.warn("Background geolocation refresh failed.", error);
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
      );
    }, 1500);
  });
}
