// RealTimeBus 主應用邏輯

let updateInterval = null;

// 顯示錯誤信息
function showError(message) {
    const container = document.getElementById('errorContainer');
    container.innerHTML = `
        <div class="error">
            ⚠️ ${message}
        </div>
    `;
}

// 清除錯誤信息
function clearError() {
    document.getElementById('errorContainer').innerHTML = '';
}

// 更新 UI
async function updateBusDisplay() {
    const loadingContainer = document.getElementById('loadingContainer');
    const busContainer = document.getElementById('busContainer');
    const lastUpdatedSpan = document.getElementById('lastUpdated');

    loadingContainer.style.display = 'block';
    busContainer.style.display = 'none';
    clearError();

    const busData = await fetchAllBusData();
    console.log('Bus data result:', busData);

    if (!busData || (busData.outbound.length === 0 && busData.inbound.length === 0)) {
        loadingContainer.style.display = 'none';
        const debugMsg = busData ? `無班次數據 (O:${busData.outbound.length}/I:${busData.inbound.length})` : '無法連接 API';
        showError(`無法獲取實時數據: ${debugMsg} | 請打開控制台查看詳情`);
        return;
    }

    // 構建 HTML
    let html = '<div class="bus-list">';

    // 往荃灣
    html += '<div class="direction">';
    html += '<div class="direction-title">📤 往荃灣方向</div>';
    if (busData.outbound.length > 0) {
        html += busData.outbound.map(bus => `
            <div class="bus-item">
                <div class="bus-time">
                    <div class="time-slot">
                        <span class="time-label">下一班</span>
                        <span class="eta ${bus.className}">${bus.formattedETA}</span>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        html += '<div class="bus-item"><p style="color: #aaa;">暫無班次信息</p></div>';
    }
    html += '</div>';

    // 往元朗
    html += '<div class="direction">';
    html += '<div class="direction-title">📥 往元朗 (形點)</div>';
    if (busData.inbound.length > 0) {
        html += busData.inbound.map(bus => `
            <div class="bus-item">
                <div class="bus-time">
                    <div class="time-slot">
                        <span class="time-label">下一班</span>
                        <span class="eta ${bus.className}">${bus.formattedETA}</span>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        html += '<div class="bus-item"><p style="color: #aaa;">暫無班次信息</p></div>';
    }
    html += '</div>';

    html += '</div>';

    // 更新 UI
    busContainer.innerHTML = html;
    loadingContainer.style.display = 'none';
    busContainer.style.display = 'block';

    // 更新最後更新時間
    lastUpdatedSpan.textContent = formatLastUpdated(busData.timestamp);
}

// 初始化
window.addEventListener('load', function () {
    // 第一次載入
    updateBusDisplay();

    // 每 10 秒自動更新
    updateInterval = setInterval(() => {
        updateBusDisplay();
    }, 10000);
});

// 卸載時清除定時器
window.addEventListener('beforeunload', function () {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
