# 🛠️ KakaTools — 工具集

**狀態**：🟢 運行中
**最後更新**：2026-10-25
**GitHub**：https://github.com/sssunwl/KakaTools

---

## 📋 專案簡介

多功能生活與工作工具集，全部使用純前端技術，可直接在 GitHub Pages 運行。

**包含工具**：
- 🎡 三地外食輪盤（沖繩／台灣／香港，可自訂選項、排除食物及依預算／距離／親子情境篩選）
- 🍳 料理靈感產生器（多食材／菜系／時間篩選、剩菜模式、收藏與採買清單）
- 🚌 香港常用路線實時巴士
- 📋 MaSa 運單工具（DHL/FedEx/UPS 預填）
- 🌳 QR 產生器（2D 風格化＋3D 方塊小樹，每張匯出圖都先自動掃描驗證）

---

## 📁 資料夾結構

```
KakaTools/
├── README.md（本文件）
├── index.html                  ← 工具首頁
├── food-wheel/                ← 三地外食輪盤
├── cooking-ideas/             ← 料理靈感產生器
├── RealTimeBus/               ← 香港實時巴士
├── qr/                        ← QR 產生器（規格 docs/QR_PLAN.md）
├── waybill-prefill/            ← MaSa 運單工具
│   ├── index.html
│   ├── js/
│   └── styles/
└── docs/
```

---

## 📊 MaSa 運單工具

**功能**：
- ✅ DHL 運單預填
- ✅ FedEx 運單預填
- ✅ UPS 運單預填
- ✅ GitHub Pages 上線
- ✅ 本機版本

---

## 🌍 訪問

- 🔗 GitHub Pages: https://github.com/sssunwl/KakaTools
- 💾 本機版本可用

## 2026-07-22 工作紀錄

今日新增三地外食輪盤與料理靈感產生器，並重整工具首頁導覽；兩項工具均採純前端實作，已連同 README 更新提交至 `main`。外食輪盤支援沖繩、台灣、香港、自訂與情境篩選，料理工具支援多食材、菜系、時間、剩菜模式、收藏與採買清單。下一步是以手機實際使用情境檢查篩選結果與本機儲存行為，再視家庭使用回饋補充資料。

## 2026-07-23 工作紀錄

完成香港實時巴士頁面的像素風格重整、表格內容置中與車程／距離等顯示單位一致化，並新增 favicon；相關變更已提交至 `main`。下一步仍是以手機實機檢查巴士表格的可讀性、即時資料載入與首頁導覽連結。

## 2026-10-25 工作紀錄

新增 `qr/` QR 產生器（靈感來自 IG 上的 ICQR，自己重寫、不用它的程式）。2D 模式可換前景/背景、線性或放射漸層、四種資料點、方或圓角定位方塊、L/M/Q/H 容錯、中間 logo（自動鎖 H）、PNG/SVG 下載；3D 模式用 three.js 把 QR 做成方塊地面，上面長一棵依連結決定形狀的小樹，有春夏秋、六種葉色、環境音，點樹會摺回可掃描的平面。每張匯出圖下載前都用 jsQR 掃一次，掃不到就停用下載。函式庫全部放在 `qr/vendor/`（qrcode-generator MIT、three.js MIT、jsQR Apache-2.0，見 `qr/vendor/LICENSES.md`），不吃 CDN。驗收：`qr/tests/scan-matrix.html` 1809/1809 通過，實際下載的檔案再用 OpenCV 交叉解碼也一致；圓形定位方塊 OpenCV 解不到，已從選項拿掉。待辦：iPhone 實拍掃描 2D、3D 平面、樹景海報各一張。
