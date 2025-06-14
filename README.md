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
5. 批量修改素材可查看者：`updateAssetsViewers(ids, users)`，參數為素材 `_id` 陣列與使用者 `_id` 陣列。
6. 批量修改資料夾可查看者：`updateFoldersViewers(ids, users)`，參數為資料夾 `_id` 陣列與使用者 `_id` 陣列。
7. 素材庫詳情視窗可設定「可查看者」，管理者可指定可瀏覽的使用者。

## 後端 (server)
1. 進入 `server` 目錄安裝依賴：
   ```bash
   npm install
   ```
   伺服器啟動前，請在根目錄複製 `.env.example` 為 `.env`，並依需求調整 MongoDB、JWT 等設定。
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

### 雲端資料庫
若需要在雲端部署 MongoDB，可考慮使用 MongoDB Atlas：
1. 造訪 <https://www.mongodb.com/cloud/atlas> 註冊帳號並建立專案與 Cluster。
2. 在 Cluster 頁面選擇 **Connect → Drivers**，複製連線字串。
3. 編輯 `server/.env`，將 `MONGODB_URI` 改為取得的 Atlas URI：
   ```bash
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/mydb
   ```
4. 上傳資料或執行遷移前，請務必先備份現有資料。


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
相對地，素材庫 `/assets` 只會呈現 `type=raw` 的素材。
若有設定審查關卡，點擊成品資訊中的「審查關卡」按鈕可檢視並勾選各階段。
素材庫工具列新增「批量設定可查看者」，可勾選多筆素材或資料夾後一次變更其 `allowedUsers`，對應 API 為 `PUT /api/assets/viewers` 與 `PUT /api/folders/viewers`。

## 廣告數據頁面
此頁面匯集各廣告平台的曝光與點擊統計，路徑為 `/ads`。目前後端示範提供 `/api/analytics` 取得資料，未來可依需求串接第三方服務。


## Heroku 部署
以下為將專案部署至 **Heroku** 的基本流程：

1. **設定環境變數**：在 Heroku 後台依序新增
   `MONGODB_URI`、`JWT_SECRET`、`JWT_EXPIRES_IN` 及 `UPLOAD_DIR` 等欄位，
   值可參考 `server/.env.example`。
2. **部署程式碼**：登入後建立應用程式並執行
   ```bash
   heroku login
   heroku create <app-name>
   git push heroku main
   ```
   Heroku 會在部署後自動執行 `heroku-postbuild` 產生前端靜態檔，
   接著根據 `Procfile` 內容啟動伺服器。

## 部署
前端建置後將輸出至 `client/dist`，可透過下列指令產生靜態檔案：

```bash
npm --prefix client run build
```

完成後啟動後端即可同時提供 API 與前端頁面：

```bash
npm --prefix server start
```