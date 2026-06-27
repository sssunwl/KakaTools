// RealTimeBus 主應用邏輯

let updateInterval = null;

function showError(message) {
    const container = document.getElementById('errorContainer');
    container.innerHTML = `<div class="error">⚠️ ${message}</div>`;
}

function clearError() {
    document.getElementById('errorContainer').innerHTML = '';
}

function toggleStation() {
    const container = document.getElementById('stationContainer');
    const btn = document.querySelector('.toggle-btn');
    container.classList.toggle('hidden');
    btn.classList.toggle('collapsed');
}

async function updateBusDisplay() {
    const loadingContainer = document.getElementById('loadingContainer');
    const busContainer = document.getElementById('busContainer');
    const lastUpdatedSpan = document.getElementById('lastUpdated');

    loadingContainer.style.display = 'block';
    busContainer.style.display = 'none';
    clearError();

    const [kmbData, mtrK75aData, mtrK75pData] = await Promise.all([
        fetchAllBusData(),
        fetchMTRBusETA('K75A', 'K75A-D020'),
        fetchMTRBusETA('K75P', 'K75P-D010')
    ]);

    if (!kmbData && !mtrK75aData && !mtrK75pData) {
        loadingContainer.style.display = 'none';
        showError('無法獲取實時數據，請稍候重試...');
        return;
    }

    // 構建表格 HTML
    let html = '<table class="bus-table"><tbody>';

    // 表頭
    html += '<tr class="table-header">';
    html += '<td></td>';
    html += '<td>最快</td>';
    html += '<td>下一班</td>';
    html += '</tr>';

    // K75A
    html += '<tr class="table-row">';
    html += '<td class="route-name">K75A</td>';
    html += `<td class="time-cell">${mtrK75aData?.[0]?.time || '-'}</td>`;
    html += `<td class="time-cell">${mtrK75aData?.[1]?.time || '-'}</td>`;
    html += '</tr>';

    // K75P
    html += '<tr class="table-row">';
    html += '<td class="route-name">K75P</td>';
    html += `<td class="time-cell">${mtrK75pData?.[0]?.time || '-'}</td>`;
    html += `<td class="time-cell">${mtrK75pData?.[1]?.time || '-'}</td>`;
    html += '</tr>';

    // KMB 53
    html += '<tr class="table-row kmb-row">';
    html += '<td class="route-name">53</td>';
    html += `<td class="time-cell direction-label">往荃灣</td>`;
    html += `<td class="time-cell direction-label">往元朗</td>`;
    html += '</tr>';

    html += '<tr class="table-row kmb-times">';
    html += '<td></td>';
    const outboundTime = kmbData?.outbound?.[0]?.formattedETA || '-';
    const outboundClass = kmbData?.outbound?.[0]?.className || '';
    const inboundTime = kmbData?.inbound?.[0]?.formattedETA || '-';
    const inboundClass = kmbData?.inbound?.[0]?.className || '';
    html += `<td class="time-cell ${outboundClass}">${outboundTime}</td>`;
    html += `<td class="time-cell ${inboundClass}">${inboundTime}</td>`;
    html += '</tr>';

    html += '</tbody></table>';

    busContainer.innerHTML = html;
    loadingContainer.style.display = 'none';
    busContainer.style.display = 'block';

    lastUpdatedSpan.textContent = formatLastUpdated(new Date());
}

window.addEventListener('load', function () {
    updateBusDisplay();
    updateInterval = setInterval(() => {
        updateBusDisplay();
    }, 10000);
});

window.addEventListener('beforeunload', function () {
    if (updateInterval) clearInterval(updateInterval);
});
