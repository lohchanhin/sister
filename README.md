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
4. 上傳檔案可呼叫 `uploadAssetAuto(file, folderId, extraData)`，其中 `extraData`
   會被加入 `FormData`；剪輯師上傳成品時可傳入 `{ type: 'edited' }`。
   - `<500MB` 會由後端處理 `/api/assets/upload`。
   - `>=500MB` 透過 `/api/assets/presign` 取得 `sessionUri`，前端分段上傳後再建立資料。
5. 素材庫詳情視窗可設定可查看使用者，管理者可指定具有瀏覽權限的帳號。
6. 於素材庫與成品區可批次設定可查看者，選取多項後點擊「批次設定可查看者」。
7. 系統現在支援 `.doc`、`.docx` 與 `.pdf` 檔案預覽，將於對話框以 Google Docs Viewer 內嵌顯示。
8. 可輸入數字設定欄位順序。

## 後端 (server)
1. 進入 `server` 目錄安裝依賴：
   ```bash
   npm install
   ```
伺服器啟動前，請在根目錄複製 `.env.example` 為 `.env`，並依需求調整 MongoDB、JWT、GCS 等設定。
 `.env` 中需填入以下 GCS 相關欄位：

```bash
GCS_PROJECT_ID=你的專案 ID
GCS_BUCKET=你的 Bucket 名稱
GCS_KEY_FILE=service-account.json 路徑
GCS_CORS_ORIGIN=http://localhost:5173
```

此外，可透過 `UPLOAD_DIR` 指定暫存上傳檔案的資料夾，預設為 `/tmp/uploads`。

如未建立過 Bucket，可至 Google Cloud Console：
1. 建立專案並啟用 **Cloud Storage**。
2. 在 Storage 中建立 Bucket，名稱需與 `GCS_BUCKET` 相同。
3. 建立服務帳戶並賦予 **Storage Admin** 權限，下載金鑰檔。
4. 將金鑰檔路徑填入 `GCS_KEY_FILE`。
5. 為讓前端直接與 GCS 通訊，請為 Bucket 設定 CORS：
   1. 建立 `gcs-cors.json` 檔案，內容如下：
      ```json
      [
        {
          "origin": ["http://localhost:5173"],
          "method": ["PUT", "POST"],
          "responseHeader": ["Content-Type"],
          "maxAgeSeconds": 3600
        }
      ]
      ```
   2. 執行 `gsutil cors set gcs-cors.json gs://<你的 Bucket>` 套用設定。
2. 啟動 API：
   ```bash
   npm start
   ```
伺服器啟動後，API 根路徑為 `http://localhost:3000/api`，
上傳後僅會儲存檔名，需另外呼叫 API 取得 signed URL 才能預覽或下載檔案。
若需強制瀏覽器下載檔案，可對 `GET /api/assets/:id/url` 加入 `?download=1`
參數取得下載專用的 URL。
3. 執行測試前請先在 `server` 目錄安裝相依套件：
   ```bash
   npm install
   ```
4. 進行登入測試：
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
資料夾僅顯示其直接包含的成品，不會自動展開子資料夾的內容。
素材庫與成品區的存取權限皆以角色判斷，只有具備相應角色者才能瀏覽。
若有設定審查關卡，點擊成品資訊中的「審查關卡」按鈕可檢視並勾選各階段。
建立資料夾時若指定 `parentId`，此 ID 必須對應既有資料夾，否則 API 會以 400 拒絕請求。

## 廣告數據頁面

此頁面分為「客戶管理 → 平台管理 → 數據管理」三層。路徑分別為：
`/ad-clients`、`/clients/:clientId/platforms`、`/clients/:clientId/platforms/:platformId/data`。
後端對應 `/api/clients/:clientId/platforms/:platformId/ad-daily`，`/weekly` 回傳週統計。
若需批次匯入，可 POST 至 `/api/clients/:clientId/platforms/:platformId/ad-daily/import` 上傳 CSV 或 Excel。

儀表板可透過客戶與平台選單篩選廣告統計。

### 週備註圖片管理

更新週備註（`PUT /api/clients/:clientId/platforms/:platformId/weekly-notes/:week`）
時，如需保留或刪除既有圖片，必須在 `multipart/form-data` 中傳入 `keepImages`：

- `keepImages` 可出現多次，每個值為要**保留**的舊檔名。
- 若 `keepImages` 為空陣列或傳入空字串 `''`，且未上傳新圖片，將會清除所有圖片。
- 未傳入 `keepImages` 時，舊有圖片維持不變。
- `images` 欄位則用來上傳新增的檔案，最終圖片清單會合併 `keepImages` 與新檔案。





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