// KMB 實時 API 處理（官方 data.etabus.gov.hk）

const BUS_CONFIG = {
    route: '53',
    stops: {
        outbound: 'BCFD8D6861CF7273', // 新生村（YL623）往荃灣方向
        inbound: 'FF6FB7F4F33970EE'   // 新生村（YL103）回程方向
    }
};

const KMB_API_BASE = 'https://data.etabus.gov.hk/v1/transport/kmb';

function formatTime(seconds) {
    if (!seconds || seconds < 0) return '-';
    const minutes = Math.round(seconds / 60);
    if (minutes === 0) return '即將到達';
    if (minutes === 1) return '1 分鐘';
    return `${minutes} 分鐘`;
}

function getETAClass(seconds) {
    if (!seconds) return '';
    const minutes = Math.round(seconds / 60);
    if (minutes === 0) return 'arriving';
    if (minutes <= 3) return 'soon';
    return '';
}

function calculateSecondsUntilETA(etaString) {
    if (!etaString) return null;
    const etaTime = new Date(etaString);
    const now = new Date();
    return (etaTime - now) / 1000;
}

// 從 KMB API 獲取特定站點的實時到站時間
async function fetchStopETA(stopId) {
    if (!stopId) return null;

    try {
        const response = await fetch(`${KMB_API_BASE}/stop-eta/${stopId}`);
        if (!response.ok) return null;

        const data = await response.json();
        if (!Array.isArray(data.data)) return null;

        const filtered = data.data.filter(item => String(item.route) === String(BUS_CONFIG.route));

        return filtered
            .map(item => {
                const seconds = calculateSecondsUntilETA(item.eta);
                return {
                    eta: seconds,
                    formattedETA: formatTime(seconds),
                    className: getETAClass(seconds),
                    dest: item.dest_tc
                };
            })
            .filter(item => item.eta > -10)
            .slice(0, 3);
    } catch (error) {
        console.error(`ETA 查詢失敗: ${stopId}`, error);
        return null;
    }
}

// 獲取兩個方向的實時數據
async function fetchAllBusData() {
    try {
        const [outboundData, inboundData] = await Promise.all([
            fetchStopETA(BUS_CONFIG.stops.outbound),
            fetchStopETA(BUS_CONFIG.stops.inbound)
        ]);

        return {
            outbound: outboundData || [],
            inbound: inboundData || [],
            timestamp: new Date()
        };
    } catch (error) {
        console.error('獲取巴士數據失敗:', error);
        return null;
    }
}

function formatLastUpdated(date) {
    if (!date) return '-';
    return date.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 港鐵巴士 API
const MTR_BUS_API = 'https://rt.data.gov.hk/v1/transport/mtr/bus/getSchedule';

async function fetchMTRBusETA(routeName, targetStopId) {
    if (!routeName || !targetStopId) return null;

    try {
        const response = await fetch(MTR_BUS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: 'zh', routeName: routeName })
        });

        if (!response.ok) return null;

        const data = await response.json();
        const targetStop = (data.busStop || []).find(s => s.busStopId === targetStopId);

        if (!targetStop || !targetStop.bus) return null;

        return targetStop.bus
            .slice(0, 3)
            .map(bus => ({
                time: bus.departureTimeText || '-',
                secondsToGo: parseInt(bus.departureTimeInSecond) || 0
            }))
            .filter(bus => bus.secondsToGo >= 0);
    } catch (error) {
        console.error(`MTR Bus ${routeName} ETA fetch failed:`, error);
        return null;
    }
}

// 港鐵列車 API
const MTR_TRAIN_API = 'https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php';

async function fetchMTRTrainETA(line, station) {
    if (!line || !station) return null;

    try {
        const params = new URLSearchParams({
            line: line,
            sta: station,
            lang: 'TC'
        });

        const response = await fetch(`${MTR_TRAIN_API}?${params}`);
        if (!response.ok) return null;

        const data = await response.json();
        if (data.status !== 1) return null;

        const key = `${line}-${station}`;
        const trains = data.data?.[key];

        if (!trains) return null;

        return {
            UP: (trains.UP || []).slice(0, 3).map(t => ({
                ttnt: t.ttnt,
                dest: t.dest,
                plat: t.plat
            })),
            DOWN: (trains.DOWN || []).slice(0, 3).map(t => ({
                ttnt: t.ttnt,
                dest: t.dest,
                plat: t.plat
            }))
        };
    } catch (error) {
        console.error(`MTR Train ${line}-${station} fetch failed:`, error);
        return null;
    }
}
