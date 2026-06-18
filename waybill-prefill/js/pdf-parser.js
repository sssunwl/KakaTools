// PDF 解析邏輯

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = async (e) => {
            try {
                const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    text += textContent.items.map(item => item.str).join(' ') + '\n';
                }
                resolve(text);
            } catch (error) {
                reject(error);
            }
        };
        fileReader.onerror = (error) => reject(error);
        fileReader.readAsArrayBuffer(file);
    });
}

// 從 Invoice PDF 解析資訊
function parseInvoice(text) {
    const data = {};

    // Invoice No
    const invoiceMatch = text.match(/INVOICE\s+NO[:\s]+([A-Z0-9]+)/i);
    data.ref = invoiceMatch ? invoiceMatch[1].trim() : '';

    // Date
    const dateMatch = text.match(/DATE[:\s]+(\d{8}|\d{4}[-/]\d{2}[-/]\d{2})/i);
    data.invoice_date = dateMatch ? dateMatch[1].trim() : '';

    // SHIP TO 區塊（收件人）- 尋找「by Flextronics」或「Calea」作為關鍵字分解
    const shipToMatch = text.match(/SHIP\s+TO[:\s]+([\s\S]*?)(?:ATTN:|Terms|Payer|$)/i);
    if (shipToMatch) {
        const shipToBlock = shipToMatch[1].trim();
        // 嘗試用「by」作為分隔點
        const byIndex = shipToBlock.indexOf('by');
        if (byIndex > 0) {
            data.consignee_name = shipToBlock.substring(0, byIndex).trim();
            const addressPart = shipToBlock.substring(byIndex).trim();
            // 第一行「by」開頭的是公司法律名稱
            const lines = addressPart.split(/\n/).map(l => l.trim()).filter(l => l);
            if (lines.length > 1) {
                // 第二行通常是街道地址
                data.consignee_address = lines[1];
            }
            // 最後一行通常含國家和郵編
            if (lines.length > 0) {
                const lastLine = lines[lines.length - 1];
                const countryMatch = lastLine.match(/([A-Z][A-Za-z]+)\s*$/);
                if (countryMatch) {
                    data.consignee_country = countryMatch[1];
                }
                // 尋找郵編（通常是 6 位數字）
                const postcodeMatch = lastLine.match(/(\d{6})/);
                if (postcodeMatch) {
                    data.consignee_postcode = postcodeMatch[1];
                }
            }
        }
    }

    // ATTN (收件人聯絡人) & TEL - 更寬鬆的匹配
    const attnMatch = text.match(/ATTN\s*:\s*([A-Za-z\s.]+?)(?:;|TEL|\n|$)/i);
    if (attnMatch) {
        data.consignee_contact = attnMatch[1].trim();
    }

    const telMatch = text.match(/TEL\s*:\s*(\+?[\d\s\-()]+?)(?:;|Fax|\n|$)/i);
    if (telMatch) {
        data.consignee_phone = telMatch[1].trim();
    }

    // 貨品描述（通常在 INVOICE OF 後面）
    const goodsMatch = text.match(/INVOICE\s+OF\s*:\s*([A-Z\s/\-]+?)(?:TERMS|These|$)/i);
    if (goodsMatch) {
        data.goods_description = goodsMatch[1].trim().replace(/\s+/g, ' ');
    }

    // HS Code
    const hsMatch = text.match(/HS\s+CODE[:\s]*(\d+)/i);
    data.hs_code = hsMatch ? hsMatch[1].trim() : '';

    // 數量（QUANTITY）
    const qtyMatch = text.match(/QUANTITY\s+([A-Z/]*)\s+([\d,]+)/i);
    if (qtyMatch) {
        data.quantity = qtyMatch[2].replace(/,/g, '').trim();
    }

    // 申報金額（TOTAL 或 GRAND TOTAL）
    const totalMatch = text.match(/(?:GRAND\s+)?TOTAL[:\s]*([A-Z]{3})\s+([\d,]+(?:\.\d{2})?)/i);
    if (totalMatch) {
        data.currency = totalMatch[1].trim();
        data.declared_value = totalMatch[2].replace(/,/g, '').trim();
    }

    return data;
}

// 從 Packing List PDF 解析資訊
function parsePackingList(text) {
    const data = {};

    // Invoice No（確認參考號）
    const invoiceMatch = text.match(/INVOICE\s+NO[:\s]*([A-Z0-9]+)/i);
    if (invoiceMatch) {
        data.ref = invoiceMatch[1].trim();
    }

    // N.W. (淨重) - 更寬鬆的匹配，允許 @ 或冒號
    const nwMatch = text.match(/N\.W\.\s*\([^)]*KG[^)]*\)\s*[@:]?\s*([\d.]+)/i);
    data.net_weight_kg = nwMatch ? nwMatch[1].trim() : '';

    // G.W. (毛重) - 更寬鬆的匹配
    const gwMatch = text.match(/G\.W\.\s*\([^)]*KG[^)]*\)\s*[@:]?\s*([\d.]+)/i);
    data.gross_weight_kg = gwMatch ? gwMatch[1].trim() : '';

    // BOX QTY (件數)
    const boxMatch = text.match(/BOX\s+QTY[:\s]*([\d]+)/i);
    data.pieces = boxMatch ? boxMatch[1].trim() : '1';

    // MEASUREMEN (尺寸) - 更靈活的匹配
    const dimsMatch = text.match(/MEASUREMEN[:\s]*(\d+)\s*[\*×xX]\s*(\d+)\s*[\*×xX]\s*(\d+)/i);
    if (dimsMatch) {
        const dims = `${dimsMatch[1]}x${dimsMatch[2]}x${dimsMatch[3]}`;
        data.dimensions = dims;
    }

    return data;
}

// 合併兩份 PDF 解析結果
function mergeShipmentData(invoiceData, packingData) {
    // Packing List 的資訊應該覆蓋 Invoice 的重量資訊（更準確）
    const merged = { ...invoiceData, ...packingData };

    // 添加預設寄件人資訊
    Object.assign(merged, DEFAULT_SHIPPER);

    return merged;
}

// 主解析函式
async function parseShipment(invoiceFile, packingFile) {
    try {
        const invoiceText = await extractTextFromPDF(invoiceFile);
        const packingText = await extractTextFromPDF(packingFile);

        const invoiceData = parseInvoice(invoiceText);
        const packingData = parsePackingList(packingText);
        const shipmentData = mergeShipmentData(invoiceData, packingData);

        return {
            success: true,
            data: shipmentData,
            rawInvoice: invoiceData,
            rawPacking: packingData
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
