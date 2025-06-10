# Marketing System Server

> VERTEX SOLUTION 內部行銷系統 – Node.js + Express + MongoDB

## 安裝
```bash
cp .env.example .env       # 修改 MongoDB、JWT 等設定
npm install
npm start                 # 啟動伺服器
```

執行 `npm run seed` 可建立預設帳號，方便初次測試。

預設登入資訊如下：

| 帳號 | 密碼  | 角色 |
|------|-------|------|
| employee  | 123456 | employee |
| manager   | 123456 | manager  |
| outsource | 123456 | outsource |

啟動後，可透過 `/static/<檔名>` 存取上傳檔案，API 根路徑為 `/api/*`。
亦可執行 `GET /api/health` 測試伺服器是否正常連線。

---

## 啟動與測試
1. **設定 `.env`**：複製 `.env.example`，填入正確的 `MONGODB_URI` 與 `JWT_SECRET`。
2. **啟動 MongoDB**（本機或 Atlas）。
3. 執行 `npm start`，若看到 `✅ MongoDB 已連線` 與 `🚀 Server running` 即成功。
4. 使用 Postman 或 cURL 測試：
   ```bash
   # 登入
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
   -d '{"username":"admin","password":"mypwd"}'
   ```
5. 執行自動化測試：
   ```bash
   npm test
   ```
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

```
GET /api/assets/:id/stages
```

關卡需依序完成，必須完成上一關後才能更新下一關。

更新某關卡的完成狀態（僅負責人可更新關卡狀態）：

```
PUT /api/assets/:id/stages/:stageId { completed: true | false }
```
