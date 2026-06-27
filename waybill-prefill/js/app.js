// 主應用邏輯 - 支援多檔案上傳

let uploadedFiles = {}; // { filename: { file, type } }
let shipmentData = null;

// 拖拉上傳區域
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// 處理上傳的檔案
function handleFiles(files) {
    for (let file of files) {
        if (file.type === 'application/pdf') {
            uploadedFiles[file.name] = {
                file: file,
                type: 'unknown' // 預設為「未指定」
            };
        }
    }
    updateFileList();
    checkReadyToParse();
}

// 更新檔案列表顯示
function updateFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';

    for (const [fileName, fileData] of Object.entries(uploadedFiles)) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        fileInfo.innerHTML = `<div class="file-name">📄 ${fileName}</div>`;

        const typeSelector = document.createElement('div');
        typeSelector.className = 'file-type-selector';
        typeSelector.innerHTML = `
            <label>類型:</label>
            <select onchange="changeFileType('${fileName}', this.value)">
                <option value="unknown">-- 未指定 --</option>
                <option value="invoice" ${fileData.type === 'invoice' ? 'selected' : ''}>Invoice (發票)</option>
                <option value="packing" ${fileData.type === 'packing' ? 'selected' : ''}>Packing List (包裝單)</option>
                <option value="other" ${fileData.type === 'other' ? 'selected' : ''}>其他</option>
            </select>
        `;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove';
        removeBtn.textContent = '移除';
        removeBtn.onclick = () => removeFile(fileName);

        fileItem.appendChild(fileInfo);
        fileItem.appendChild(typeSelector);
        fileItem.appendChild(removeBtn);
        fileList.appendChild(fileItem);
    }
}

// 改變檔案類型
function changeFileType(fileName, newType) {
    if (uploadedFiles[fileName]) {
        uploadedFiles[fileName].type = newType;
        checkReadyToParse();
    }
}

// 移除檔案
function removeFile(fileName) {
    delete uploadedFiles[fileName];
    updateFileList();
    checkReadyToParse();
}

// 檢查是否準備好解析（必須有 Invoice 和 Packing List）
function checkReadyToParse() {
    const parseBtn = document.getElementById('parseBtn');
    const hasInvoice = Object.values(uploadedFiles).some(f => f.type === 'invoice');
    const hasPacking = Object.values(uploadedFiles).some(f => f.type === 'packing');
    parseBtn.disabled = !(hasInvoice && hasPacking);
}

// 解析按鈕點擊事件
document.getElementById('parseBtn').addEventListener('click', async function () {
    const btn = this;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>正在解析 PDF...';

    try {
        const invoiceFile = Object.values(uploadedFiles).find(f => f.type === 'invoice')?.file;
        const packingFile = Object.values(uploadedFiles).find(f => f.type === 'packing')?.file;

        if (!invoiceFile || !packingFile) {
            showError('請確認已上傳並指定 Invoice 和 Packing List');
            btn.innerHTML = '解析 PDF';
            btn.disabled = false;
            return;
        }

        const result = await parseShipment(invoiceFile, packingFile);

        if (result.success) {
            shipmentData = result.data;
            displayResults();
            btn.innerHTML = '✓ 解析完成！';
        } else {
            showError('PDF 解析失敗：' + result.error);
            btn.innerHTML = '解析 PDF';
        }
    } catch (error) {
        showError('發生錯誤：' + error.message);
        btn.innerHTML = '解析 PDF';
    }

    setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = '解析 PDF';
    }, 2000);
});

// 顯示錯誤信息
function showError(message) {
    const container = document.getElementById('errorContainer');
    container.innerHTML = `<div class="error-message">${message}</div>`;
}

// 顯示結果
function displayResults() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.classList.add('show');

    // 清空之前的錯誤信息
    document.getElementById('errorContainer').innerHTML = '';

    // 為三家物流商生成欄位
    for (const carrier of ['dhl', 'fedex', 'ups']) {
        const carrierConfig = CARRIER_FIELDS[carrier];
        const tabContent = document.getElementById(carrier);
        tabContent.innerHTML = '';

        // 分類顯示欄位
        const categories = {};
        for (const field of carrierConfig.fields) {
            if (!categories[field.category]) {
                categories[field.category] = [];
            }
            categories[field.category].push(field);
        }

        // 按類別輸出
        const categoryLabels = {
            shipment: '📍 運單資訊',
            shipper: '📤 寄件人',
            consignee: '📥 收件人',
            goods: '📦 商品',
            weight: '⚖️ 重量',
            dimensions: '📐 尺寸'
        };

        for (const [category, fields] of Object.entries(categories)) {
            if (fields.length === 0) continue;

            const categoryDiv = document.createElement('div');
            categoryDiv.innerHTML = `<h3 style="margin-top: 30px; margin-bottom: 15px; color: #667eea; font-size: 16px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">${categoryLabels[category] || category}</h3>`;

            const fieldsGrid = document.createElement('div');
            fieldsGrid.className = 'fields-grid';

            for (const field of fields) {
                const value = getFieldValue(shipmentData, field.key, field.transformer);
                const fieldCard = createFieldCard(field.label, value, field.key);
                fieldsGrid.appendChild(fieldCard);
            }

            categoryDiv.appendChild(fieldsGrid);
            tabContent.appendChild(categoryDiv);
        }
    }

    // 切換到第一個 Tab
    switchTab('dhl');
}

// 建立欄位卡片
function createFieldCard(label, value, key) {
    const card = document.createElement('div');
    card.className = 'field-card';

    const isEmpty = !value || value === '';
    if (isEmpty) {
        card.classList.add('error');
    }

    const labelDiv = document.createElement('div');
    labelDiv.className = 'field-label';
    labelDiv.textContent = label;

    const valueDiv = document.createElement('div');
    valueDiv.className = 'field-value';
    if (isEmpty) {
        valueDiv.classList.add('missing');
        valueDiv.textContent = '（未找到或留空）';
    } else {
        valueDiv.textContent = value;
    }

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-copy';
    copyBtn.textContent = '📋 複製';
    copyBtn.onclick = () => copyToClipboard(value, copyBtn);

    card.appendChild(labelDiv);
    card.appendChild(valueDiv);
    card.appendChild(copyBtn);

    return card;
}

// 複製到剪貼簿
function copyToClipboard(text, btn) {
    if (!text || text === '') {
        alert('欄位為空，無法複製');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.textContent;
        btn.textContent = '✓ 已複製';
        btn.classList.add('copied');

        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('copied');
        }, 1500);
    }).catch(err => {
        alert('複製失敗：' + err);
    });
}

// Tab 切換
function switchTab(tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    if (tabContents) {
        tabContents.forEach(tab => {
            if (tab) tab.classList.remove('show');
        });
    }

    const buttons = document.querySelectorAll('.tab-btn');
    if (buttons) {
        buttons.forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
    }

    const tabElement = document.getElementById(tabName);
    if (tabElement) {
        tabElement.classList.add('show');
    }

    if (event && event.target && event.target.classList) {
        event.target.classList.add('active');
    } else {
        const firstBtn = document.querySelector('.tab-btn');
        if (firstBtn && firstBtn.classList) {
            firstBtn.classList.add('active');
        }
    }
}

// 初始化
window.addEventListener('load', function () {
    checkReadyToParse();
});
