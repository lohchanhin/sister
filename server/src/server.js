/**
 * 伺服器入口 (server.js)
 * -------------------------------------------------------------------
 * • 若偵測到環境變數 GCS_KEY_JSON（或舊名 GCP_SA_KEY）為 Base64：
 *     1. 解碼寫入 /tmp/gcp-key.json
 *     2. 設定 GOOGLE_APPLICATION_CREDENTIALS，讓 Google SDK 走 ADC
 * -------------------------------------------------------------------
 */

import express          from 'express'
import cors             from 'cors'
import cookieParser     from 'cookie-parser'
import dotenv           from 'dotenv'
import path             from 'node:path'
import fs               from 'node:fs'
import { fileURLToPath } from 'node:url'

import connectDB                    from './config/db.js'
import { notFound, errorHandler }   from './utils/handleError.js'

/* ---------- 還原 Service-Account 金鑰（方法 2） ---------- */
const base64Key = process.env.GCS_KEY_JSON || process.env.GCP_SA_KEY  // ← 新舊皆可
if (base64Key && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    const keyPath = '/tmp/gcp-key.json'            // Heroku 每次啟動都可寫入 /tmp
    fs.writeFileSync(keyPath, Buffer.from(base64Key, 'base64'))
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath
    console.log('✅ GCP service-account key restored to /tmp/gcp-key.json')
  } catch (err) {
    console.error('❌ Failed to restore GCP key:', err)
  }
}

/* ---------- 初始化 ---------- */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
connectDB()

const app = express()

/* ---------- 通用中介層 ---------- */
app.use(cors({ origin: true, credentials: true }))   // 允許跨域並攜帶 Cookie
app.use(express.json())                              // 解析 JSON
app.use(cookieParser())                              // 解析 Cookie

/* ---------- 路由 ---------- */
import authRoutes         from './routes/auth.routes.js'
import userRoutes         from './routes/user.routes.js'      // ★ Manager 用帳號管理
import assetRoutes        from './routes/asset.routes.js'
import productRoutes      from './routes/product.routes.js'
import folderRoutes       from './routes/folder.routes.js'
import taskRoutes         from './routes/task.routes.js'
import roleRoutes         from './routes/role.routes.js'
import tagRoutes          from './routes/tag.routes.js'
import healthRoutes       from './routes/health.routes.js'
import permissionsRoutes  from './routes/permissions.routes.js'
import menusRoutes        from './routes/menus.routes.js'
import reviewStageRoutes  from './routes/reviewStage.routes.js'
import clientRoutes       from './routes/client.routes.js'
import platformRoutes     from './routes/platform.routes.js'
import adDailyRoutes      from './routes/adDaily.routes.js'
import weeklyNoteRoutes   from './routes/weeklyNote.routes.js'
// import analyticsRoutes  from './routes/analytics.routes.js' // 未啟用

app.use('/api/auth',     authRoutes)
app.use('/api/user',     userRoutes)      // <─ CRUD: GET/POST/PUT/DELETE
app.use('/api/assets',   assetRoutes)
app.use('/api/products', productRoutes)
app.use('/api/folders',  folderRoutes)
app.use('/api/tasks',    taskRoutes)
app.use('/api/roles',    roleRoutes)
app.use('/api/tags',     tagRoutes)
app.use('/api/clients',  clientRoutes)
app.use('/api/clients/:clientId/platforms', platformRoutes)
app.use('/api/clients/:clientId/platforms/:platformId/ad-daily', adDailyRoutes)
app.use('/api/clients/:clientId/platforms/:platformId/weekly-notes', weeklyNoteRoutes)
app.use('/api/permissions', permissionsRoutes)
app.use('/api/menus', menusRoutes)
app.use('/api/review-stages', reviewStageRoutes)
app.use('/api/health',   healthRoutes)
// app.use('/api/analytics', analyticsRoutes)

/* ---------- 前端靜態檔案 ---------- */
const clientDist = path.resolve(__dirname, '../../client/dist')
app.use(express.static(clientDist))
app.get('*', (_, res) => res.sendFile(path.join(clientDist, 'index.html')))

/* ---------- 404 與錯誤處理 ---------- */
app.use(notFound)
app.use(errorHandler)

/* ---------- 啟動 ---------- */
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
})
