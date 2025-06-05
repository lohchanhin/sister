/**
 * \u4f3a\u670d\u5668\u5165\u53e3
 */
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import path from 'node:path'
import fs from 'node:fs'
import connectDB from './config/db.js'
import { errorHandler, notFound } from './utils/handleError.js'

/* ---------- \u521d\u59cb\u5316 ---------- */
dotenv.config()
connectDB()

const app = express()

/* ---------- \u901a\u7528\u4e2d\u4ecb\u5c64 ---------- */
app.use(cors({ credentials: true, origin: true })) // \u8de8\u57df
app.use(express.json())                            // \u89e3\u6790 JSON
app.use(cookieParser())                            // \u89e3\u6790 Cookie

/* ---------- \u975c\u614b\u6a94\u6848\uff1a\u4e0a\u50b3\u7528 ---------- */
const uploadDir = process.env.UPLOAD_DIR || 'uploads'
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
app.use('/static', express.static(path.resolve(uploadDir)))

/* ---------- \u8def\u7531 ---------- */
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import assetRoutes from './routes/asset.routes.js'
import taskRoutes from './routes/task.routes.js'
import progressRoutes from './routes/progress.routes.js'
import analyticsRoutes from './routes/analytics.routes.js'
import healthRoutes from './routes/health.routes.js'

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/assets', assetRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/health', healthRoutes)

/* ---------- 404 \u8207\u932f\u8aa4\u8655\u7406 ---------- */
app.use(notFound)
app.use(errorHandler)

/* ---------- \u555f\u52d5\u4f3a\u670d\u5668 ---------- */
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`\uD83D\uDE80 Server running on http://localhost:${PORT}`)
})
