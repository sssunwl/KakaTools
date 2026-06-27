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
        const url = `${KMB_API_BASE}/stop-eta/${stopId}`;
        console.log('Fetching:', url);

        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`API 響應: ${response.status}`);
            return null;
        }

        const data = await response.json();
        console.log(`API 返回 ${stopId}:`, data);

        if (!Array.isArray(data.data)) {
            console.warn(`data.data 不是陣列:`, data);
            return null;
        }

        const filtered = data.data.filter(item => String(item.route) === String(BUS_CONFIG.route));
        console.log(`篩選條件: route === ${BUS_CONFIG.route}`)
        console.log(`全部項目的 route:`, data.data.map(x => x.route))
        console.log(`Route ${BUS_CONFIG.route} 的班次:`, filtered);

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
