// constellations available via window.constellations

let starData = [];
let hygData = [];
let satelliteData = [];
let dataLoaded = false;

// 异步加载本地数据
window.initAstronomyData = async function() {
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

const planets = [
    { id: 'Sun', name: '太阳', nameEn: 'Sun', nameJa: '太陽', isPlanet: true },
    { id: 'Moon', name: '月亮', nameEn: 'Moon', nameJa: '月', isPlanet: true },
    { id: 'Jupiter', name: '木星', nameEn: 'Jupiter', nameJa: '木星', isPlanet: true },
    { id: 'Venus', name: '金星', nameEn: 'Venus', nameJa: '金星', isPlanet: true },
    { id: 'Mars', name: '火星', nameEn: 'Mars', nameJa: '火星', isPlanet: true },
    { id: 'Saturn', name: '土星', nameEn: 'Saturn', nameJa: '土星', isPlanet: true }
];

window.getZenithCandidates = function(lat, lon, date, activeSatellites) {
    if (!dataLoaded || typeof Astronomy === 'undefined' || typeof satellite === 'undefined') {
        return [];
    }

    const observerLat = parseFloat(lat);
    const observerLon = parseFloat(lon);
    
    const observer = Astronomy.MakeObserver(observerLat, observerLon, 0);
    const time = Astronomy.MakeTime(date);
    
    let candidates = [];

    // Evaluate Planets
    for (const p of planets) {
        try {
            const body = Astronomy.Body[p.id];
            const eq = Astronomy.Equator(body, time, observer, true, true);
            const hor = Astronomy.Horizon(time, observer, eq.ra, eq.dec, 'normal');

            if (hor.altitude >= 60) {
                const distKm = eq.vec.Length() * 1.495978707e8; // AU to km (using vec length as distance approx)
                let distStr = "";
                if (distKm > 1e8) {
                    distStr = (distKm / 1e8).toFixed(1) + " 亿公里";
                } else if (distKm > 1e4) {
                    distStr = (distKm / 1e4).toFixed(1) + " 万公里";
                } else {
                    distStr = distKm.toFixed(0) + " 公里";
                }

                candidates.push({
                    type: 'planet',
                    id: p.id,
                    name: p.nameEn,
                    nameZhHans: p.name,
                    nameZhHant: p.name,
                    nameJa: p.nameJa,
                    constellation: 'Solar System',
                    constellationZhHans: '太阳系',
                    constellationZhHant: '太陽系',
                    constellationJa: '太陽系',
                    altitude: hor.altitude.toFixed(1),
                    azimuth: hor.azimuth.toFixed(1),
                    distLy: 0,
                    distanceStr: distStr,
                    isPlanet: true
                });
            }
        } catch (e) {
            console.error(`Error calculating planet ${p.id}:`, e);
        }
    }

    // Evaluate Stars
    const processStar = (obj, isFamous) => {
        // 预过滤：如果赤纬（Dec）与当地纬度差距超过 30 度，其最高高度角都不可能达到 60 度
        if (Math.abs(observerLat - obj.dec) > 30.0) return;

        try {
            const hor = Astronomy.Horizon(time, observer, obj.ra, obj.dec, "normal");
            if (hor.altitude >= 60.0) {
                let conKey = obj.con || obj.constellation; 
                let dict = window.constellations && window.constellations[conKey] ? window.constellations[conKey] : null;

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
                    isFamous: isFamous,
                    isSatellite: false
                });
            }
        } catch (e) {
            console.error(`Error calculating star ${obj.id}:`, e);
        }
    };

    starData.forEach(s => processStar(s, true));
    hygData.forEach(s => processStar(s, false));

    // Evaluate Satellites
    const satsToEvaluate = (activeSatellites && activeSatellites.length > 0) ? activeSatellites : satelliteData;
    const gmst = satellite.gstime(date);
    const observerGd = {
        longitude: satellite.degreesToRadians(observerLon),
        latitude: satellite.degreesToRadians(observerLat),
        height: 0.0
    };

    for (const satObj of satsToEvaluate) {
        try {
            const satrec = satellite.twoline2satrec(satObj.line1, satObj.line2);
            const positionAndVelocity = satellite.propagate(satrec, date);
            const positionEci = positionAndVelocity.position;
            
            if (!positionEci) continue;

            const positionEcf = satellite.eciToEcf(positionEci, gmst);
            const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);
            
            const alt = satellite.radiansToDegrees(lookAngles.elevation);
            const az = satellite.radiansToDegrees(lookAngles.azimuth);

            if (alt >= 60.0) {
                candidates.push({
                    type: 'satellite',
                    id: satObj.satelliteId ? `sat_${satObj.satelliteId}` : satObj.name,
                    name: satObj.name,
                    altitude: alt.toFixed(1),
                    azimuth: az.toFixed(1),
                    rangeKm: lookAngles.range.toFixed(0),
                    isSatellite: true,
                    isFamous: false,
                    isPlanet: false
                });
            }
        } catch (e) {
            console.error(`Error calculating satellite ${satObj.name}:`, e);
        }
    }

    // Scoring system
    candidates.forEach(c => {
        let weight = 1.0;
        if (c.isSatellite) weight = 2.0;
        else if (c.id === 'Moon' || c.id === 'Sun') weight = 1.5;
        else if (c.isPlanet) weight = 1.3;
        else if (c.isFamous) weight = 1.2;
        else weight = 1.0;

        c.score = (parseFloat(c.altitude) / 90) * weight;
    });

    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, 20);
};
