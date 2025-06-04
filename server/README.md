# Marketing System Server

> **VERTEX SOLUTION 內部行銷系統 – Node.js + Express + MongoDB**

本專案提供一個完整的行銷後端伺服器，包含使用者驗證、內容管理、檔案上傳、以及基本的 RESTful API 範例。  
文件採 **Markdown** 格式編寫，請直接複製整份檔案後貼到 `README.md` 即可。

---

## 1. 系統需求

| 工具 | 版本 (建議) | 說明 |
|------|-------------|------|
| Node.js | ≥ 18.x | 建議 LTS 版本 |
| npm / pnpm / yarn | 內建於 Node.js 或自行安裝 | 本說明以 **npm** 範例為主 |
| MongoDB | ≥ 6.x (本機或 Atlas) | 資料庫 |
| Git | ≥ 2.x | 版本控制 |
| nodemon | 最新 | 開發用熱重載 |

---

## 2. 專案安裝

```bash
git clone https://github.com/vertex-solution/marketing-system-server.git
cd marketing-system-server

# 複製環境變數範例並修改為你的設定
cp .env.example .env       # 修改 MongoDB_URI、JWT_SECRET 等

# 安裝依賴
npm install

# 開發模式 (nodemon 熱重載)
npm run dev
