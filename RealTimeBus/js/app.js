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
