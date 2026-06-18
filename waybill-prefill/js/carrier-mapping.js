// 三家物流商欄位對應表

const CARRIER_FIELDS = {
    dhl: {
        name: 'DHL Express MyDHL+',
        fields: [
            { key: 'ref', label: 'Ref (參考號)', category: 'shipment' },
            { key: 'shipper_name', label: 'Shipper Name (寄件人公司)', category: 'shipper' },
            { key: 'shipper_address', label: 'Shipper Address (寄件地址)', category: 'shipper' },
            { key: 'shipper_city', label: 'Shipper City (寄件城市)', category: 'shipper' },
            { key: 'shipper_postcode', label: 'Shipper Postcode (寄件郵編)', category: 'shipper' },
            { key: 'shipper_country', label: 'Shipper Country (寄件國家)', category: 'shipper' },
            { key: 'shipper_contact', label: 'Shipper Contact (寄件人聯絡人)', category: 'shipper' },
            { key: 'shipper_phone', label: 'Shipper Phone (寄件人電話)', category: 'shipper' },
            { key: 'consignee_name', label: 'Receiver Name (收件人公司)', category: 'consignee' },
            { key: 'consignee_address', label: 'Receiver Address (收件地址)', category: 'consignee' },
            { key: 'consignee_city', label: 'Receiver City (收件城市)', category: 'consignee' },
            { key: 'consignee_postcode', label: 'Receiver Postcode (收件郵編)', category: 'consignee' },
            { key: 'consignee_country', label: 'Receiver Country (收件國家)', category: 'consignee' },
            { key: 'consignee_contact', label: 'Receiver Contact (收件人聯絡人)', category: 'consignee' },
            { key: 'consignee_phone', label: 'Receiver Phone (收件人電話)', category: 'consignee' },
            { key: 'goods_description', label: 'Contents (內容物描述)', category: 'goods' },
            { key: 'hs_code', label: 'HS Code (商品編碼)', category: 'goods' },
            { key: 'declared_value', label: 'Custom Val (申報價值)', category: 'goods' },
            { key: 'currency', label: 'Currency (幣別)', category: 'goods' },
            { key: 'gross_weight_kg', label: 'Cust Decl Shpt Wgt (毛重 kg)', category: 'weight' },
            { key: 'pieces', label: 'Piece (件數)', category: 'weight' },
            { key: 'dimensions', label: 'Dimensions (尺寸)', category: 'dimensions' },
        ]
    },
    fedex: {
        name: 'FedEx Ship Manager',
        fields: [
            { key: 'ref', label: 'Reference # (參考號)', category: 'shipment' },
            { key: 'shipper_name', label: 'Ship From Company Name (寄件公司)', category: 'shipper' },
            { key: 'shipper_address', label: 'Ship From Address (寄件地址)', category: 'shipper' },
            { key: 'shipper_city', label: 'Ship From City (寄件城市)', category: 'shipper' },
            { key: 'shipper_postcode', label: 'Ship From Postal Code (寄件郵編)', category: 'shipper' },
            { key: 'shipper_country', label: 'Ship From Country (寄件國家)', category: 'shipper' },
            { key: 'shipper_contact', label: 'Ship From Contact Name (寄件人)', category: 'shipper' },
            { key: 'shipper_phone', label: 'Ship From Phone (寄件人電話)', category: 'shipper' },
            { key: 'consignee_name', label: 'Recipient Company Name (收件公司)', category: 'consignee' },
            { key: 'consignee_address', label: 'Recipient Address (收件地址)', category: 'consignee' },
            { key: 'consignee_city', label: 'Recipient City (收件城市)', category: 'consignee' },
            { key: 'consignee_postcode', label: 'Recipient Postal Code (收件郵編)', category: 'consignee' },
            { key: 'consignee_country', label: 'Recipient Country (收件國家)', category: 'consignee' },
            { key: 'consignee_contact', label: 'Recipient Contact Name (收件人)', category: 'consignee' },
            { key: 'consignee_phone', label: 'Recipient Phone (收件人電話)', category: 'consignee' },
            { key: 'goods_description', label: 'Description (商品描述)', category: 'goods' },
            { key: 'hs_code', label: 'HS Code (商品編碼)', category: 'goods' },
            { key: 'declared_value', label: 'Declared Value (申報價值)', category: 'goods' },
            { key: 'currency', label: 'Currency (幣別)', category: 'goods' },
            { key: 'gross_weight_kg', label: 'Weight (毛重 kg)', category: 'weight' },
            { key: 'pieces', label: 'Packages (件數)', category: 'weight' },
            { key: 'dimensions', label: 'Dimensions (尺寸)', category: 'dimensions' },
        ]
    },
    ups: {
        name: 'UPS WorldShip',
        fields: [
            { key: 'ref', label: 'Reference # (參考號)', category: 'shipment' },
            { key: 'shipper_name', label: 'Shipper Name (寄件公司)', category: 'shipper' },
            { key: 'shipper_address', label: 'Shipper Address (寄件地址)', category: 'shipper' },
            { key: 'shipper_city', label: 'Shipper City (寄件城市)', category: 'shipper' },
            { key: 'shipper_postcode', label: 'Shipper ZIP Code (寄件郵編)', category: 'shipper' },
            { key: 'shipper_country', label: 'Shipper Country (寄件國家)', category: 'shipper' },
            { key: 'shipper_contact', label: 'Shipper Contact (寄件人)', category: 'shipper' },
            { key: 'shipper_phone', label: 'Shipper Phone (寄件人電話)', category: 'shipper' },
            { key: 'consignee_name', label: 'Recipient Name (收件公司)', category: 'consignee' },
            { key: 'consignee_address', label: 'Recipient Address (收件地址)', category: 'consignee' },
            { key: 'consignee_city', label: 'Recipient City (收件城市)', category: 'consignee' },
            { key: 'consignee_postcode', label: 'Recipient ZIP Code (收件郵編)', category: 'consignee' },
            { key: 'consignee_country', label: 'Recipient Country (收件國家)', category: 'consignee' },
            { key: 'consignee_contact', label: 'Recipient Contact (收件人)', category: 'consignee' },
            { key: 'consignee_phone', label: 'Recipient Phone (收件人電話)', category: 'consignee' },
            { key: 'goods_description', label: 'Description (商品描述)', category: 'goods' },
            { key: 'hs_code', label: 'HS Code (商品編碼)', category: 'goods' },
            { key: 'declared_value', label: 'Declared Value (申報價值)', category: 'goods' },
            { key: 'currency', label: 'Currency (幣別)', category: 'goods' },
            { key: 'gross_weight_kg', label: 'Weight in Pounds (毛重)', category: 'weight', transformer: 'kgToLbs' },
            { key: 'pieces', label: 'Number of Packages (件數)', category: 'weight' },
            { key: 'dimensions', label: 'Package Dimensions (尺寸)', category: 'dimensions' },
        ]
    }
};

// 單位轉換函式
const TRANSFORMERS = {
    kgToLbs: (value) => {
        if (!value) return '';
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        return (num * 2.20462).toFixed(2) + ' lbs';
    }
};

// 取得欄位值（考慮轉換）
function getFieldValue(shipmentData, fieldKey, transformerKey) {
    let value = shipmentData[fieldKey] || '';
    if (transformerKey && TRANSFORMERS[transformerKey]) {
        value = TRANSFORMERS[transformerKey](value);
    }
    return value;
}

// 預設寄件人資訊（Amphenol RF Asia Limited, Hong Kong）
const DEFAULT_SHIPPER = {
    shipper_name: 'Amphenol RF Asia Limited',
    shipper_address: 'DD113 Lot123 Kam Ho Road, Ma On Kong Tsuen',
    shipper_city: 'Yuen Long',
    shipper_postcode: '',
    shipper_country: 'Hong Kong',
    shipper_contact: 'LISA WENG',
    shipper_phone: '+852-3526-1891'
};
