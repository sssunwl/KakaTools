// RealTimeBus 主應用邏輯

let updateInterval = null;

function showError(stationId, message) {
    const container = document.getElementById(`${stationId}-error`);
    container.innerHTML = `⚠️ ${message}`;
    container.classList.add('show');
}

function clearError(stationId) {
    const container = document.getElementById(`${stationId}-error`);
    container.innerHTML = '';
    container.classList.remove('show');
}

function toggleStation(stationId) {
    const container = document.getElementById(stationId);
    const btn = document.querySelector(`[data-station="${stationId}"]`);
    container.classList.toggle('hidden');
    btn.classList.toggle('collapsed');
}

async function updateAllStations() {
    updateXinshengcun();
    updateTianshui();
    updatePingxin();
}

async function updateXinshengcun() {
    const loadingId = 'xinshengcun-loading';
    const contentId = 'xinshengcun-content';
    const stationId = 'xinshengcun';

    document.getElementById(loadingId).style.display = 'block';
    document.getElementById(contentId).style.display = 'none';
    clearError(stationId);

    const [kmbData, mtrK75aData, mtrK75pData] = await Promise.all([
        fetchAllBusData(),
        fetchMTRBusETA('K75A', 'K75A-D020'),
        fetchMTRBusETA('K75P', 'K75P-D010')
    ]);

    if (!kmbData && !mtrK75aData && !mtrK75pData) {
        document.getElementById(loadingId).style.display = 'none';
        showError(stationId, '無法獲取實時數據，請稍候重試...');
        return;
    }

    let html = '<table class="bus-table"><tbody>';
    html += '<tr class="table-header"><td></td><td>最快</td><td>下一班</td><td>下下班</td></tr>';

    // K75A
    html += `<tr class="table-row mtr-row">
        <td class="route-badge badge-k75a">K75A</td>
        <td class="time-cell">${mtrK75aData?.[0]?.time || '-'}</td>
        <td class="time-cell">${mtrK75aData?.[1]?.time || '-'}</td>
        <td class="time-cell">${mtrK75aData?.[2]?.time || '-'}</td>
    </tr>`;

    // K75P
    html += `<tr class="table-row mtr-row">
        <td class="route-badge badge-k75p">K75P</td>
        <td class="time-cell">${mtrK75pData?.[0]?.time || '-'}</td>
        <td class="time-cell">${mtrK75pData?.[1]?.time || '-'}</td>
        <td class="time-cell">${mtrK75pData?.[2]?.time || '-'}</td>
    </tr>`;

    // KMB 53
    const outbound = kmbData?.outbound?.[0];
    const outbound2 = kmbData?.outbound?.[1];
    const outbound3 = kmbData?.outbound?.[2];
    const inbound = kmbData?.inbound?.[0];
    const inbound2 = kmbData?.inbound?.[1];
    const inbound3 = kmbData?.inbound?.[2];

    html += `<tr class="table-row kmb-badge">
        <td class="route-badge badge-53">53</td>
        <td colspan="3"></td>
    </tr>`;

    // 往荃灣
    html += `<tr class="table-row kmb-53">
        <td class="direction-label">📤 往荃灣</td>
        <td class="time-cell ${outbound?.className || ''}">${outbound?.formattedETA || '-'}</td>
        <td class="time-cell ${outbound2?.className || ''}">${outbound2?.formattedETA || '-'}</td>
        <td class="time-cell ${outbound3?.className || ''}">${outbound3?.formattedETA || '-'}</td>
    </tr>`;

    // 往元朗
    html += `<tr class="table-row kmb-53">
        <td class="direction-label">📥 往元朗</td>
        <td class="time-cell ${inbound?.className || ''}">${inbound?.formattedETA || '-'}</td>
        <td class="time-cell ${inbound2?.className || ''}">${inbound2?.formattedETA || '-'}</td>
        <td class="time-cell ${inbound3?.className || ''}">${inbound3?.formattedETA || '-'}</td>
    </tr>`;

    html += '</tbody></table>';

    document.getElementById(contentId).innerHTML = html;
    document.getElementById(loadingId).style.display = 'none';
    document.getElementById(contentId).style.display = 'block';
}

