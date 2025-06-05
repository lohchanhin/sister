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
