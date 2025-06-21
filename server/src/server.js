/**
 * 伺服器入口 (server.js)
 * ------------------------------------------------------------
 * • 嚴謹 CORS allow-list：確保 Access-Control-Allow-Origin
 *   與 Access-Control-Allow-Credentials 正確返回。
 * • 內建 OPTIONS logging，方便你在 Heroku logs 追 preflight。
 * • 其餘程式碼與原版相同，僅整理 import 與加入少量註解。
 * ------------------------------------------------------------
 */

import express            from 'express'
import cors               from 'cors'
import cookieParser       from 'cookie-parser'
import dotenv             from 'dotenv'
import path               from 'node:path'
import fs                 from 'node:fs'
import { fileURLToPath }  from 'node:url'

import connectDB                    from './config/db.js'
import { notFound, errorHandler }   from './utils/handleError.js'

/* ---------- Service-Account 金鑰還原 ---------- */
const base64Key = process.env.GCS_KEY_JSON || process.env.GCP_SA_KEY
if (base64Key && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    const keyPath = '/tmp/gcp-key.json'   // Heroku 的可寫目錄
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

/* ---------- CORS 設定 ---------- */
const allowList = [
  'https://www.golden-goose-media.com',   // 🚩 你的正式前端網域
  'http://localhost:5173',                // 本機開發 vite
  'http://localhost:3000'
]

const corsOptions = {
  origin: (origin, cb) => {
    // allow Postman / server-to-server（沒有 Origin header）
    if (!origin) return cb(null, true)
    if (allowList.includes(origin)) return cb(null, true)
    console.warn('[CORS] block origin =', origin)
    return cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization,Accept'
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))     // 處理所有預檢

/* --- 觀察每一次請求（尤其是 OPTIONS） ----------------------- */
app.use((req, _res, next) => {
  if (req.method === 'OPTIONS') {
    console.log(`[OPTIONS] ${req.path}  Origin=${req.headers.origin}`)
  }
  next()
})

/* ---------- 通用中介層 ---------- */
app.use(express.json())
app.use(cookieParser())

/* ---------- 路由 ---------- */
import authRoutes         from './routes/auth.routes.js'
import userRoutes         from './routes/user.routes.js'
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

app.use('/api/auth',     authRoutes)
app.use('/api/user',     userRoutes)
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
app.use('/api/health', healthRoutes)

/* ---------- 靜態檔 (前端) ---------- */
const clientDist = path.resolve(__dirname, '../../client/dist')
app.use(express.static(clientDist))
app.get('*', (_, res) => res.sendFile(path.join(clientDist, 'index.html')))

/* ---------- 404 / 全域錯誤 ---------- */
app.use(notFound)
app.use(errorHandler)

/* ---------- 啟動 ---------- */
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
})
