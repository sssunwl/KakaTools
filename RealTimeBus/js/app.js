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
    updateTianshengYuan();
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
    html += '<tr class="table-header"><td>路線</td><td>最快</td><td>下一班</td><td>下下班</td></tr>';

    // K75A
    html += `<tr class="table-row route-name-row">
        <td colspan="4" class="route-badge badge-k75a">K75A</td>
    </tr>`;
    html += `<tr class="table-row row-k75a">
        <td class="direction-label">-</td>
        <td class="time-cell">${mtrK75aData?.[0]?.time || '-'}</td>
        <td class="time-cell">${mtrK75aData?.[1]?.time || '-'}</td>
        <td class="time-cell">${mtrK75aData?.[2]?.time || '-'}</td>
    </tr>`;

    // K75P
    html += `<tr class="table-row route-name-row">
        <td colspan="4" class="route-badge badge-k75p">K75P</td>
    </tr>`;
    html += `<tr class="table-row row-k75p">
        <td class="direction-label">-</td>
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

    html += `<tr class="table-row route-name-row">
        <td colspan="4" class="route-badge badge-53">53</td>
    </tr>`;

    // 往荃灣
    html += `<tr class="table-row row-53">
        <td class="direction-label">往荃灣</td>
        <td class="time-cell ${outbound?.className || ''}">${outbound?.formattedETA || '-'}</td>
        <td class="time-cell ${outbound2?.className || ''}">${outbound2?.formattedETA || '-'}</td>
        <td class="time-cell ${outbound3?.className || ''}">${outbound3?.formattedETA || '-'}</td>
    </tr>`;

    // 往元朗
    html += `<tr class="table-row row-53">
        <td class="direction-label">往元朗</td>
        <td class="time-cell ${inbound?.className || ''}">${inbound?.formattedETA || '-'}</td>
        <td class="time-cell ${inbound2?.className || ''}">${inbound2?.formattedETA || '-'}</td>
        <td class="time-cell ${inbound3?.className || ''}">${inbound3?.formattedETA || '-'}</td>
    </tr>`;

    html += '</tbody></table>';

    document.getElementById(contentId).innerHTML = html;
    document.getElementById(loadingId).style.display = 'none';
    document.getElementById(contentId).style.display = 'block';
}

async function updateTianshengYuan() {
    const loadingId = 'tianshengyuan-loading';
    const contentId = 'tianshengyuan-content';
    const stationId = 'tianshengyuan';

    document.getElementById(loadingId).style.display = 'block';
    document.getElementById(contentId).style.display = 'none';
    clearError(stationId);

    try {
        // 並行獲取 K65 和 K75A 數據
        const [k65Res, k75aRes] = await Promise.all([
            fetch('https://rt.data.gov.hk/v1/transport/mtr/bus/getSchedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: 'zh', routeName: 'K65' })
            }),
            fetch('https://rt.data.gov.hk/v1/transport/mtr/bus/getSchedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: 'zh', routeName: 'K75A' })
            })
        ]);

        const k65Data = await k65Res.json();
        const k75aData = await k75aRes.json();

        // K65 去程（K65-U120 天盛苑/天水圍站）
        const k65UpStop = (k65Data.busStop || []).find(s => s.busStopId === 'K65-U120');
        const k65UpBuses = (k65UpStop?.bus || []).slice(0, 3);

        // K65 回程（K65-D100 天盛苑/天水圍站）
        const k65DownStop = (k65Data.busStop || []).find(s => s.busStopId === 'K65-D100');
        const k65DownBuses = (k65DownStop?.bus || []).slice(0, 3);

        // K75A 往洪水橋（K75A-U010）
        const k75aUpStop = (k75aData.busStop || []).find(s => s.busStopId === 'K75A-U010');
        const k75aUpBuses = (k75aUpStop?.bus || []).slice(0, 3);

        // K75A 回程（K75A-D010）
        const k75aDownStop = (k75aData.busStop || []).find(s => s.busStopId === 'K75A-D010');
        const k75aDownBuses = (k75aDownStop?.bus || []).slice(0, 3);

        let html = '<table class="bus-table"><tbody>';
        html += '<tr class="table-header"><td>路線</td><td>最快</td><td>下一班</td><td>下下班</td></tr>';

        // K65
        html += `<tr class="table-row route-name-row">
            <td colspan="4" class="route-badge badge-up">K65</td>
        </tr>`;
        html += `<tr class="table-row row-k65">
            <td class="direction-label">往流浮山</td>
            <td class="time-cell">${k65UpBuses[0]?.departureTimeText || '-'}</td>
            <td class="time-cell">${k65UpBuses[1]?.departureTimeText || '-'}</td>
            <td class="time-cell">${k65UpBuses[2]?.departureTimeText || '-'}</td>
        </tr>`;
        html += `<tr class="table-row row-k65">
            <td class="direction-label">往元朗站</td>
            <td class="time-cell">${k65DownBuses[0]?.departureTimeText || '-'}</td>
            <td class="time-cell">${k65DownBuses[1]?.departureTimeText || '-'}</td>
            <td class="time-cell">${k65DownBuses[2]?.departureTimeText || '-'}</td>
        </tr>`;

        // K75A
        html += `<tr class="table-row route-name-row">
            <td colspan="4" class="route-badge badge-k75a">K75A</td>
        </tr>`;
        html += `<tr class="table-row row-k75a">
            <td class="direction-label">往洪水橋</td>
            <td class="time-cell">${k75aUpBuses[0]?.departureTimeText || '-'}</td>
            <td class="time-cell">${k75aUpBuses[1]?.departureTimeText || '-'}</td>
            <td class="time-cell">${k75aUpBuses[2]?.departureTimeText || '-'}</td>
        </tr>`;
        html += `<tr class="table-row row-k75a">
            <td class="direction-label">回程</td>
            <td class="time-cell">${k75aDownBuses[0]?.departureTimeText || '-'}</td>
            <td class="time-cell">${k75aDownBuses[1]?.departureTimeText || '-'}</td>
            <td class="time-cell">${k75aDownBuses[2]?.departureTimeText || '-'}</td>
        </tr>`;

        html += '</tbody></table>';

        const contentEl = document.getElementById(contentId);
        contentEl.style.opacity = '0';
        setTimeout(() => {
            contentEl.innerHTML = html;
            document.getElementById(loadingId).style.display = 'none';
            contentEl.style.display = 'block';
            contentEl.style.opacity = '1';
        }, 150);
    } catch (error) {
        console.error('天盛苑查詢失敗:', error);
        document.getElementById(loadingId).style.display = 'none';
        showError(stationId, '無法獲取班次數據');
    }
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
        html += '<tr class="table-header"><td>路線</td><td>最快</td><td>下一班</td><td>下下班</td></tr>';

        // 53
        html += `<tr class="table-row route-name-row">
            <td colspan="4" class="route-badge badge-53">53</td>
        </tr>`;
        html += `<tr class="table-row row-53">
            <td class="direction-label">往元朗形點</td>
            <td class="time-cell ${route53[0] ? getETAClassKMB(route53[0].eta) : ''}">${route53[0] ? formatTime((new Date(route53[0].eta) - new Date()) / 1000) : '-'}</td>
            <td class="time-cell ${route53[1] ? getETAClassKMB(route53[1].eta) : ''}">${route53[1] ? formatTime((new Date(route53[1].eta) - new Date()) / 1000) : '-'}</td>
            <td class="time-cell ${route53[2] ? getETAClassKMB(route53[2].eta) : ''}">${route53[2] ? formatTime((new Date(route53[2].eta) - new Date()) / 1000) : '-'}</td>
        </tr>`;

        // 276
        html += `<tr class="table-row route-name-row">
            <td colspan="4" class="route-badge badge-276">276</td>
        </tr>`;
        html += `<tr class="table-row row-276">
            <td class="direction-label">往上水</td>
            <td class="time-cell ${route276[0] ? getETAClassKMB(route276[0].eta) : ''}">${route276[0] ? formatTime((new Date(route276[0].eta) - new Date()) / 1000) : '-'}</td>
            <td class="time-cell ${route276[1] ? getETAClassKMB(route276[1].eta) : ''}">${route276[1] ? formatTime((new Date(route276[1].eta) - new Date()) / 1000) : '-'}</td>
            <td class="time-cell ${route276[2] ? getETAClassKMB(route276[2].eta) : ''}">${route276[2] ? formatTime((new Date(route276[2].eta) - new Date()) / 1000) : '-'}</td>
        </tr>`;

        // K65
        html += `<tr class="table-row route-name-row">
            <td colspan="4" class="route-badge badge-up">K65</td>
        </tr>`;
        html += `<tr class="table-row row-k65">
            <td class="direction-label">往流浮山</td>
            <td class="time-cell">${k65Buses[0]?.departureTimeText || '-'}</td>
            <td class="time-cell">${k65Buses[1]?.departureTimeText || '-'}</td>
            <td class="time-cell">${k65Buses[2]?.departureTimeText || '-'}</td>
        </tr>`;

        html += '</tbody></table>';

        const contentEl = document.getElementById(contentId);
        contentEl.style.opacity = '0';
        setTimeout(() => {
            contentEl.innerHTML = html;
            document.getElementById(loadingId).style.display = 'none';
            contentEl.style.display = 'block';
            contentEl.style.opacity = '1';
        }, 150);
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
    html += '<tr class="table-header"><td>路線</td><td>最快</td><td>下一班</td><td>下下班</td></tr>';

    const upTrains = trainData.UP || [];
    const downTrains = trainData.DOWN || [];

    // 屯馬
    html += `<tr class="table-row route-name-row">
        <td colspan="4" class="route-badge badge-up">屯馬線</td>
    </tr>`;

    // 往烏溪沙
    html += `<tr class="table-row row-k65">
        <td class="direction-label">往烏溪沙</td>
        <td class="time-cell">${downTrains[0]?.ttnt || '-'}'</td>
        <td class="time-cell">${downTrains[1]?.ttnt || '-'}'</td>
        <td class="time-cell">${downTrains[2]?.ttnt || '-'}'</td>
    </tr>`;

    // 往屯門
    html += `<tr class="table-row row-k65">
        <td class="direction-label">往屯門</td>
        <td class="time-cell">${upTrains[0]?.ttnt || '-'}'</td>
        <td class="time-cell">${upTrains[1]?.ttnt || '-'}'</td>
        <td class="time-cell">${upTrains[2]?.ttnt || '-'}'</td>
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
