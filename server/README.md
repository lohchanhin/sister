# Marketing System Server

> VERTEX SOLUTION 內部行銷系統 – Node.js + Express + MongoDB

## 安裝
\`\`\`bash
npm install
npm start                 # 啟動伺服器
\`\`\`

伺服器啟動前請在根目錄複製 `.env.example` 為 `.env`，並填入 MongoDB、JWT 及 GCS 設定。
如需允許新的前端網域，請在 `.env` 中設定 `CORS_ALLOW_LIST`（逗號分隔）。

`.env` 中的 `UPLOAD_DIR` 可指定暫存上傳檔案的資料夾，預設值為 `/tmp/uploads`。

執行 `npm run seed` 可建立預設帳號，方便初次測試。
若升級 adData 後資料結構有調整，請先以 `mongodump` 備份資料庫，並執行
`npm run migrate-extra-data` 轉換舊有資料；如資料欄位含有數字字串（例如帶幣別前綴），
可額外執行 `npm run sanitize-ad-daily` 進行清理。若腳本執行過程發生錯誤，請依錯誤訊息
檢查並修正資料後重新執行，必要時可還原備份。

預設登入資訊如下：

| 帳號 | 密碼  | 角色 |
|------|-------|------|
| employee  | 123456 | employee |
| manager   | 123456 | manager  |
| outsource | 123456 | outsource |

## 權限對應表
系統操作皆需賦予相應權限，下表列出各權限代碼及其用途：

| 權限代碼 | 功能說明 |
|-----------|---------|
| `asset:create`  | 素材庫/成品區上傳素材 |
| `asset:read`    | 素材查看 |
| `asset:update`  | 編輯素材資訊或設定可查看者 |
| `asset:delete`  | 刪除素材 |
| `folder:read`   | 資料夾瀏覽 |
| `folder:manage` | 新增、編輯或刪除資料夾及設定可查看者 |
| `user:manage`   | 管理使用者帳號 |
| `task:manage`   | 任務建立與追蹤 |
| `review:manage` | 成品審查流程 |
| `tag:manage`    | 標籤管理 |
| `role:manage`   | 角色權限設定 |
| `analytics:view`| 查看統計資料 |

若要讓某角色具備設定檔案或資料夾「可查看者」的能力，請分別為其啟用 `asset:update` 或 `folder:manage` 權限。

啟動後僅會儲存檔名，API 根路徑為 `/api/*`，
預覽或下載請呼叫相應 API 取得 signed URL。若欲直接下載檔案，可在
`GET /api/assets/:id/url` 後加入 `?download=1`，回傳的 URL 將強制瀏覽器
下載檔案。
亦可執行 `GET /api/health` 測試伺服器是否正常連線。

---

## 啟動與測試
1. **設定 `.env`**：複製 `.env.example`，填入 `MONGODB_URI`、`JWT_SECRET` 以及 GCS 相關參數。
2. **啟動 MongoDB**（本機或 Atlas）。
3. 執行 `npm start`，若看到 `✅ MongoDB 已連線` 與 `🚀 Server running` 即成功。
4. 使用 Postman 或 cURL 測試：
   \`\`\`bash
   # 登入
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
   -d '{"username":"admin","password":"mypwd"}'
   \`\`\`
5. **安裝相依套件**：若尚未安裝，請先執行
   \`\`\`bash
   npm install
   \`\`\`
6. 執行自動化測試：
   \`\`\`bash
   npm test
   \`\`\`
   透過 Jest 與 Supertest 模擬登入，確認回傳資料包含 `token` 與 `user.role`。

## 成品審核 API
素材上傳後若 `type=edited`，預設 `reviewStatus` 為 `pending`。管理者可呼叫
`PUT /api/assets/:id/review` 並傳入 `{ reviewStatus: 'approved' | 'rejected' }`
更新審核狀態。前端可依 `GET /api/assets?type=edited&reviewStatus=pending`
取得待審成品。

## 審查關卡 API
管理者可自 `/api/review-stages` 建立或管理審查關卡，每個關卡包含 `name`、`order` 與 `responsible` 等欄位。

### 成品審查進度
取得某成品的所有審查關卡與完成狀態：

\`\`\`
GET /api/assets/:id/stages
\`\`\`

關卡需依序完成，必須完成上一關後才能更新下一關。

更新某關卡的完成狀態（僅負責人可更新關卡狀態）：

\`\`\`
PUT /api/assets/:id/stages/:stageId { completed: true | false }
\`\`\`

## 批次設定可查看者
一次更新多個素材或資料夾的 `allowedUsers`：

\`\`\`bash
PUT /api/assets/viewers  { ids: [id], allowedUsers: [userId] }
PUT /api/folders/viewers { ids: [id], allowedUsers: [userId] }
\`\`\`

## 客戶與廣告資料 API
下列為常見操作範例：
\`\`\`bash
# 取得使用者列表
GET /api/user

# 新增使用者
POST /api/user { username, password }

# 取得廣告成效摘要
GET /api/analytics
\`\`\`
新增廣告每日資料可呼叫：
\`\`\`bash
POST /api/clients/:clientId/platforms/:platformId/ad-daily { date, spent, ... }
\`\`\`
批次匯入：
\`\`\`bash
POST /api/clients/:clientId/platforms/:platformId/ad-daily/import (multipart/form-data)
\`\`\`
目前不需額外的環境變數即可使用。
