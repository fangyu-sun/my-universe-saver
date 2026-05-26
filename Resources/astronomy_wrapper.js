// 依赖: astronomy.browser.min.js (全局暴露 Astronomy)
// 依赖: star_catalog.js (全局暴露 starCatalog)

function getZenithCandidates(lat, lon, date) {
    if (typeof Astronomy === 'undefined') {
        console.error("Astronomy engine not loaded");
        return [];
    }

    const observer = Astronomy.MakeObserver(parseFloat(lat), parseFloat(lon), 0);
    const time = Astronomy.MakeTime(date);
    
    let candidates = [];

    for (let obj of starCatalog) {
        let alt = 0;
        let az = 0;

        if (obj.type === 'planet') {
            // Planet calculation
            try {
                const eq = Astronomy.Equator(obj.id, time, observer, true, true);
                const hor = Astronomy.Horizon(time, observer, eq.ra, eq.dec, "normal");
                alt = hor.altitude;
                az = hor.azimuth;
            } catch (e) {
                console.error(`Error calculating planet ${obj.id}:`, e);
                continue;
            }
        } else if (obj.type === 'star') {
            // Star calculation
            try {
                const hor = Astronomy.Horizon(time, observer, obj.ra, obj.dec, "normal");
                alt = hor.altitude;
                az = hor.azimuth;
            } catch (e) {
                console.error(`Error calculating star ${obj.id}:`, e);
                continue;
            }
        }

        // 过滤天顶 60° 以内的天体
        if (alt >= 60.0) {
            // 计算天顶偏移量 (90 - 高度角)
            const zenithOffset = 90.0 - alt;
            candidates.push({
                ...obj,
                altitude: alt.toFixed(1),
                azimuth: az.toFixed(1),
                zenithOffset: zenithOffset.toFixed(1)
            });
        }
    }

    // 按高度角从高到低排序 (最靠近天顶的排前面)
    candidates.sort((a, b) => parseFloat(b.altitude) - parseFloat(a.altitude));
    
    return candidates;
}
