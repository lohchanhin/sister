/**
 * 伺服器入口 (server.js)
 * ------------------------------------------------------------
 * 1. 嚴謹 CORS allow-list + credentials
 * 2. Heroku 上自動還原 GCP Service-Account
 * 3. 內建 OPTIONS logging，快速檢查預檢是否命中
 * ------------------------------------------------------------
 */

import express            from 'express'
import cors               from 'cors'
import cookieParser       from 'cookie-parser'
import dotenv             from 'dotenv'
import path               from 'node:path'
import fs                 from 'node:fs'
import { fileURLToPath }  from 'node:url'
import { createCorsOptions } from './config/cors.js'

import mongoose                    from 'mongoose'
import connectDB                   from './config/db.js'
import { notFound, errorHandler }  from './utils/handleError.js'
import AdDaily                     from './models/adDaily.model.js'
import { scheduleAssetCleanup }    from './services/assetCleanupScheduler.js'

/* ────────────────────────── 0. Service-Account 還原 ───────────────────────── */
const base64Key = process.env.GCS_KEY_JSON || process.env.GCP_SA_KEY
if (base64Key && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    const keyPath = '/tmp/gcp-key.json'
    fs.writeFileSync(keyPath, Buffer.from(base64Key, 'base64'))
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath
    console.log('✅ GCP service-account key restored to /tmp/gcp-key.json')
  } catch (err) {
    console.error('❌ Failed to restore GCP key:', err)
  }
}

/* ────────────────────────── 1. 初始化 ───────────────────────── */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
connectDB()
mongoose.connection.once('open', async () => {
  try {
    await AdDaily.syncIndexes()
    console.log('✅ AdDaily indexes synced')
  } catch (err) {
    console.error('❌ Failed to sync AdDaily indexes:', err.message)
  }
})

const app = express()
app.enable('trust proxy')                  // Heroku 需開啟，否則 secure cookie 不生效

/* ────────────────────────── 2. CORS (放最前) ───────────────────────── */
const corsOptions = createCorsOptions()

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))        // 處理所有預檢

/* 觀察每一次 OPTIONS 預檢 ─ 助於除錯 */
app.use((req, _res, next) => {
  if (req.method === 'OPTIONS') {
    console.log(`[OPTIONS] ${req.path}  Origin=${req.headers.origin}`)
  }
  next()
})

/* ────────────────────────── 3. 通用中介層 ───────────────────────── */
app.use(express.json())
app.use(cookieParser())

/* ────────────────────────── 4. 路由載入 ───────────────────────── */
import authRoutes         from './routes/auth.routes.js'
import userRoutes         from './routes/user.routes.js'
import assetRoutes        from './routes/asset.routes.js'
import productRoutes      from './routes/product.routes.js'
import folderRoutes       from './routes/folder.routes.js'
import roleRoutes         from './routes/role.routes.js'
import tagRoutes          from './routes/tag.routes.js'
import healthRoutes       from './routes/health.routes.js'
import permissionsRoutes  from './routes/permissions.routes.js'
import menusRoutes        from './routes/menus.routes.js'
import reviewStageRoutes  from './routes/reviewStage.routes.js'
import clientRoutes       from './routes/client.routes.js'
import platformRoutes     from './routes/platform.routes.js'
import platformTransferRoutes from './routes/platformTransfer.routes.js'
import adDailyRoutes      from './routes/adDaily.routes.js'
import weeklyNoteRoutes   from './routes/weeklyNote.routes.js'
import dashboardRoutes    from './routes/dashboard.routes.js'
import departmentRoutes   from './routes/department.routes.js'
import popularContentRoutes from './routes/popularContent.routes.js'
import scriptIdeaRoutes   from './routes/scriptIdea.routes.js'
import workDiaryRoutes    from './routes/workDiary.routes.js'
import notificationRoutes from './routes/notification.routes.js'

app.use('/api/auth',     authRoutes)
app.use('/api/user',     userRoutes)
app.use('/api/assets',   assetRoutes)
app.use('/api/products', productRoutes)
app.use('/api/folders',  folderRoutes)
app.use('/api/roles',    roleRoutes)
app.use('/api/tags',     tagRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/clients',  clientRoutes)
app.use('/api/clients/:clientId/platforms', platformRoutes)
app.use('/api/platforms', platformTransferRoutes)
app.use('/api/clients/:clientId/platforms/:platformId/ad-daily', adDailyRoutes)
app.use('/api/clients/:clientId/platforms/:platformId/weekly-notes', weeklyNoteRoutes)
app.use('/api/clients/:clientId/popular-contents', popularContentRoutes)
app.use('/api/clients/:clientId/script-ideas', scriptIdeaRoutes)
app.use('/api/work-diaries', workDiaryRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/permissions', permissionsRoutes)
app.use('/api/menus', menusRoutes)
app.use('/api/review-stages', reviewStageRoutes)
app.use('/api/health', healthRoutes)
app.use('/api/dashboard', dashboardRoutes)

/* ────────────────────────── 5. 前端靜態檔案 ───────────────────────── */
const clientDist = path.resolve(__dirname, '../../client/dist')
app.use(express.static(clientDist))
// 只回傳前端入口給非 /api 路徑，避免覆蓋 API 404
app.get(/^\/(?!api).*/, (_, res) =>
  res.sendFile(path.join(clientDist, 'index.html'))
)

/* ────────────────────────── 6. 404 & 全域錯誤 ───────────────────────── */
app.use(notFound)
app.use(errorHandler)

/* ────────────────────────── 7. 啟動 ───────────────────────── */
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
})

scheduleAssetCleanup()
