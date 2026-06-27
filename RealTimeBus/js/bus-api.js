// KMB 實時 API 處理

const BUS_CONFIG = {
    route: '53',
    stops: {
        outbound: 'TI01-N-1150-0', // 去程（暫時使用已知編號）
        inbound: 'TI01-S-1150-0'   // 回程（試試看這個編號）
    }
};

// KMB API 基礎 URL
const KMB_API_BASE = 'https://data.etabus.gov.hk/v1/eta';

// 格式化時間（秒轉分鐘）
function formatTime(seconds) {
    if (!seconds || seconds < 0) return '-';
    const minutes = Math.round(seconds / 60);
    if (minutes === 0) return '即將到達';
    if (minutes === 1) return '1 分鐘';
    return `${minutes} 分鐘`;
}

// 獲取 ETA 類別（根據時間判斷顏色）
function getETAClass(seconds) {
    if (!seconds) return '';
    const minutes = Math.round(seconds / 60);
    if (minutes === 0) return 'arriving';
    if (minutes <= 3) return 'soon';
    return '';
}

// 從 KMB API 獲取實時到站時間
async function fetchBusETA(stopCode) {
    try {
        const url = `${KMB_API_BASE}/${stopCode}/${BUS_CONFIG.route}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.warn(`API 響應狀態: ${response.status} for ${stopCode}`);
            return null;
        }

        const data = await response.json();

        // KMB API 返回格式: data 陣列中每項包含 eta（時間戳）
        if (data && Array.isArray(data.data)) {
            return data.data.map(item => {
                if (item.eta) {
                    const etaTime = new Date(item.eta);
                    const now = new Date();
                    const secondsDiff = (etaTime - now) / 1000;

                    return {
                        eta: secondsDiff > 0 ? secondsDiff : null,
                        formattedETA: formatTime(secondsDiff),
                        className: getETAClass(secondsDiff),
                        raw: item
                    };
                }
                return null;
            }).filter(item => item !== null);
        }

        return null;
    } catch (error) {
        console.error(`獲取 ${stopCode} 的 ETA 失敗:`, error);
        return null;
    }
}

// 獲取兩個方向的實時數據
async function fetchAllBusData() {
    try {
        const [outboundData, inboundData] = await Promise.all([
            fetchBusETA(BUS_CONFIG.stops.outbound),
            fetchBusETA(BUS_CONFIG.stops.inbound)
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

// 格式化最後更新時間
function formatLastUpdated(date) {
    if (!date) return '-';
    return date.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}
