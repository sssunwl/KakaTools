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

    // 構建 3 欄 HTML
    let html = '<div class="bus-grid">';

    // 第 1 欄：KMB 53
    html += '<div class="route-column">';
    html += '<div class="route-title">📌 KMB 53</div>';
    if (kmbData?.outbound?.length > 0) {
        html += '<div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">往荃灣</div>';
        html += `<div class="route-item">
            <div class="route-item-label">最快</div>
            <div class="route-item-time ${kmbData.outbound[0].className}">${kmbData.outbound[0].formattedETA}</div>
        </div>`;
        if (kmbData.outbound.length > 1) {
            html += `<div class="route-item">
                <div class="route-item-label">下一班</div>
                <div class="route-item-time">${kmbData.outbound[1].formattedETA}</div>
            </div>`;
        }
    }
    if (kmbData?.inbound?.length > 0) {
        html += '<div style="font-size: 12px; color: #aaa; margin-top: 15px; margin-bottom: 5px;">往元朗</div>';
        html += `<div class="route-item">
            <div class="route-item-label">最快</div>
            <div class="route-item-time ${kmbData.inbound[0].className}">${kmbData.inbound[0].formattedETA}</div>
        </div>`;
        if (kmbData.inbound.length > 1) {
            html += `<div class="route-item">
                <div class="route-item-label">下一班</div>
                <div class="route-item-time">${kmbData.inbound[1].formattedETA}</div>
            </div>`;
        }
    }
    html += '</div>';

    // 第 2 欄：K75A
    html += '<div class="route-column">';
    html += '<div class="route-title">🚌 K75A</div>';
    if (mtrK75aData?.length > 0) {
        html += `<div class="route-item">
            <div class="route-item-label">最快</div>
            <div class="route-item-time">${mtrK75aData[0].time}</div>
        </div>`;
        if (mtrK75aData.length > 1) {
            html += `<div class="route-item">
                <div class="route-item-label">下一班</div>
                <div class="route-item-time">${mtrK75aData[1].time}</div>
            </div>`;
        }
    } else {
        html += '<div style="color: #aaa;">暫無班次</div>';
    }
    html += '</div>';

    // 第 3 欄：K75P
    html += '<div class="route-column">';
    html += '<div class="route-title">🚌 K75P</div>';
    if (mtrK75pData?.length > 0) {
        html += `<div class="route-item">
            <div class="route-item-label">最快</div>
            <div class="route-item-time">${mtrK75pData[0].time}</div>
        </div>`;
        if (mtrK75pData.length > 1) {
            html += `<div class="route-item">
                <div class="route-item-label">下一班</div>
                <div class="route-item-time">${mtrK75pData[1].time}</div>
            </div>`;
        }
    } else {
        html += '<div style="color: #aaa;">暫無班次</div>';
    }
    html += '</div>';

    html += '</div>';

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