async function updatePingxin() {
    const loadingId = 'pingxin-loading';
    const contentId = 'pingxin-content';
    const stationId = 'pingxin';

    document.getElementById(loadingId).style.display = 'block';
    document.getElementById(contentId).style.display = 'none';
    clearError(stationId);

    try {
        // 並行獲取 KMB 和港鐵巴士數據
        const [kmbRes, k65Res] = await Promise.all([
            fetch('https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/2280D10BC985E036'),
            fetch('https://rt.data.gov.hk/v1/transport/mtr/bus/getSchedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: 'zh', routeName: 'K65' })
            })
        ]);

        const kmbData = await kmbRes.json();
        const k65Data = await k65Res.json();

        // 解析 KMB 53 和 276
        const route53 = (kmbData.data || []).filter(item => String(item.route) === '53' && item.dir === 'I').slice(0, 3);
        const route276 = (kmbData.data || []).filter(item => String(item.route) === '276' && item.dir === 'O').slice(0, 3);

        // 解析 K65
        const k65Stop = (k65Data.busStop || []).find(s => s.busStopId === 'K65-U090');
        const k65Buses = (k65Stop?.bus || []).slice(0, 3);

        let html = '<table class="bus-table"><tbody>';
        html += '<tr class="table-header"><td></td><td>最快</td><td>下一班</td><td>下下班</td></tr>';

        // 53
        html += `<tr class="table-row kmb-badge">
            <td class="route-badge badge-53">53</td>
            <td colspan="3"></td>
        </tr>`;
        html += `<tr class="table-row kmb-53">
            <td class="direction-label">📥 往元朗形點</td>
            <td class="time-cell ${route53[0] ? getETAClassKMB(route53[0].eta) : ''}">${route53[0] ? formatTime((new Date(route53[0].eta) - new Date()) / 1000) : '-'}</td>
            <td class="time-cell ${route53[1] ? getETAClassKMB(route53[1].eta) : ''}">${route53[1] ? formatTime((new Date(route53[1].eta) - new Date()) / 1000) : '-'}</td>
            <td class="time-cell ${route53[2] ? getETAClassKMB(route53[2].eta) : ''}">${route53[2] ? formatTime((new Date(route53[2].eta) - new Date()) / 1000) : '-'}</td>
        </tr>`;

        // 276
        html += `<tr class="table-row kmb-badge">
            <td class="route-badge" style="background: linear-gradient(135deg, #40e0d0 0%, #2bb8aa 100%);">276</td>
            <td colspan="3"></td>
        </tr>`;
        html += `<tr class="table-row kmb-53">
            <td class="direction-label">📤 往上水</td>
            <td class="time-cell ${route276[0] ? getETAClassKMB(route276[0].eta) : ''}">${route276[0] ? formatTime((new Date(route276[0].eta) - new Date()) / 1000) : '-'}</td>
            <td class="time-cell ${route276[1] ? getETAClassKMB(route276[1].eta) : ''}">${route276[1] ? formatTime((new Date(route276[1].eta) - new Date()) / 1000) : '-'}</td>
            <td class="time-cell ${route276[2] ? getETAClassKMB(route276[2].eta) : ''}">${route276[2] ? formatTime((new Date(route276[2].eta) - new Date()) / 1000) : '-'}</td>
        </tr>`;

        // K65
        html += `<tr class="table-row train-badge">
            <td class="route-badge badge-up">🚌 K65</td>
            <td colspan="3"></td>
        </tr>`;
        html += `<tr class="table-row train-mtr">
            <td class="direction-label">📤 往流浮山</td>
            <td class="time-cell">${k65Buses[0]?.departureTimeText || '-'}</td>
            <td class="time-cell">${k65Buses[1]?.departureTimeText || '-'}</td>
            <td class="time-cell">${k65Buses[2]?.departureTimeText || '-'}</td>
        </tr>`;

        html += '</tbody></table>';

        document.getElementById(contentId).innerHTML = html;
        document.getElementById(loadingId).style.display = 'none';
        document.getElementById(contentId).style.display = 'block';
    } catch (error) {
        console.error('屏欣苑查詢失敗:', error);
        document.getElementById(loadingId).style.display = 'none';
        showError(stationId, '無法獲取班次數據');
    }
}

function getETAClassKMB(etaString) {
    const seconds = (new Date(etaString) - new Date()) / 1000;
    const minutes = Math.round(seconds / 60);
    if (minutes === 0) return 'arriving';
    if (minutes <= 3) return 'soon';
    return '';
}

async function updateTianshui() {
    const loadingId = 'tianshui-loading';
    const contentId = 'tianshui-content';
    const stationId = 'tianshui';

    document.getElementById(loadingId).style.display = 'block';
    document.getElementById(contentId).style.display = 'none';
    clearError(stationId);

    const trainData = await fetchMTRTrainETA('TML', 'TIS');

    if (!trainData) {
        document.getElementById(loadingId).style.display = 'none';
        showError(stationId, '無法獲取列車數據，請稍候重試...');
        return;
    }

    let html = '<table class="bus-table"><tbody>';
    html += '<tr class="table-header"><td></td><td>最快</td><td>下一班</td><td>下下班</td></tr>';

    const upTrains = trainData.UP || [];
    const downTrains = trainData.DOWN || [];

    // 屯馬
    html += `<tr class="table-row train-badge">
        <td class="route-badge badge-up">🚆 屯馬</td>
        <td colspan="3"></td>
    </tr>`;

    // 往烏溪沙
    html += `<tr class="table-row train-mtr">
        <td class="direction-label">📥 往烏溪沙</td>
        <td class="time-cell">${downTrains[0]?.ttnt || '-'} 分</td>
        <td class="time-cell">${downTrains[1]?.ttnt || '-'} 分</td>
        <td class="time-cell">${downTrains[2]?.ttnt || '-'} 分</td>
    </tr>`;

    // 往屯門
    html += `<tr class="table-row train-mtr">
        <td class="direction-label">📤 往屯門</td>
        <td class="time-cell">${upTrains[0]?.ttnt || '-'} 分</td>
        <td class="time-cell">${upTrains[1]?.ttnt || '-'} 分</td>
        <td class="time-cell">${upTrains[2]?.ttnt || '-'} 分</td>
    </tr>`;

    html += '</tbody></table>';

    document.getElementById(contentId).innerHTML = html;
    document.getElementById(loadingId).style.display = 'none';
    document.getElementById(contentId).style.display = 'block';
}

window.addEventListener('load', function () {
    updateAllStations();
    document.getElementById('lastUpdated').textContent = formatLastUpdated(new Date());
    updateInterval = setInterval(() => {
        updateAllStations();
        document.getElementById('lastUpdated').textContent = formatLastUpdated(new Date());
    }, 10000);
});

window.addEventListener('beforeunload', function () {
    if (updateInterval) clearInterval(updateInterval);
});
