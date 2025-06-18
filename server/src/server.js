/**
 * 伺服器入口 (server.js)
 */
import express        from 'express'
import cors           from 'cors'
import cookieParser   from 'cookie-parser'
import dotenv         from 'dotenv'
import path           from 'node:path'
import { fileURLToPath } from 'node:url'

import connectDB                    from './config/db.js'
import { notFound, errorHandler }   from './utils/handleError.js'

/* ---------- 初始化 ---------- */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
connectDB()

const app = express()

/* ---------- 通用中介層 ---------- */
app.use(cors({ origin: true, credentials: true }))   // 允許跨域並攜帶 Cookie
app.use(express.json())                              // 解析 JSON
app.use(cookieParser())                              // 解析 Cookie

/* ---------- 靜態檔案（上傳用） ----------
 * 改由 GCS 提供檔案 URL
 */

/* ---------- 路由 ---------- */
import authRoutes     from './routes/auth.routes.js'
import userRoutes     from './routes/user.routes.js'      // ★ Manager 用帳號管理
import assetRoutes    from './routes/asset.routes.js'
import productRoutes  from './routes/product.routes.js'
import folderRoutes   from './routes/folder.routes.js'
import taskRoutes     from './routes/task.routes.js'
import roleRoutes     from './routes/role.routes.js'
import tagRoutes      from './routes/tag.routes.js'
import healthRoutes   from './routes/health.routes.js'
import permissionsRoutes from './routes/permissions.routes.js'
import menusRoutes from './routes/menus.routes.js'
import reviewStageRoutes from './routes/reviewStage.routes.js'
import clientRoutes     from './routes/client.routes.js'
import platformRoutes   from './routes/platform.routes.js'
import adDailyRoutes    from './routes/adDaily.routes.js'
import weeklyNoteRoutes from './routes/weeklyNote.routes.js'
// import analyticsRoutes from './routes/analytics.routes.js' // 未啟用

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
