# 影片素材與進度追蹤系統

此專案包含前端與後端兩個部分，分別位於 `client/` 與 `server/` 目錄。
前端採用 **Vue 3 + Vite** 並整合 **Element Plus**，後端則使用 **Node.js + Express** 搭配 **MongoDB**。

## 前端 (client)
1. 進入 `client` 目錄安裝依賴：
   ```bash
   npm install
   ```
2. 啟動開發伺服器：
   ```bash
   npm run dev
   ```
   預設服務於 `http://localhost:5173`。
3. 如需連接後端，可在 `.env` 檔中設定 `VITE_API_BASE`，預設為 `http://localhost:3000/api`。
4. 上傳檔案可呼叫 `uploadAsset(file, folderId, extraData)`，其中 `extraData`
   會被加入 `FormData`；剪輯師上傳成品時可傳入 `{ type: 'edited' }`。

## 後端 (server)
1. 進入 `server` 目錄安裝依賴並設定環境：
   ```bash
   cp .env.example .env     # 調整 MongoDB、JWT 等設定
   npm install
   ```
2. 啟動 API：
   ```bash
   npm start
   ```
   伺服器啟動後，API 根路徑為 `http://localhost:3000/api`，
   靜態檔案可自 `/static/<檔名>` 存取。
3. 進行登入測試：
   ```bash
   npm test
   ```
   這會在 `server` 目錄執行 Jest 測試，模擬 POST `/api/auth/login`。


## 根目錄一鍵啟動
根目錄已新增 `package.json`，安裝相依套件後即可同時啟動前後端。
首次啟動前，請先於 `client` 與 `server` 目錄分別執行 `npm install`：
```bash
npm install       # 安裝根目錄套件，第一次執行即可
npm run dev       # 同時啟動 client 與 server
```
此指令會分別執行 `client` 的 `npm run dev` 與 `server` 的 `npm run dev`，方便在開發時一鍵啟動。

## 專案結構簡述
```
client/  # 前端程式碼
server/  # 後端 API
```

更多細節請分別參閱各目錄下的 README。歡迎依需求擴充功能。

## 成品區
新增的成品區僅顯示 `type=edited` 的素材，管理者可在此審核成品並決定是否通過或退回。
前端路徑為 `/products`，員工與管理者皆可瀏覽。
