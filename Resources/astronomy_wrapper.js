import { constellations } from './data/constellations.js';

let starData = [];
let hygData = [];
let satelliteData = [];
let dataLoaded = false;

// 异步加载本地数据
export async function initAstronomyData() {
    try {
        const [stars, hyg, sats] = await Promise.all([
            fetch('data/stars.json').then(r => r.json()),
            fetch('data/hyg_stars.json').then(r => r.json()),
            fetch('data/satellites_fallback.json').then(r => r.json())
        ]);
        starData = stars;
        hygData = hyg;
        satelliteData = sats;
        dataLoaded = true;
        console.log("Astronomy data loaded:", { stars: stars.length, hyg: hyg.length, sats: sats.length });
    } catch (e) {
        console.error("Failed to load astronomy data:", e);
    }
}

// 核心过滤推演算法
export function getZenithCandidates(lat, lon, date) {
    if (!dataLoaded || typeof Astronomy === 'undefined' || typeof satellite === 'undefined') {
        return [];
    }

    const observerLat = parseFloat(lat);
    const observerLon = parseFloat(lon);
    
    const observer = Astronomy.MakeObserver(observerLat, observerLon, 0);
    const time = Astronomy.MakeTime(date);
    
    let candidates = [];

    // --- 1. 恒星处理 (预过滤 + 精确计算) ---
    const processStar = (obj) => {
        // 预过滤：如果赤纬（Dec）与当地纬度差距超过 30 度，其最高高度角都不可能达到 60 度
        if (Math.abs(observerLat - obj.dec) > 30.0) {
            return;
        }

        try {
            const hor = Astronomy.Horizon(time, observer, obj.ra, obj.dec, "normal");
            if (hor.altitude >= 60.0) {
                // 星座翻译转换
                let conKey = obj.con || obj.constellation; 
                let dict = null;
                if (conKey && constellations[conKey]) {
                    dict = constellations[conKey];
                }

                candidates.push({
                    type: 'star',
                    name: obj.name || `HIP ${obj.id}`,
                    nameZhHans: obj.name || `HIP ${obj.id}`,
                    nameZhHant: obj.name || `HIP ${obj.id}`,
                    nameJa: obj.name || `HIP ${obj.id}`,
                    constellation: dict ? dict.en : conKey,
                    constellationZhHans: dict ? dict.zh : conKey,
                    constellationZhHant: dict ? dict.zh : conKey,
                    constellationJa: dict ? dict.ja : conKey,
                    altitude: hor.altitude.toFixed(1),
                    azimuth: hor.azimuth.toFixed(1),
                    distLy: obj.distance || obj.distanceLy || 0,
                    mag: obj.mag
                });
            }
        } catch (e) {
            console.error(`Error calculating star ${obj.id}:`, e);
        }
    };

    // 遍历少量著名亮星
    starData.forEach(processStar);
    
    // 如果亮星太少，继续遍历 HYG 暗星星表
    // 为避免一帧计算量过大，其实已经通过 Dec 预过滤削减了 2/3 数据
    hygData.forEach(processStar);

    // --- 2. 航天器处理 (SGP4 TLE 推演) ---
    const gmst = satellite.gstime(date);
    const observerGd = {
        longitude: satellite.degreesToRadians(observerLon),
        latitude: satellite.degreesToRadians(observerLat),
        height: 0.0 // 海拔，这里假设为0
    };

    for (let satObj of satelliteData) {
        try {
            const satrec = satellite.twoline2satrec(satObj.line1, satObj.line2);
            const positionAndVelocity = satellite.propagate(satrec, date);
            const positionEci = positionAndVelocity.position;
            
            if (!positionEci) continue; // TLE 无法计算此时刻

            // ECI to ECF, then Look Angles
            const positionEcf = satellite.eciToEcf(positionEci, gmst);
            const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);
            
            const alt = satellite.radiansToDegrees(lookAngles.elevation);
            const az = satellite.radiansToDegrees(lookAngles.azimuth);

            if (alt >= 60.0) {
                // 计算距离 (km)
                const rangeKm = lookAngles.range;
                candidates.push({
                    type: 'satellite',
                    name: satObj.name,
                    nameZhHans: satObj.name,
                    nameZhHant: satObj.name,
                    nameJa: satObj.name,
                    altitude: alt.toFixed(1),
                    azimuth: az.toFixed(1),
                    rangeKm: rangeKm.toFixed(0)
                });
            }
        } catch (e) {
            console.error(`Error calculating satellite ${satObj.satelliteId}:`, e);
        }
    }

    // 按高度角从高到低排序 (最靠近天顶的排前面)
    candidates.sort((a, b) => parseFloat(b.altitude) - parseFloat(a.altitude));
    
    // 我们可能获取到了很多 HYG 暗星，只保留最亮或最高的前 20 颗，防止内存堆积
    return candidates.slice(0, 20);
}
